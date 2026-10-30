package com.placement.repository;

import com.placement.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Integer> {
    
    @Query("SELECT n FROM Notification n WHERE n.student.studentId = :studentId OR n.student IS NULL ORDER BY n.createdAt DESC")
    List<Notification> findNotificationsForStudent(@Param("studentId") Integer studentId);
}
