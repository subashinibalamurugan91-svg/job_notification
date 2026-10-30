package com.placement.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "interviews")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Interview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "interview_id")
    private Integer interviewId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(name = "round_name", nullable = false)
    private String roundName;

    @Column(name = "interview_date", nullable = false)
    private LocalDateTime interviewDate;

    @Column(nullable = false)
    private String venue;

    @Column(name = "meeting_link", length = 500)
    private String meetingLink;

    @Column(columnDefinition = "TEXT")
    private String instructions;

    @Column(length = 500)
    private String remarks;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "interview_students",
        joinColumns = @JoinColumn(name = "interview_id"),
        inverseJoinColumns = @JoinColumn(name = "student_id")
    )
    private java.util.Set<Student> students = new java.util.HashSet<>();

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
