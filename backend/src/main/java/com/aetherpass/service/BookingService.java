package com.aetherpass.service;

import com.aetherpass.dto.request.ApplyCouponRequest;
import com.aetherpass.dto.request.HoldSeatsRequest;
import com.aetherpass.dto.response.BookingResponse;
import com.aetherpass.dto.response.SeatMapResponse;
import com.aetherpass.entity.Booking;
import com.aetherpass.entity.Coupon;
import com.aetherpass.entity.Event;
import com.aetherpass.entity.Seat;
import com.aetherpass.entity.Ticket;
import com.aetherpass.entity.User;
import com.aetherpass.exception.ApiException;
import com.aetherpass.messaging.BookingEventPublisher;
import com.aetherpass.repository.BookingRepository;
import com.aetherpass.repository.EventRepository;
import com.aetherpass.repository.SeatRepository;
import com.aetherpass.repository.TicketRepository;
import com.aetherpass.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Booking flow:
 * 1) load seat map (Redis locks overlay)
 * 2) hold seats -> Redis lock + PENDING booking (5 min)
 * 3) payment success -> seats BOOKED + tickets/QR
 * 4) cancel/expire -> release Redis + free seats (+ refund if paid)
 */
@Service
@Slf4j
@Transactional
public class BookingService {

    public static final String PENDING = "PENDING";
    public static final String CONFIRMED = "CONFIRMED";
    public static final String CANCELLED = "CANCELLED";
    public static final String EXPIRED = "EXPIRED";
    public static final String REFUNDED = "REFUNDED";

    private final EventRepository eventRepository;
    private final SeatRepository seatRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final TicketRepository ticketRepository;
    private final SeatLockService seatLockService;
    private final SeatMapService seatMapService;
    private final PaymentService paymentService;
    private final BookingEventPublisher bookingEventPublisher;
    private final CouponService couponService;

    public BookingService(
            EventRepository eventRepository,
            SeatRepository seatRepository,
            BookingRepository bookingRepository,
            UserRepository userRepository,
            TicketRepository ticketRepository,
            SeatLockService seatLockService,
            SeatMapService seatMapService,
            @Lazy PaymentService paymentService,
            BookingEventPublisher bookingEventPublisher,
            CouponService couponService
    ) {
        this.eventRepository = eventRepository;
        this.seatRepository = seatRepository;
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.ticketRepository = ticketRepository;
        this.seatLockService = seatLockService;
        this.seatMapService = seatMapService;
        this.paymentService = paymentService;
        this.bookingEventPublisher = bookingEventPublisher;
        this.couponService = couponService;
    }

    public SeatMapResponse getSeatMap(String slug, String viewerEmail) {
        Event event = eventRepository.findDetailedBySlug(slug)
                .orElseThrow(() -> new ApiException("Event not found", HttpStatus.NOT_FOUND, "EVENT_NOT_FOUND"));
        if (!"PUBLISHED".equals(event.getStatus())) {
            throw new ApiException("Event not found", HttpStatus.NOT_FOUND, "EVENT_NOT_FOUND");
        }

        seatMapService.ensureSeatsForEvent(event);
        List<Seat> seats = seatRepository.findDetailedByEventId(event.getId());
        Long viewerId = viewerEmail == null ? null : userRepository.findByEmail(viewerEmail)
                .map(User::getId).orElse(null);

        List<SeatMapResponse.SeatCell> cells = seats.stream().map(seat -> {
            String state = seat.getStatus();
            if ("AVAILABLE".equals(state) && seatLockService.isLocked(seat.getId())) {
                Long locker = seatLockService.lockedByUserId(seat.getId());
                state = (viewerId != null && viewerId.equals(locker)) ? "MINE" : "LOCKED";
            }
            return SeatMapResponse.SeatCell.builder()
                    .id(seat.getId())
                    .rowLabel(seat.getRowLabel())
                    .seatNumber(seat.getSeatNumber())
                    .label(seat.getRowLabel() + seat.getSeatNumber())
                    .categoryId(seat.getTicketCategory().getId())
                    .categoryName(seat.getTicketCategory().getName())
                    .price(seat.getTicketCategory().getPrice())
                    .currency(seat.getTicketCategory().getCurrency())
                    .state(state)
                    .build();
        }).toList();

        return SeatMapResponse.builder()
                .eventId(event.getId())
                .eventTitle(event.getTitle())
                .eventSlug(event.getSlug())
                .lockTtlSeconds(seatLockService.ttlSeconds())
                .seats(cells)
                .build();
    }

    public BookingResponse holdSeats(String userEmail, HoldSeatsRequest request) {
        expireOverdueBookings();

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.UNAUTHORIZED, "UNAUTHORIZED"));
        Event event = eventRepository.findById(request.getEventId())
                .orElseThrow(() -> new ApiException("Event not found", HttpStatus.NOT_FOUND, "EVENT_NOT_FOUND"));
        if (!"PUBLISHED".equals(event.getStatus())) {
            throw new ApiException("Event is not bookable", HttpStatus.CONFLICT, "EVENT_NOT_BOOKABLE");
        }

        seatMapService.ensureSeatsForEvent(event);

        List<Long> seatIds = request.getSeatIds().stream().distinct().toList();
        List<Seat> seats = seatRepository.findDetailedByIdIn(seatIds);
        if (seats.size() != seatIds.size()) {
            throw new ApiException("One or more seats were not found", HttpStatus.BAD_REQUEST, "INVALID_SEATS");
        }

        for (Seat seat : seats) {
            if (!seat.getEvent().getId().equals(event.getId())) {
                throw new ApiException("Seat does not belong to this event", HttpStatus.BAD_REQUEST, "INVALID_SEATS");
            }
            if (!"AVAILABLE".equals(seat.getStatus())) {
                throw new ApiException("Seat " + seat.getRowLabel() + seat.getSeatNumber() + " is not available",
                        HttpStatus.CONFLICT, "SEAT_UNAVAILABLE");
            }
        }

        BigDecimal subtotal = seats.stream()
                .map(s -> s.getTicketCategory().getPrice())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Instant expiresAt = Instant.now().plusSeconds(seatLockService.ttlSeconds());
        Booking booking = Booking.builder()
                .bookingCode(uniqueBookingCode())
                .user(user)
                .event(event)
                .status(PENDING)
                .subtotal(subtotal)
                .discountAmount(BigDecimal.ZERO)
                .totalAmount(subtotal)
                .currency("INR")
                .expiresAt(expiresAt)
                .seats(new HashSet<>(seats))
                .build();
        booking = bookingRepository.save(booking);

        try {
            seatLockService.lockSeats(user.getId(), booking.getId(), seatIds);
        } catch (RuntimeException ex) {
            bookingRepository.delete(booking);
            throw ex;
        }

        return toResponse(bookingRepository.findDetailedById(booking.getId()).orElse(booking));
    }

    public BookingResponse confirmAfterPayment(Long bookingId) {
        Booking booking = bookingRepository.findDetailedById(bookingId)
                .orElseThrow(() -> new ApiException("Booking not found", HttpStatus.NOT_FOUND, "BOOKING_NOT_FOUND"));
        if (CONFIRMED.equals(booking.getStatus())) {
            return toResponse(booking);
        }
        if (!PENDING.equals(booking.getStatus())) {
            throw new ApiException("Only pending bookings can be confirmed", HttpStatus.CONFLICT, "INVALID_STATUS");
        }
        if (booking.getExpiresAt() != null && booking.getExpiresAt().isBefore(Instant.now())) {
            expireBooking(booking);
            throw new ApiException("Hold expired. Please select seats again.", HttpStatus.CONFLICT, "HOLD_EXPIRED");
        }

        for (Seat seat : booking.getSeats()) {
            seat.setStatus("BOOKED");
        }
        seatRepository.saveAll(booking.getSeats());

        List<Ticket> tickets = new ArrayList<>();
        for (Seat seat : booking.getSeats()) {
            String ticketCode = "TKT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            String qr = "AETHER|" + booking.getBookingCode() + "|" + ticketCode
                    + "|E" + booking.getEvent().getId()
                    + "|U" + booking.getUser().getId()
                    + "|S" + seat.getId();
            tickets.add(Ticket.builder()
                    .booking(booking)
                    .seat(seat)
                    .ticketCode(ticketCode)
                    .qrPayload(qr)
                    .status("VALID")
                    .build());
        }
        booking.getTickets().clear();
        booking.getTickets().addAll(tickets);
        booking.setStatus(CONFIRMED);
        booking.setExpiresAt(null);
        if (booking.getCoupon() != null) {
            couponService.markUsed(booking.getCoupon());
        }
        bookingRepository.save(booking);

        seatLockService.releaseSeats(booking.getSeats().stream().map(Seat::getId).toList());
        Booking confirmed = bookingRepository.findDetailedById(booking.getId()).orElse(booking);
        bookingEventPublisher.publishConfirmed(confirmed);
        return toResponse(confirmed);
    }

    public BookingResponse applyCoupon(String userEmail, Long bookingId, ApplyCouponRequest request) {
        Booking booking = requireOwnedPendingForPayment(userEmail, bookingId);
        Coupon coupon = couponService.requireValid(request.getCode());
        couponService.requireMinOrder(coupon, booking.getSubtotal());
        BigDecimal discount = couponService.calculateDiscount(coupon, booking.getSubtotal());
        booking.setCoupon(coupon);
        booking.setDiscountAmount(discount);
        booking.setTotalAmount(booking.getSubtotal().subtract(discount).max(BigDecimal.ZERO));
        bookingRepository.save(booking);
        return toResponse(bookingRepository.findDetailedById(booking.getId()).orElse(booking));
    }

    public BookingResponse removeCoupon(String userEmail, Long bookingId) {
        Booking booking = requireOwnedPendingForPayment(userEmail, bookingId);
        booking.setCoupon(null);
        booking.setDiscountAmount(BigDecimal.ZERO);
        booking.setTotalAmount(booking.getSubtotal());
        bookingRepository.save(booking);
        return toResponse(bookingRepository.findDetailedById(booking.getId()).orElse(booking));
    }

    public Booking requireOwnedPendingForPayment(String userEmail, Long bookingId) {
        expireOverdueBookings();
        Booking booking = requireOwnedBooking(userEmail, bookingId);
        if (!PENDING.equals(booking.getStatus())) {
            throw new ApiException("Only pending bookings can be paid", HttpStatus.CONFLICT, "INVALID_STATUS");
        }
        if (booking.getExpiresAt() != null && booking.getExpiresAt().isBefore(Instant.now())) {
            expireBooking(booking);
            throw new ApiException("Hold expired. Please select seats again.", HttpStatus.CONFLICT, "HOLD_EXPIRED");
        }
        return booking;
    }

    public BookingResponse toPublicResponse(Booking booking) {
        return toResponse(bookingRepository.findDetailedById(booking.getId()).orElse(booking));
    }

    public BookingResponse cancel(String userEmail, Long bookingId) {
        Booking booking = requireOwnedBooking(userEmail, bookingId);
        if (CONFIRMED.equals(booking.getStatus())) {
            paymentService.refundIfPaid(booking);
            for (Ticket ticket : booking.getTickets()) {
                ticket.setStatus("CANCELLED");
                ticket.getSeat().setStatus("AVAILABLE");
            }
            seatRepository.saveAll(booking.getSeats());
            booking.setStatus(REFUNDED);
            bookingRepository.save(booking);
            bookingEventPublisher.publishCancelled(booking);
            return toResponse(booking);
        }
        if (PENDING.equals(booking.getStatus())) {
            releasePending(booking, CANCELLED);
            Booking cancelled = bookingRepository.findDetailedById(booking.getId()).orElse(booking);
            bookingEventPublisher.publishCancelled(cancelled);
            return toResponse(cancelled);
        }
        throw new ApiException("Booking cannot be cancelled", HttpStatus.CONFLICT, "INVALID_STATUS");
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> myBookings(String userEmail) {
        expireOverdueBookings();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.UNAUTHORIZED, "UNAUTHORIZED"));
        return bookingRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public BookingResponse getMine(String userEmail, Long id) {
        expireOverdueBookings();
        return toResponse(requireOwnedBooking(userEmail, id));
    }

    public void expireOverdueBookings() {
        List<Booking> expired = bookingRepository.findExpiredPending(PENDING, Instant.now());
        for (Booking booking : expired) {
            expireBooking(booking);
        }
    }

    private void expireBooking(Booking booking) {
        releasePending(booking, EXPIRED);
    }

    private void releasePending(Booking booking, String status) {
        List<Long> seatIds = booking.getSeats().stream().map(Seat::getId).toList();
        seatLockService.releaseSeats(seatIds);
        booking.setStatus(status);
        bookingRepository.save(booking);
    }

    private Booking requireOwnedBooking(String userEmail, Long bookingId) {
        Booking booking = bookingRepository.findDetailedById(bookingId)
                .orElseThrow(() -> new ApiException("Booking not found", HttpStatus.NOT_FOUND, "BOOKING_NOT_FOUND"));
        if (!booking.getUser().getEmail().equalsIgnoreCase(userEmail)) {
            throw new ApiException("Booking not found", HttpStatus.NOT_FOUND, "BOOKING_NOT_FOUND");
        }
        return booking;
    }

    private String uniqueBookingCode() {
        String code;
        do {
            code = "AP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        } while (bookingRepository.existsByBookingCode(code));
        return code;
    }

    private BookingResponse toResponse(Booking booking) {
        List<BookingResponse.SeatInfo> seatInfos = booking.getSeats() == null ? List.of()
                : booking.getSeats().stream()
                .collect(Collectors.toMap(
                        Seat::getId,
                        s -> BookingResponse.SeatInfo.builder()
                                .id(s.getId())
                                .label(s.getRowLabel() + s.getSeatNumber())
                                .categoryName(s.getTicketCategory() != null ? s.getTicketCategory().getName() : null)
                                .price(s.getTicketCategory() != null ? s.getTicketCategory().getPrice() : null)
                                .build(),
                        (a, b) -> a,
                        java.util.LinkedHashMap::new
                ))
                .values().stream().toList();

        // Load tickets in a separate query — avoids MultiBag cartesian duplicates
        List<Ticket> tickets = booking.getId() == null
                ? (booking.getTickets() == null ? List.of() : booking.getTickets())
                : ticketRepository.findDetailedByBookingId(booking.getId());

        List<BookingResponse.TicketInfo> ticketInfos = tickets.stream()
                .collect(Collectors.toMap(
                        Ticket::getId,
                        t -> BookingResponse.TicketInfo.builder()
                                .id(t.getId())
                                .ticketCode(t.getTicketCode())
                                .qrPayload(t.getQrPayload())
                                .status(t.getStatus())
                                .seatLabel(t.getSeat() != null
                                        ? t.getSeat().getRowLabel() + t.getSeat().getSeatNumber()
                                        : null)
                                .build(),
                        (a, b) -> a,
                        java.util.LinkedHashMap::new
                ))
                .values().stream().toList();

        return BookingResponse.builder()
                .id(booking.getId())
                .bookingCode(booking.getBookingCode())
                .status(booking.getStatus())
                .eventId(booking.getEvent().getId())
                .eventTitle(booking.getEvent().getTitle())
                .eventSlug(booking.getEvent().getSlug())
                .startsAt(booking.getEvent().getStartsAt())
                .subtotal(booking.getSubtotal())
                .discountAmount(booking.getDiscountAmount())
                .totalAmount(booking.getTotalAmount())
                .currency(booking.getCurrency())
                .couponCode(booking.getCoupon() != null ? booking.getCoupon().getCode() : null)
                .expiresAt(booking.getExpiresAt())
                .createdAt(booking.getCreatedAt())
                .seats(seatInfos)
                .tickets(ticketInfos)
                .build();
    }
}
