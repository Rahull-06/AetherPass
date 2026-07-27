package com.aetherpass.exception;

import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.List;

@Getter
@Builder
public class ErrorResponse {

    private final Instant timestamp;
    private final int status;
    private final String code;
    private final String message;
    private final String path;
    private final List<FieldErrorDetail> errors;

    @Getter
    @Builder
    public static class FieldErrorDetail {
        private final String field;
        private final String message;
    }
}
