package com.placement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DepartmentStatsDto {
    private String department;            // E.g., "CSE", "IT", "ECE", "EEE", "MECH", "CIVIL"
    private String departmentName;        // E.g., "Computer Science & Engineering"
    private Long totalStudents;           // E.g., 120
    private Long placedStudents;          // E.g., 95
    private Double placementPercentage;   // E.g., 79.17
    private Double averagePackage;        // E.g., 10.45
    private Double highestPackage;        // E.g., 32.50
}
