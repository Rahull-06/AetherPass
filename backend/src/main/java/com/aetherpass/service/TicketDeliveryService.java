package com.aetherpass.service;

import com.aetherpass.messaging.BookingConfirmedMessage;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Dev-friendly ticket delivery:
 * - writes a simple PDF under tickets/
 * - logs the "email" (swap for SMTP later)
 */
@Service
@Slf4j
public class TicketDeliveryService {

    private final Path ticketsDir;

    public TicketDeliveryService(@Value("${aetherpass.tickets.output-dir:tickets}") String outputDir) {
        this.ticketsDir = Paths.get(outputDir).toAbsolutePath().normalize();
    }

    public Path deliverConfirmed(BookingConfirmedMessage message) {
        Path pdf = writePdf(message);
        String ticketLines = message.tickets().stream()
                .map(t -> "  • " + t.seatLabel() + " · " + t.ticketCode() + " · QR=" + t.qrPayload())
                .reduce((a, b) -> a + "\n" + b)
                .orElse("  (no tickets)");

        log.info("""
                ===== BOOKING EMAIL (dev) =====
                To: {} <{}>
                Subject: Your AetherPass tickets — {}
                
                Hi {},
                
                Payment received for {}.
                Booking: {}
                Total: {} {}
                
                Tickets:
                {}
                
                PDF: {}
                ===============================
                """,
                message.userName(),
                message.userEmail(),
                message.eventTitle(),
                message.userName(),
                message.eventTitle(),
                message.bookingCode(),
                message.totalAmount(),
                message.currency(),
                ticketLines,
                pdf.toAbsolutePath()
        );
        return pdf;
    }

    private Path writePdf(BookingConfirmedMessage message) {
        try {
            Files.createDirectories(ticketsDir);
            Path file = ticketsDir.resolve(message.bookingCode() + ".pdf");

            try (PDDocument doc = new PDDocument()) {
                PDPage page = new PDPage(PDRectangle.A4);
                doc.addPage(page);
                PDType1Font titleFont = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
                PDType1Font bodyFont = new PDType1Font(Standard14Fonts.FontName.HELVETICA);

                try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                    float y = 780;
                    cs.beginText();
                    cs.setFont(titleFont, 20);
                    cs.newLineAtOffset(50, y);
                    cs.showText("AetherPass Ticket");
                    cs.endText();

                    y -= 36;
                    cs.beginText();
                    cs.setFont(bodyFont, 12);
                    cs.newLineAtOffset(50, y);
                    cs.showText(safe(message.eventTitle()));
                    cs.endText();

                    y -= 22;
                    line(cs, bodyFont, 50, y, "Booking: " + message.bookingCode());
                    y -= 18;
                    line(cs, bodyFont, 50, y, "Guest: " + safe(message.userName()) + " <" + message.userEmail() + ">");
                    y -= 18;
                    line(cs, bodyFont, 50, y, "Total: " + message.totalAmount() + " " + message.currency());
                    y -= 28;

                    for (BookingConfirmedMessage.TicketLine t : message.tickets()) {
                        line(cs, titleFont, 50, y, safe(t.seatLabel()) + "  " + t.ticketCode());
                        y -= 16;
                        line(cs, bodyFont, 50, y, "QR: " + safe(t.qrPayload()));
                        y -= 22;
                        if (y < 80) {
                            break;
                        }
                    }
                }
                doc.save(file.toFile());
            }
            return file;
        } catch (IOException ex) {
            log.error("Failed to write ticket PDF for {}", message.bookingCode(), ex);
            return ticketsDir.resolve(message.bookingCode() + "-FAILED.txt");
        }
    }

    private static void line(PDPageContentStream cs, PDType1Font font, float x, float y, String text) throws IOException {
        cs.beginText();
        cs.setFont(font, 11);
        cs.newLineAtOffset(x, y);
        cs.showText(safe(text));
        cs.endText();
    }

    private static String safe(String value) {
        if (value == null) {
            return "";
        }
        // PDFBox Type1 fonts are WinAnsi — strip unsupported chars
        return value.replaceAll("[^\\x20-\\x7E]", "?");
    }
}
