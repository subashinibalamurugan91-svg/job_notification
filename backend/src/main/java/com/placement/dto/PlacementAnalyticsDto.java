package com.placement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlacementAnalyticsDto {
    private Long totalPlacedStudents;
    private Double highestPackage;
    private Double averagePackage;
    private Long totalRecruitingCompanies;
    private Map<String, Long> departmentWisePlacements;
    private List<DepartmentStatsDto> departmentStats;
    private List<Map<String, Object>> companyWisePlacements;
    private Map<String, Long> packageDistribution;
    private List<String> academicYears;
}
