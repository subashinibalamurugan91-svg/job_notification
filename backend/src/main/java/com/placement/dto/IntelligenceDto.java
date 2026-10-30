package com.placement.dto;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class IntelligenceDto {
    private Summary summary;
    private List<Map<String, Object>> funnel;
    private List<Map<String, Object>> eligibilityPipeline;
    private List<Map<String, Object>> skillMatchDistribution;
    private List<Map<String, Object>> mostMissingSkills;
    private List<Map<String, Object>> companyEligibilityRates;
    private List<Map<String, Object>> departmentStats;
    private List<Map<String, Object>> companyStats;
    private StudentInsights studentInsights;
    private Double averageStudentReadiness;

    @Data
    public static class Summary {
        private Long totalStudents;
        private Long cgpaEligibleStudents;
        private Long skillEligibleStudents;
        private Long finalEligibleStudents;
        private Long eligibleStudents; // Backward compatibility
        private Long appliedStudents;
        private Long shortlistedStudents;
        private Long selectedStudents;
        private Double placementPercentage;
        private Double averagePackage;
        private Double highestPackage;
    }

    @Data
    public static class StudentInsights {
        private List<Map<String, Object>> topPerforming;
        private List<Map<String, Object>> awaitingInterviews;
        private List<Map<String, Object>> withoutApplications;
        private List<Map<String, Object>> nearThreshold;
    }
}
