package com.aetherpass.service;

import com.aetherpass.dto.request.ForgotPasswordRequest;
import com.aetherpass.dto.request.ResetPasswordRequest;
import com.aetherpass.dto.response.ForgotPasswordResponse;
import com.aetherpass.entity.PasswordResetToken;
import com.aetherpass.entity.User;
import com.aetherpass.exception.ApiException;
import com.aetherpass.repository.PasswordResetTokenRepository;
import com.aetherpass.repository.RefreshTokenRepository;
import com.aetherpass.repository.UserRepository;
import com.aetherpass.util.Sha256Util;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

/**
 * Forgot password via email link (not OTP):
 * 1) user requests reset -> we store hashed token
 * 2) email contains one-time link
 * 3) user sets new password -> token marked used + sessions revoked
 */
@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class PasswordResetService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${aetherpass.app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    @Value("${aetherpass.password-reset.expiry-ms:1800000}")
    private long resetExpiryMs;

    public ForgotPasswordResponse forgotPassword(ForgotPasswordRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        String genericMessage = "If that email exists, we sent a reset link.";

        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            // Don't reveal whether the email is registered.
            return ForgotPasswordResponse.builder().message(genericMessage).build();
        }

        passwordResetTokenRepository.findAllByUserIdAndUsedFalse(user.getId())
                .forEach(token -> {
                    token.setUsed(true);
                    passwordResetTokenRepository.save(token);
                });

        String rawToken = UUID.randomUUID().toString().replace("-", "") + UUID.randomUUID().toString().replace("-", "");
        Instant expiresAt = Instant.now().plusMillis(resetExpiryMs);

        passwordResetTokenRepository.save(PasswordResetToken.builder()
                .user(user)
                .tokenHash(Sha256Util.sha256Hex(rawToken))
                .expiresAt(expiresAt)
                .used(false)
                .build());

        String resetLink = frontendUrl.replaceAll("/$", "") + "/reset-password?token=" + rawToken;

        // Local/dev: log the link. Later swap this for real SMTP/email provider.
        log.info("Password reset link for {}: {}", email, resetLink);

        return ForgotPasswordResponse.builder()
                .message(genericMessage)
                .resetLink(resetLink)
                .build();
    }

    public void resetPassword(ResetPasswordRequest request) {
        String tokenHash = Sha256Util.sha256Hex(request.getToken());
        PasswordResetToken stored = passwordResetTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new ApiException("Reset link is invalid", HttpStatus.BAD_REQUEST, "INVALID_RESET_TOKEN"));

        if (stored.isUsed() || stored.getExpiresAt().isBefore(Instant.now())) {
            throw new ApiException("Reset link expired. Request a new one.", HttpStatus.BAD_REQUEST, "RESET_TOKEN_EXPIRED");
        }

        User user = stored.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        stored.setUsed(true);
        passwordResetTokenRepository.save(stored);

        // Force re-login everywhere after password change.
        refreshTokenRepository.findAllByUserId(user.getId()).forEach(rt -> {
            rt.setRevoked(true);
            refreshTokenRepository.save(rt);
        });
    }
}
