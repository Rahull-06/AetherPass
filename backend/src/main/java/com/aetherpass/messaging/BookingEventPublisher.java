package com.aetherpass.messaging;

import com.aetherpass.config.RabbitMqConfig;
import com.aetherpass.entity.Booking;
import com.aetherpass.entity.Ticket;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class BookingEventPublisher {

    private final RabbitTemplate rabbitTemplate;

    public void publishConfirmed(Booking booking) {
        BookingConfirmedMessage message = buildConfirmed(booking);
        runAfterCommit(() -> {
            rabbitTemplate.convertAndSend(
                    RabbitMqConfig.EXCHANGE,
                    RabbitMqConfig.RK_BOOKING_CONFIRMED,
                    message
            );
            log.info("Published booking.confirmed for {}", message.bookingCode());
        });
    }

    public void publishCancelled(Booking booking) {
        BookingCancelledMessage message = new BookingCancelledMessage(
                booking.getId(),
                booking.getBookingCode(),
                booking.getUser().getId(),
                booking.getUser().getEmail(),
                booking.getUser().getFullName(),
                booking.getEvent().getTitle(),
                booking.getStatus()
        );
        runAfterCommit(() -> {
            rabbitTemplate.convertAndSend(
                    RabbitMqConfig.EXCHANGE,
                    RabbitMqConfig.RK_BOOKING_CANCELLED,
                    message
            );
            log.info("Published booking.cancelled for {}", message.bookingCode());
        });
    }

    private BookingConfirmedMessage buildConfirmed(Booking booking) {
        List<BookingConfirmedMessage.TicketLine> tickets = booking.getTickets().stream()
                .map(this::toLine)
                .toList();

        return new BookingConfirmedMessage(
                booking.getId(),
                booking.getBookingCode(),
                booking.getUser().getId(),
                booking.getUser().getEmail(),
                booking.getUser().getFullName(),
                booking.getEvent().getId(),
                booking.getEvent().getTitle(),
                booking.getEvent().getSlug(),
                booking.getTotalAmount(),
                booking.getCurrency(),
                tickets
        );
    }

    private BookingConfirmedMessage.TicketLine toLine(Ticket ticket) {
        String seatLabel = ticket.getSeat() == null
                ? null
                : ticket.getSeat().getRowLabel() + ticket.getSeat().getSeatNumber();
        return new BookingConfirmedMessage.TicketLine(
                ticket.getId(),
                ticket.getTicketCode(),
                seatLabel,
                ticket.getQrPayload()
        );
    }

    private void runAfterCommit(Runnable action) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    action.run();
                }
            });
        } else {
            action.run();
        }
    }
}
