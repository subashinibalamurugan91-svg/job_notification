package com.placement.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "status_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StatusHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "history_id")
    private Integer historyId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id", nullable = false)
    private Application application;

    @Column(name = "previous_status")
    private String previousStatus;

    @Column(name = "current_status", nullable = false)
    private String currentStatus;

    @Column(name = "updated_by", nullable = false)
    private String updatedBy;

    @Column(columnDefinition = "TEXT")
    private String remarks;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();
}
