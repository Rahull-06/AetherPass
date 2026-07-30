package com.aetherpass.service;

import com.aetherpass.dto.request.ScanTicketRequest;
import com.aetherpass.dto.response.ScanTicketResponse;
import com.aetherpass.entity.Organizer;
import com.aetherpass.entity.Ticket;
import com.aetherpass.entity.User;
import com.aetherpass.exception.ApiException;
import com.aetherpass.repository.OrganizerRepository;
import com.aetherpass.repository.TicketRepository;
import com.aetherpass.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/**
 * Organizer gate check-in:
 * QR payload AETHER|bookingCode|ticketCode|EeventId|UuserId|SseatId
 * or plain ticket code TKT-XXXXXXXX
 */
@Service
@RequiredArgsConstructor
@Transactional
public class TicketScanService {

    private final TicketRepository ticketRepository;
    private final OrganizerRepository organizerRepository;
    private final UserRepository userRepository;

    public ScanTicketResponse scan(String organizerEmail, ScanTicketRequest request) {
        User actor = userRepository.findByEmail(organizerEmail.trim().toLowerCase())
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.UNAUTHORIZED, "UNAUTHORIZED"));
        boolean isAdmin = actor.getRoles().stream().anyMatch(r -> "ROLE_ADMIN".equals(r.getName()));

        Organizer organizer = organizerRepository.findByUserEmail(organizerEmail.trim().toLowerCase()).orElse(null);
        if (organizer == null && !isAdmin) {
            throw new ApiException("Organizer profile not found", HttpStatus.FORBIDDEN, "NOT_ORGANIZER");
        }

        String ticketCode = extractTicketCode(request.getQrPayload().trim());
        Ticket ticket = ticketRepository.findDetailedByTicketCode(ticketCode)
                .orElseThrow(() -> new ApiException("Ticket not found", HttpStatus.NOT_FOUND, "TICKET_NOT_FOUND"));

        if (!isAdmin) {
            Long eventOrganizerId = ticket.getBooking().getEvent().getOrganizer().getId();
            if (!eventOrganizerId.equals(organizer.getId())) {
                throw new ApiException("This ticket is not for your event", HttpStatus.FORBIDDEN, "WRONG_ORGANIZER");
            }
        }

        String seatLabel = ticket.getSeat() == null
                ? null
                : ticket.getSeat().getRowLabel() + ticket.getSeat().getSeatNumber();

        if ("USED".equals(ticket.getStatus())) {
            return deny(ticket, seatLabel, "Already checked in");
        }
        if ("CANCELLED".equals(ticket.getStatus()) || !"CONFIRMED".equals(ticket.getBooking().getStatus())) {
            return deny(ticket, seatLabel, "Ticket is not valid for entry");
        }
        if (!"VALID".equals(ticket.getStatus())) {
            return deny(ticket, seatLabel, "Ticket status: " + ticket.getStatus());
        }

        ticket.setStatus("USED");
        ticket.setUsedAt(Instant.now());
        ticketRepository.save(ticket);

        return ScanTicketResponse.builder()
                .valid(true)
                .message("Entry allowed")
                .ticketCode(ticket.getTicketCode())
                .ticketStatus("USED")
                .seatLabel(seatLabel)
                .bookingCode(ticket.getBooking().getBookingCode())
                .eventTitle(ticket.getBooking().getEvent().getTitle())
                .holderName(ticket.getBooking().getUser().getFullName())
                .usedAt(ticket.getUsedAt())
                .build();
    }

    private ScanTicketResponse deny(Ticket ticket, String seatLabel, String message) {
        return ScanTicketResponse.builder()
                .valid(false)
                .message(message)
                .ticketCode(ticket.getTicketCode())
                .ticketStatus(ticket.getStatus())
                .seatLabel(seatLabel)
                .bookingCode(ticket.getBooking().getBookingCode())
                .eventTitle(ticket.getBooking().getEvent().getTitle())
                .holderName(ticket.getBooking().getUser().getFullName())
                .usedAt(ticket.getUsedAt())
                .build();
    }

    private String extractTicketCode(String raw) {
        if (raw.startsWith("AETHER|")) {
            String[] parts = raw.split("\\|");
            if (parts.length >= 3) {
                return parts[2].trim();
            }
            throw new ApiException("Invalid QR payload", HttpStatus.BAD_REQUEST, "INVALID_QR");
        }
        return raw.trim().toUpperCase();
    }
}
