package com.placement.controller;

import com.placement.dto.AnalyticsSummaryDto;
import com.placement.dto.IntelligenceDto;
import com.placement.entity.Application;
import com.placement.entity.ApplicationStatus;
import com.placement.service.AnalyticsService;
import com.placement.service.ApplicationService;
import com.placement.util.CsvExportUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class AnalyticsController {

    @Autowired
    private AnalyticsService analyticsService;

    @Autowired
    private ApplicationService applicationService;

    @GetMapping("/admin/analytics/summary")
    public ResponseEntity<AnalyticsSummaryDto> getSummaryMetrics() {
        AnalyticsSummaryDto summary = analyticsService.getSummaryMetrics();
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/admin/analytics/intelligence")
    public ResponseEntity<IntelligenceDto> getIntelligenceData() {
        IntelligenceDto data = analyticsService.getIntelligenceData();
        return ResponseEntity.ok(data);
    }

    @GetMapping("/admin/analytics/company-wise")
    public ResponseEntity<List<Map<String, Object>>> getCompanyWiseStats() {
        List<Map<String, Object>> stats = analyticsService.getCompanyWiseStats();
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/admin/analytics/department-wise")
    public ResponseEntity<List<Map<String, Object>>> getDepartmentWiseStats() {
        List<Map<String, Object>> stats = analyticsService.getDepartmentWiseStats();
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/admin/analytics/monthly-trends")
    public ResponseEntity<List<Map<String, Object>>> getMonthlyApplicationTrends() {
        List<Map<String, Object>> trends = analyticsService.getMonthlyApplicationTrends();
        return ResponseEntity.ok(trends);
    }

    @GetMapping("/admin/reports/applications.csv")
    public ResponseEntity<byte[]> downloadApplicationsCsv() {
        List<Application> applications = applicationService.getAllApplications();
        byte[] csvData = CsvExportUtil.exportApplicationsToCsv(applications);
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, "text/csv")
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=applications.csv")
                .body(csvData);
    }

    @GetMapping("/admin/reports/selected.csv")
    public ResponseEntity<byte[]> downloadSelectedCsv() {
        List<Application> selectedApplications = applicationService.getAllApplications()
                .stream()
                .filter(app -> app.getStatus() == ApplicationStatus.SELECTED)
                .collect(Collectors.toList());
                
        byte[] csvData = CsvExportUtil.exportSelectedStudentsToCsv(selectedApplications);
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, "text/csv")
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=selected_students.csv")
                .body(csvData);
    }
}
