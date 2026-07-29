package com.aetherpass.service;

import com.aetherpass.dto.response.NotificationResponse;
import com.aetherpass.entity.Notification;
import com.aetherpass.entity.User;
import com.aetherpass.exception.ApiException;
import com.aetherpass.repository.NotificationRepository;
import com.aetherpass.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public void create(Long userId, String type, String title, String body) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND, "USER_NOT_FOUND"));
        notificationRepository.save(Notification.builder()
                .user(user)
                .type(type)
                .title(title)
                .body(body)
                .readFlag(false)
                .build());
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> mine(String email) {
        User user = requireUser(email);
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public long unreadCount(String email) {
        User user = requireUser(email);
        return notificationRepository.countByUserIdAndReadFlagFalse(user.getId());
    }

    public void markRead(String email, Long id) {
        User user = requireUser(email);
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ApiException("Notification not found", HttpStatus.NOT_FOUND, "NOT_FOUND"));
        if (!notification.getUser().getId().equals(user.getId())) {
            throw new ApiException("Notification not found", HttpStatus.NOT_FOUND, "NOT_FOUND");
        }
        notification.setReadFlag(true);
        notificationRepository.save(notification);
    }

    public void markAllRead(String email) {
        User user = requireUser(email);
        List<Notification> list = notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        for (Notification n : list) {
            if (!n.isReadFlag()) {
                n.setReadFlag(true);
            }
        }
        notificationRepository.saveAll(list);
    }

    private User requireUser(String email) {
        return userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.UNAUTHORIZED, "UNAUTHORIZED"));
    }

    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .type(n.getType())
                .title(n.getTitle())
                .body(n.getBody())
                .read(n.isReadFlag())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
