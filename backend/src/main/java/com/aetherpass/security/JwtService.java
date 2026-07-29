package com.aetherpass.security;

import com.aetherpass.entity.Role;
import com.aetherpass.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class JwtService {

    private static final String CLAIM_UID = "uid";
    private static final String CLAIM_ROLES = "roles";
    private static final String CLAIM_TOKEN_TYPE = "token_type";

    private static final String TYPE_ACCESS = "ACCESS";
    private static final String TYPE_REFRESH = "REFRESH";

    @Value("${aetherpass.jwt.secret}")
    private String secret;

    @Value("${aetherpass.jwt.access-token-expiry-ms}")
    private long accessTokenExpiryMs;

    @Value("${aetherpass.jwt.refresh-token-expiry-ms}")
    private long refreshTokenExpiryMs;

    private SecretKey signingKey() {
        // Use UTF-8 directly (not base64) so the default YAML secret works out of the box.
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateAccessToken(User user) {
        Instant now = Instant.now();
        Instant expiresAt = now.plusMillis(accessTokenExpiryMs);
        return generateToken(user, TYPE_ACCESS, now, expiresAt).token();
    }

    public GeneratedRefreshToken generateRefreshToken(User user) {
        Instant now = Instant.now();
        Instant expiresAt = now.plusMillis(refreshTokenExpiryMs);
        String token = generateToken(user, TYPE_REFRESH, now, expiresAt).token();
        return new GeneratedRefreshToken(token, expiresAt);
    }

    public JwtClaims parseAndValidate(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(signingKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            String tokenType = claims.get(CLAIM_TOKEN_TYPE, String.class);
            Long uid = claims.get(CLAIM_UID, Long.class);
            String email = claims.getSubject();
            @SuppressWarnings("unchecked")
            List<String> roles = claims.get(CLAIM_ROLES, List.class);

            return new JwtClaims(uid, email, roles == null ? List.of() : roles, tokenType);
        } catch (JwtException | IllegalArgumentException e) {
            throw new JwtException("Invalid JWT token", e);
        }
    }

    public String getAccessTokenType() {
        return TYPE_ACCESS;
    }

    public String getRefreshTokenType() {
        return TYPE_REFRESH;
    }

    private GeneratedToken generateToken(User user, String tokenType, Instant now, Instant expiresAt) {
        Set<String> roleNames = user.getRoles() == null
                ? Set.of()
                : user.getRoles().stream().map(Role::getName).collect(Collectors.toSet());

        return new GeneratedToken(
                Jwts.builder()
                        .subject(user.getEmail())
                        .claim(CLAIM_UID, user.getId())
                        .claim(CLAIM_ROLES, roleNames)
                        .claim(CLAIM_TOKEN_TYPE, tokenType)
                        .issuedAt(Date.from(now))
                        .expiration(Date.from(expiresAt))
                        .signWith(signingKey())
                        .compact()
        );
    }

    public record JwtClaims(Long uid, String email, List<String> roles, String tokenType) {
    }

    public record GeneratedToken(String token) {
    }

    public record GeneratedRefreshToken(String token, Instant expiresAt) {
    }
}
