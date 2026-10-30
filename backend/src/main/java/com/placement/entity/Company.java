package com.placement.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;

@Entity
@Table(name = "companies")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Company {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "company_id")
    private Integer companyId;

    @Column(name = "company_name", nullable = false)
    private String companyName;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "eligibility_cgpa", nullable = false)
    private Double eligibilityCgpa = 0.0;

    @Column(name = "eligible_departments", nullable = false, length = 500)
    private String eligibleDepartments; // Comma-separated list of branches

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "required_skills", joinColumns = @JoinColumn(name = "company_id"))
    @Column(name = "skill", nullable = false)
    private List<String> requiredSkills = new ArrayList<>();

    @Column(name = "package_amount", nullable = false)
    private Double packageAmount; // CTC in LPA

    @Column(name = "application_deadline", nullable = false)
    private LocalDate applicationDeadline;

    @Column(name = "drive_date", nullable = false)
    private LocalDate driveDate;

    @Column(nullable = false)
    private Boolean active = true;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
