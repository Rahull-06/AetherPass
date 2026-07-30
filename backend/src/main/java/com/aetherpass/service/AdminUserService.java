package com.aetherpass.service;

import com.aetherpass.dto.request.UpdateUserStatusRequest;
import com.aetherpass.dto.response.AdminUserResponse;
import com.aetherpass.dto.response.PageResponse;
import com.aetherpass.entity.RefreshToken;
import com.aetherpass.entity.Role;
import com.aetherpass.entity.User;
import com.aetherpass.exception.ApiException;
import com.aetherpass.repository.RefreshTokenRepository;
import com.aetherpass.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class AdminUserService {

    private static final String ROLE_ADMIN = "ROLE_ADMIN";
    private static final Set<String> ALLOWED_STATUS = Set.of("ACTIVE", "SUSPENDED");

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;

    @Transactional(readOnly = true)
    public PageResponse<AdminUserResponse> list(
            String q,
            String role,
            String status,
            int page,
            int size
    ) {
        String normalizedRole = blankToNull(role);
        if (normalizedRole != null && !normalizedRole.startsWith("ROLE_")) {
            normalizedRole = "ROLE_" + normalizedRole.toUpperCase();
        }
        String normalizedStatus = blankToNull(status);
        if (normalizedStatus != null) {
            normalizedStatus = normalizedStatus.toUpperCase();
        }

        Page<User> result = userRepository.searchAdmin(
                blankToNull(q),
                normalizedRole,
                normalizedStatus,
                PageRequest.of(
                        Math.max(page, 0),
                        Math.min(Math.max(size, 1), 50),
                        Sort.by(Sort.Direction.DESC, "createdAt")
                )
        );

        return PageResponse.<AdminUserResponse>builder()
                .content(result.getContent().stream().map(this::toResponse).toList())
                .page(result.getNumber())
                .size(result.getSize())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .build();
    }

    public AdminUserResponse updateStatus(String actorEmail, Long userId, UpdateUserStatusRequest request) {
        User actor = userRepository.findByEmail(normalizeEmail(actorEmail))
                .orElseThrow(() -> new ApiException("Actor not found", HttpStatus.UNAUTHORIZED, "UNAUTHORIZED"));

        User target = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND, "USER_NOT_FOUND"));

        String nextStatus = request.getStatus().trim().toUpperCase();
        if (!ALLOWED_STATUS.contains(nextStatus)) {
            throw new ApiException("Invalid status", HttpStatus.BAD_REQUEST, "INVALID_STATUS");
        }

        if (actor.getId().equals(target.getId())) {
            throw new ApiException("You cannot change your own account status", HttpStatus.BAD_REQUEST, "CANNOT_SELF_STATUS");
        }

        if (hasRole(target, ROLE_ADMIN)) {
            throw new ApiException("Admin accounts cannot be suspended here", HttpStatus.FORBIDDEN, "CANNOT_MODIFY_ADMIN");
        }

        target.setStatus(nextStatus);
        userRepository.save(target);

        if ("SUSPENDED".equals(nextStatus)) {
            revokeAllRefreshTokens(target.getId());
        }

        return toResponse(target);
    }

    private void revokeAllRefreshTokens(Long userId) {
        List<RefreshToken> tokens = refreshTokenRepository.findAllByUserId(userId);
        tokens.forEach(t -> t.setRevoked(true));
        refreshTokenRepository.saveAll(tokens);
    }

    private AdminUserResponse toResponse(User user) {
        return AdminUserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .status(user.getStatus())
                .emailVerified(user.isEmailVerified())
                .roles(roleNames(user))
                .createdAt(user.getCreatedAt())
                .build();
    }

    private boolean hasRole(User user, String roleName) {
        return user.getRoles() != null
                && user.getRoles().stream().anyMatch(r -> roleName.equals(r.getName()));
    }

    private Set<String> roleNames(User user) {
        if (user.getRoles() == null) {
            return Set.of();
        }
        return user.getRoles().stream().map(Role::getName).collect(Collectors.toSet());
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }
}
