package com.aetherpass.service;

import com.aetherpass.dto.request.LoginRequest;
import com.aetherpass.dto.request.LogoutRequest;
import com.aetherpass.dto.request.RefreshRequest;
import com.aetherpass.dto.request.RegisterRequest;
import com.aetherpass.dto.response.AuthResponse;
import com.aetherpass.dto.response.UserProfileResponse;
import com.aetherpass.entity.RefreshToken;
import com.aetherpass.entity.Role;
import com.aetherpass.entity.User;
import com.aetherpass.exception.ApiException;
import com.aetherpass.repository.RefreshTokenRepository;
import com.aetherpass.repository.RoleRepository;
import com.aetherpass.repository.UserRepository;
import com.aetherpass.security.JwtService;
import com.aetherpass.util.Sha256Util;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Auth flow (simple map):
 * register/login -> hash password check -> issue access+refresh JWTs
 * refresh -> validate stored refresh hash -> rotate tokens
 * logout -> revoke refresh token so it cannot mint new access tokens
 * me -> load current user from JWT email
 */
@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {

    private static final String ROLE_USER = "ROLE_USER";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Value("${aetherpass.jwt.access-token-expiry-ms}")
    private long accessTokenExpiryMs;

    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.getEmail());
        String phone = blankToNull(request.getPhone());

        if (userRepository.existsByEmail(email)) {
            throw new ApiException("Email is already registered", HttpStatus.CONFLICT, "EMAIL_ALREADY_REGISTERED");
        }

        Role userRole = roleRepository.findByName(ROLE_USER)
                .orElseGet(() -> roleRepository.save(
                        Role.builder().name(ROLE_USER).description("Regular ticket buyer").build()
                ));

        User user = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName().trim())
                .phone(phone)
                .status("ACTIVE")
                .emailVerified(true)
                .roles(Set.of(userRole))
                .build();

        return issueTokens(userRepository.save(user));
    }

    public AuthResponse login(LoginRequest request) {
        String email = normalizeEmail(request.getEmail());
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> invalidCredentials());

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw invalidCredentials();
        }

        if (!"ACTIVE".equalsIgnoreCase(user.getStatus())) {
            throw new ApiException("Account is not active", HttpStatus.FORBIDDEN, "ACCOUNT_NOT_ACTIVE");
        }

        // One active session family per login keeps stolen refresh tokens less useful.
        revokeAllRefreshTokens(user.getId());
        return issueTokens(user);
    }

    public AuthResponse refresh(RefreshRequest request) {
        String refreshToken = request.getRefreshToken();
        JwtService.JwtClaims claims = jwtService.parseAndValidate(refreshToken);

        if (!jwtService.getRefreshTokenType().equals(claims.tokenType())) {
            throw new ApiException("Invalid refresh token type", HttpStatus.UNAUTHORIZED, "INVALID_REFRESH_TOKEN");
        }

        RefreshToken stored = refreshTokenRepository.findByTokenHash(Sha256Util.sha256Hex(refreshToken))
                .orElseThrow(() -> new ApiException("Refresh token not found", HttpStatus.UNAUTHORIZED, "INVALID_REFRESH_TOKEN"));

        if (stored.isRevoked() || stored.getExpiresAt().isBefore(Instant.now())) {
            throw new ApiException("Refresh token expired or revoked", HttpStatus.UNAUTHORIZED, "INVALID_REFRESH_TOKEN");
        }

        if (stored.getUser() == null || !stored.getUser().getId().equals(claims.uid())) {
            throw new ApiException("Refresh token user mismatch", HttpStatus.UNAUTHORIZED, "INVALID_REFRESH_TOKEN");
        }

        User user = stored.getUser();
        if (!"ACTIVE".equalsIgnoreCase(user.getStatus())) {
            stored.setRevoked(true);
            refreshTokenRepository.save(stored);
            throw new ApiException("Account is not active", HttpStatus.FORBIDDEN, "ACCOUNT_NOT_ACTIVE");
        }

        stored.setRevoked(true);
        refreshTokenRepository.save(stored);

        return issueTokens(user);
    }

    public void logout(LogoutRequest request) {
        String tokenHash = Sha256Util.sha256Hex(request.getRefreshToken());
        refreshTokenRepository.findByTokenHash(tokenHash).ifPresent(token -> {
            token.setRevoked(true);
            refreshTokenRepository.save(token);
        });
        // Silent success even if token was already gone — logout must feel reliable.
    }

    @Transactional(readOnly = true)
    public UserProfileResponse me(String email) {
        User user = userRepository.findByEmail(normalizeEmail(email))
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND, "USER_NOT_FOUND"));

        return UserProfileResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .status(user.getStatus())
                .roles(roleNames(user))
                .build();
    }

    private AuthResponse issueTokens(User user) {
        String accessToken = jwtService.generateAccessToken(user);
        JwtService.GeneratedRefreshToken refreshPair = jwtService.generateRefreshToken(user);

        refreshTokenRepository.save(RefreshToken.builder()
                .user(user)
                .tokenHash(Sha256Util.sha256Hex(refreshPair.token()))
                .expiresAt(refreshPair.expiresAt())
                .revoked(false)
                .build());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshPair.token())
                .tokenType("Bearer")
                .expiresIn(accessTokenExpiryMs / 1000)
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .roles(roleNames(user))
                .build();
    }

    private void revokeAllRefreshTokens(Long userId) {
        List<RefreshToken> tokens = refreshTokenRepository.findAllByUserId(userId);
        tokens.forEach(t -> t.setRevoked(true));
        refreshTokenRepository.saveAll(tokens);
    }

    private Set<String> roleNames(User user) {
        if (user.getRoles() == null) {
            return Set.of();
        }
        return user.getRoles().stream().map(Role::getName).collect(Collectors.toSet());
    }

    private ApiException invalidCredentials() {
        return new ApiException("Invalid email or password", HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS");
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
