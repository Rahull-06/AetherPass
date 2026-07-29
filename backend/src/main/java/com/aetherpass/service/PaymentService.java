package com.aetherpass.service;

import com.aetherpass.config.PaymentProperties;
import com.aetherpass.dto.request.CreatePaymentOrderRequest;
import com.aetherpass.dto.request.VerifyPaymentRequest;
import com.aetherpass.dto.response.BookingResponse;
import com.aetherpass.dto.response.PaymentOrderResponse;
import com.aetherpass.entity.Booking;
import com.aetherpass.entity.Payment;
import com.aetherpass.entity.User;
import com.aetherpass.exception.ApiException;
import com.aetherpass.repository.PaymentRepository;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.UUID;

/**
 * Payment flow:
 * 1) create order (MOCK or Razorpay)
 * 2) client pays / mock-completes
 * 3) verify signature -> mark PAID -> confirm booking seats/tickets
 * 4) webhook (payment.captured) as backup confirmation
 */
@Service
@Slf4j
@Transactional
public class PaymentService {

    public static final String STATUS_CREATED = "CREATED";
    public static final String STATUS_PAID = "PAID";
    public static final String STATUS_FAILED = "FAILED";
    public static final String STATUS_REFUNDED = "REFUNDED";

    private final PaymentProperties properties;
    private final PaymentRepository paymentRepository;
    private final BookingService bookingService;

    public PaymentService(
            PaymentProperties properties,
            PaymentRepository paymentRepository,
            @Lazy BookingService bookingService
    ) {
        this.properties = properties;
        this.paymentRepository = paymentRepository;
        this.bookingService = bookingService;
    }

    public PaymentOrderResponse createOrder(String userEmail, CreatePaymentOrderRequest request) {
        Booking booking = bookingService.requireOwnedPendingForPayment(userEmail, request.getBookingId());
        User user = booking.getUser();

        Payment payment = paymentRepository.findByBookingId(booking.getId()).orElse(null);
        if (payment != null && STATUS_PAID.equals(payment.getStatus())) {
            throw new ApiException("Booking is already paid", HttpStatus.CONFLICT, "ALREADY_PAID");
        }

        long amountPaise = toPaise(booking.getTotalAmount());
        boolean mock = isMock();

        if (payment == null) {
            payment = Payment.builder()
                    .booking(booking)
                    .provider(mock ? "MOCK" : "RAZORPAY")
                    .amount(booking.getTotalAmount())
                    .currency(booking.getCurrency())
                    .status(STATUS_CREATED)
                    .build();
        } else {
            payment.setStatus(STATUS_CREATED);
            payment.setAmount(booking.getTotalAmount());
            payment.setCurrency(booking.getCurrency());
            payment.setProvider(mock ? "MOCK" : "RAZORPAY");
            payment.setProviderPaymentId(null);
            payment.setPaidAt(null);
        }

        if (mock) {
            String orderId = "order_mock_" + UUID.randomUUID().toString().replace("-", "").substring(0, 14);
            payment.setProviderOrderId(orderId);
            payment.setRawResponse("{\"mock\":true}");
            paymentRepository.save(payment);
            return toOrderResponse(payment, booking, user, true, "mock_key", amountPaise);
        }

        try {
            RazorpayClient client = client();
            JSONObject options = new JSONObject();
            options.put("amount", amountPaise);
            options.put("currency", booking.getCurrency());
            options.put("receipt", booking.getBookingCode());
            options.put("payment_capture", 1);
            JSONObject notes = new JSONObject();
            notes.put("bookingId", booking.getId());
            notes.put("bookingCode", booking.getBookingCode());
            options.put("notes", notes);

            Order order = client.orders.create(options);
            payment.setProviderOrderId(order.get("id"));
            payment.setRawResponse(order.toString());
            paymentRepository.save(payment);

            return toOrderResponse(payment, booking, user, false, properties.getRazorpayKeyId(), amountPaise);
        } catch (RazorpayException ex) {
            log.error("Razorpay order create failed", ex);
            throw new ApiException("Could not create payment order", HttpStatus.BAD_GATEWAY, "PAYMENT_ORDER_FAILED");
        }
    }

    public BookingResponse verify(String userEmail, VerifyPaymentRequest request) {
        Booking booking = bookingService.requireOwnedPendingForPayment(userEmail, request.getBookingId());
        Payment payment = paymentRepository.findByBookingId(booking.getId())
                .orElseThrow(() -> new ApiException("Payment not found. Create an order first.",
                        HttpStatus.BAD_REQUEST, "PAYMENT_NOT_FOUND"));

        if (STATUS_PAID.equals(payment.getStatus()) && BookingService.CONFIRMED.equals(booking.getStatus())) {
            return bookingService.toPublicResponse(booking);
        }

        if (!request.getRazorpayOrderId().equals(payment.getProviderOrderId())) {
            throw new ApiException("Order mismatch", HttpStatus.BAD_REQUEST, "ORDER_MISMATCH");
        }

        if (isMock() || "MOCK".equalsIgnoreCase(payment.getProvider())) {
            if (!request.getRazorpayPaymentId().startsWith("pay_mock_")) {
                throw new ApiException("Invalid mock payment", HttpStatus.BAD_REQUEST, "INVALID_PAYMENT");
            }
        } else {
            try {
                JSONObject options = new JSONObject();
                options.put("razorpay_order_id", request.getRazorpayOrderId());
                options.put("razorpay_payment_id", request.getRazorpayPaymentId());
                options.put("razorpay_signature", request.getRazorpaySignature());
                boolean ok = Utils.verifyPaymentSignature(options, properties.getRazorpayKeySecret());
                if (!ok) {
                    payment.setStatus(STATUS_FAILED);
                    paymentRepository.save(payment);
                    throw new ApiException("Payment signature invalid", HttpStatus.BAD_REQUEST, "INVALID_SIGNATURE");
                }
            } catch (RazorpayException ex) {
                payment.setStatus(STATUS_FAILED);
                paymentRepository.save(payment);
                throw new ApiException("Payment verification failed", HttpStatus.BAD_REQUEST, "VERIFY_FAILED");
            }
        }

        markPaid(payment, request.getRazorpayPaymentId(), new JSONObject()
                .put("razorpay_order_id", request.getRazorpayOrderId())
                .put("razorpay_payment_id", request.getRazorpayPaymentId())
                .put("verified", true)
                .toString());
        return bookingService.confirmAfterPayment(booking.getId());
    }

    /**
     * Demo one-click pay when provider=MOCK (no Razorpay checkout UI).
     */
    public BookingResponse mockComplete(String userEmail, Long bookingId) {
        if (!isMock()) {
            throw new ApiException("Mock payment is disabled", HttpStatus.FORBIDDEN, "MOCK_DISABLED");
        }
        CreatePaymentOrderRequest create = CreatePaymentOrderRequest.builder().bookingId(bookingId).build();
        PaymentOrderResponse order = createOrder(userEmail, create);
        VerifyPaymentRequest verify = VerifyPaymentRequest.builder()
                .bookingId(bookingId)
                .razorpayOrderId(order.getOrderId())
                .razorpayPaymentId("pay_mock_" + UUID.randomUUID().toString().substring(0, 10))
                .razorpaySignature("mock_signature")
                .build();
        return verify(userEmail, verify);
    }

    public void handleWebhook(String payload, String signatureHeader) {
        if (!isMock()) {
            String secret = properties.getRazorpayWebhookSecret();
            if (secret == null || secret.isBlank()) {
                throw new ApiException("Webhook secret not configured", HttpStatus.SERVICE_UNAVAILABLE, "WEBHOOK_DISABLED");
            }
            try {
                Utils.verifyWebhookSignature(payload, signatureHeader, secret);
            } catch (RazorpayException ex) {
                throw new ApiException("Invalid webhook signature", HttpStatus.UNAUTHORIZED, "INVALID_WEBHOOK");
            }
        }

        JSONObject body = new JSONObject(payload);
        String event = body.optString("event");
        if (!"payment.captured".equals(event) && !"payment.authorized".equals(event)) {
            return;
        }

        JSONObject paymentEntity = body.getJSONObject("payload")
                .getJSONObject("payment")
                .getJSONObject("entity");
        String orderId = paymentEntity.optString("order_id");
        String paymentId = paymentEntity.optString("id");
        if (orderId == null || orderId.isBlank()) {
            return;
        }

        Payment payment = paymentRepository.findByProviderOrderId(orderId).orElse(null);
        if (payment == null || STATUS_PAID.equals(payment.getStatus())) {
            return;
        }

        markPaid(payment, paymentId, payload);
        bookingService.confirmAfterPayment(payment.getBooking().getId());
    }

    public void refundIfPaid(Booking booking) {
        Payment payment = paymentRepository.findByBookingId(booking.getId()).orElse(null);
        if (payment == null || !STATUS_PAID.equals(payment.getStatus())) {
            return;
        }

        if (isMock() || "MOCK".equalsIgnoreCase(payment.getProvider())) {
            payment.setStatus(STATUS_REFUNDED);
            payment.setRawResponse("{\"mockRefund\":true}");
            paymentRepository.save(payment);
            return;
        }

        try {
            RazorpayClient client = client();
            JSONObject options = new JSONObject();
            options.put("amount", toPaise(payment.getAmount()));
            client.payments.refund(payment.getProviderPaymentId(), options);
            payment.setStatus(STATUS_REFUNDED);
            paymentRepository.save(payment);
        } catch (RazorpayException ex) {
            log.error("Razorpay refund failed for booking {}", booking.getBookingCode(), ex);
            throw new ApiException("Refund failed. Try again later.", HttpStatus.BAD_GATEWAY, "REFUND_FAILED");
        }
    }

    private void markPaid(Payment payment, String providerPaymentId, String raw) {
        payment.setProviderPaymentId(providerPaymentId);
        payment.setStatus(STATUS_PAID);
        payment.setPaidAt(Instant.now());
        // MySQL JSON column requires valid JSON text
        payment.setRawResponse(raw != null && raw.trim().startsWith("{") ? raw : new JSONObject().put("raw", raw).toString());
        paymentRepository.save(payment);
    }

    private boolean isMock() {
        return !"RAZORPAY".equalsIgnoreCase(properties.getProvider())
                || properties.getRazorpayKeyId() == null
                || properties.getRazorpayKeyId().isBlank()
                || properties.getRazorpayKeySecret() == null
                || properties.getRazorpayKeySecret().isBlank();
    }

    private RazorpayClient client() throws RazorpayException {
        return new RazorpayClient(properties.getRazorpayKeyId(), properties.getRazorpayKeySecret());
    }

    private static long toPaise(BigDecimal amount) {
        return amount.multiply(BigDecimal.valueOf(100)).setScale(0, RoundingMode.HALF_UP).longValueExact();
    }

    private PaymentOrderResponse toOrderResponse(
            Payment payment,
            Booking booking,
            User user,
            boolean mock,
            String keyId,
            long amountPaise
    ) {
        return PaymentOrderResponse.builder()
                .paymentId(payment.getId())
                .bookingId(booking.getId())
                .bookingCode(booking.getBookingCode())
                .provider(payment.getProvider())
                .mock(mock)
                .keyId(keyId)
                .orderId(payment.getProviderOrderId())
                .amount(payment.getAmount())
                .amountPaise(amountPaise)
                .currency(payment.getCurrency())
                .customerName(user.getFullName())
                .customerEmail(user.getEmail())
                .customerPhone(user.getPhone())
                .build();
    }
}
