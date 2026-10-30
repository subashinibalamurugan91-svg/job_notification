package com.placement.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class ApplicationResponseDto {
    private Integer applicationId;
    private Integer studentId;
    private String studentName;
    private String studentRegNo;
    private String studentDepartment;
    private Double studentCgpa;
    private Integer companyId;
    private String companyName;
    private Double packageAmount;
    private LocalDateTime appliedDate;
    private String status;
    private Double skillMatchPercentage;
    private List<String> studentSkills;
    private List<String> requiredSkills;
    private List<String> matchedSkills;
    private List<String> missingSkills;
    private String eligibilityStatus;
}

