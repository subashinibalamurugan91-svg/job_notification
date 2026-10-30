package com.placement.service;

import com.placement.entity.Notification;
import com.placement.entity.Student;
import com.placement.exception.ResourceNotFoundException;
import com.placement.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    public List<Notification> getNotificationsForStudent(Integer studentId) {
        return notificationRepository.findNotificationsForStudent(studentId);
    }

    public Notification createNotification(Student student, String title, String message, String type) {
        Notification notification = new Notification();
        notification.setStudent(student);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
        notification.setIsRead(false);
        notification.setCreatedAt(LocalDateTime.now());
        return notificationRepository.save(notification);
    }

    public Notification broadcastAnnouncement(String title, String message) {
        Notification notification = new Notification();
        notification.setStudent(null); // global
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType("COMPANY_ANNOUNCEMENT");
        notification.setIsRead(false);
        notification.setCreatedAt(LocalDateTime.now());
        return notificationRepository.save(notification);
    }

    public Notification markAsRead(Integer id, Integer studentId) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        if (notification.getStudent() != null && !notification.getStudent().getStudentId().equals(studentId)) {
            throw new org.springframework.security.access.AccessDeniedException("You do not have permission to modify this notification");
        }
        notification.setIsRead(true);
        return notificationRepository.save(notification);
    }
}
