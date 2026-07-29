package com.aetherpass.util;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

import static java.util.Objects.requireNonNull;

public final class Sha256Util {

    private Sha256Util() {}

    public static String sha256Hex(String input) {
        requireNonNull(input, "input");
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            // SHA-256 is required by the JVM spec, so this should never happen.
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}

