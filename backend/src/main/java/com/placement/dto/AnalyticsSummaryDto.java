package com.placement.dto;

import lombok.Data;

@Data
public class AnalyticsSummaryDto {
    private Long totalStudents;
    private Long totalCompanies;
    private Long totalApplications;
    private Long shortlistedCount;
    private Long selectedCount;
    private Long rejectedCount;
    private Long upcomingInterviewsCount;
    private Long interviewsTodayCount;
    private Long scheduledDrivesCount;
    private Double placementPercentage;
    private Long totalReferences;
    private Long totalDownloads;
}
