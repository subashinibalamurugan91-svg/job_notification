package com.placement.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "`references`")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Reference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "reference_id")
    private Integer referenceId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id")
    private Company company;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 100)
    private String category = "Placement Preparation";

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "file_url", nullable = false, length = 500)
    private String fileUrl;

    @Column(name = "file_name", length = 255)
    private String fileName;

    @Column(name = "uploaded_by", length = 100)
    private String uploadedBy = "Placement Cell";

    @Column(name = "download_count", nullable = false)
    private Integer downloadCount = 0;

    @Column(name = "reference_type", nullable = false, length = 100)
    private String referenceType = "PDF";

    @Column(name = "uploaded_at")
    private LocalDateTime uploadedAt = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        if (uploadedAt == null) {
            uploadedAt = LocalDateTime.now();
        }
        if (downloadCount == null) {
            downloadCount = 0;
        }
        if (referenceType == null) {
            referenceType = "PDF";
        }
        if (category == null || category.trim().isEmpty()) {
            category = "Placement Preparation";
        }
        if (uploadedBy == null || uploadedBy.trim().isEmpty()) {
            uploadedBy = "Placement Cell";
        }
    }

    // Compatibility getters & setters
    public Integer getResourceId() {
        return referenceId;
    }

    public void setResourceId(Integer resourceId) {
        this.referenceId = resourceId;
    }

    public String getResourceType() {
        return referenceType;
    }

    public void setResourceType(String resourceType) {
        this.referenceType = resourceType;
    }
}
