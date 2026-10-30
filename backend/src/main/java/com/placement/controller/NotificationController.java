package com.placement.controller;

import com.placement.dto.NotificationDto;
import com.placement.entity.Notification;
import com.placement.security.UserPrincipal;
import com.placement.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private com.placement.service.AuditLogService auditLogService;

    @GetMapping("/notifications")
    public ResponseEntity<List<NotificationDto>> getMyNotifications(@AuthenticationPrincipal UserPrincipal principal) {
        List<NotificationDto> list = notificationService.getNotificationsForStudent(principal.getId())
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @GetMapping("/notifications/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(@AuthenticationPrincipal UserPrincipal principal) {
        long count = notificationService.getNotificationsForStudent(principal.getId())
                .stream()
                .filter(n -> !n.getIsRead())
                .count();
        return ResponseEntity.ok(Map.of("count", count));
    }

    @PutMapping("/notifications/{id}/read")
    public ResponseEntity<NotificationDto> markAsRead(@PathVariable Integer id, @AuthenticationPrincipal UserPrincipal principal) {
        Notification notification = notificationService.markAsRead(id, principal.getId());
        auditLogService.log("MARK_NOTIFICATION_READ", principal.getEmail(), "STUDENT", "Marked notification ID " + id + " as read.");
        return ResponseEntity.ok(convertToDto(notification));
    }

    @PostMapping("/admin/notifications/announcement")
    public ResponseEntity<NotificationDto> broadcastAnnouncement(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody Map<String, String> request) {
        String title = request.get("title");
        String message = request.get("message");
        Notification notification = notificationService.broadcastAnnouncement(title, message);
        auditLogService.log("BROADCAST_ANNOUNCEMENT", principal.getEmail(), "ADMIN", "Broadcasted announcement: " + title);
        return new ResponseEntity<>(convertToDto(notification), HttpStatus.CREATED);
    }

    private NotificationDto convertToDto(Notification n) {
        NotificationDto dto = new NotificationDto();
        dto.setNotificationId(n.getNotificationId());
        if (n.getStudent() != null) {
            dto.setStudentId(n.getStudent().getStudentId());
            dto.setStudentName(n.getStudent().getName());
        }
        dto.setTitle(n.getTitle());
        dto.setMessage(n.getMessage());
        dto.setType(n.getType());
        dto.setIsRead(n.getIsRead());
        dto.setCreatedAt(n.getCreatedAt());
        return dto;
    }
}
