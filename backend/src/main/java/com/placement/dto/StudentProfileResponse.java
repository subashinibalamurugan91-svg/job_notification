package com.placement.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class StudentProfileResponse {
    private Integer studentId;
    private String regNo;
    private String name;
    private String email;
    private String department;
    private Double cgpa;
    private String phone;
    private String resumeUrl;
    private String resumeFileName;
    private LocalDateTime resumeUploadedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private java.util.List<String> skills = new java.util.ArrayList<>();
}
