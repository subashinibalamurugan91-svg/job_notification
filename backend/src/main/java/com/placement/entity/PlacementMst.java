package com.placement.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "placement_mst", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"student_id", "company_id"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlacementMst {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "placement_id")
    private Integer placementId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(name = "department", nullable = false, length = 100)
    private String department;

    @Column(name = "package", nullable = false)
    private Double packageAmount;

    @Column(name = "offer_date", nullable = false)
    private LocalDateTime offerDate;

    @Column(name = "status", nullable = false, length = 50)
    @Builder.Default
    private String status = "SELECTED";

    @Column(name = "offer_accepted", nullable = false)
    @Builder.Default
    private Boolean offerAccepted = true;

    @Column(name = "academic_year", length = 20)
    @Builder.Default
    private String academicYear = "2026-2027";

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (offerDate == null) {
            offerDate = LocalDateTime.now();
        }
        if (status == null) {
            status = "SELECTED";
        }
        if (offerAccepted == null) {
            offerAccepted = true;
        }
        if (academicYear == null) {
            academicYear = "2026-2027";
        }
    }
}
