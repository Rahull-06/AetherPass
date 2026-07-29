package com.aetherpass.util;

import java.text.Normalizer;
import java.util.Locale;
import java.util.UUID;

public final class SlugUtil {

    private SlugUtil() {}

    public static String slugify(String input) {
        if (input == null || input.isBlank()) {
            return "event-" + UUID.randomUUID().toString().substring(0, 8);
        }
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
        return normalized.isBlank()
                ? "event-" + UUID.randomUUID().toString().substring(0, 8)
                : normalized;
    }
}
