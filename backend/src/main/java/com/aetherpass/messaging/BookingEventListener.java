package com.aetherpass.messaging;

import com.aetherpass.config.RabbitMqConfig;
import com.aetherpass.service.NotificationService;
import com.aetherpass.service.TicketDeliveryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class BookingEventListener {

    private final NotificationService notificationService;
    private final TicketDeliveryService ticketDeliveryService;

    @RabbitListener(queues = RabbitMqConfig.BOOKING_CONFIRMED_QUEUE)
    public void onConfirmed(BookingConfirmedMessage message) {
        log.info("Consuming booking.confirmed {}", message.bookingCode());
        ticketDeliveryService.deliverConfirmed(message);

        String body = "Your booking " + message.bookingCode() + " for " + message.eventTitle()
                + " is confirmed. " + message.tickets().size() + " ticket(s) ready.";
        notificationService.create(
                message.userId(),
                "BOOKING_CONFIRMATION",
                "Tickets confirmed",
                body
        );
    }

    @RabbitListener(queues = RabbitMqConfig.BOOKING_CANCELLED_QUEUE)
    public void onCancelled(BookingCancelledMessage message) {
        log.info("Consuming booking.cancelled {}", message.bookingCode());
        String type = "REFUNDED".equals(message.status()) ? "REFUND" : "CANCELLATION";
        String title = "REFUNDED".equals(message.status()) ? "Refund processed" : "Booking cancelled";
        String body = "Booking " + message.bookingCode() + " for " + message.eventTitle()
                + " is now " + message.status() + ".";
        notificationService.create(message.userId(), type, title, body);
        log.info("Cancellation email (dev) to {} <{}>: {}", message.userName(), message.userEmail(), body);
    }
}
