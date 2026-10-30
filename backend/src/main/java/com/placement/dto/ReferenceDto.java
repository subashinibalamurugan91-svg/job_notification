package com.placement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReferenceDto {
    private Integer referenceId;
    private Integer companyId;
    private String companyName;
    private String title;
    @Builder.Default
    private String category = "Placement Preparation";
    private String description;
    private String fileUrl;
    private String fileName;
    @Builder.Default
    private String uploadedBy = "Placement Cell";
    @Builder.Default
    private Integer downloadCount = 0;
    @Builder.Default
    private String referenceType = "PDF";
    private LocalDateTime uploadedAt;

    // Compatibility getters & setters for legacy frontend calls
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
