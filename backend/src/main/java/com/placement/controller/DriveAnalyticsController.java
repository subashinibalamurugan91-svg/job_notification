package com.placement.controller;

import com.placement.entity.*;
import com.placement.repository.*;
import com.placement.service.CompanyService;
import com.placement.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class DriveAnalyticsController {

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private CompanyService companyService;

    @GetMapping("/admin/drives/{companyId}/analytics")
    public ResponseEntity<Map<String, Object>> getDriveAnalytics(@PathVariable Integer companyId) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Drive not found with id: " + companyId));

        List<Application> apps = applicationRepository.findByCompanyCompanyId(companyId);
        List<Student> eligibleStudents = companyService.getEligibleStudentsForCompany(company);

        long totalRegistrations = apps.size();
        long eligibleCount = eligibleStudents.size();
        
        long shortlistedCount = apps.stream()
                .filter(a -> a.getStatus() != ApplicationStatus.APPLIED && a.getStatus() != ApplicationStatus.REJECTED)
                .count();

        long selectedCount = apps.stream()
                .filter(a -> a.getStatus() == ApplicationStatus.SELECTED)
                .count();

        double successRate = totalRegistrations > 0 
            ? ((double) selectedCount / totalRegistrations) * 100 
            : 0.0;

        // Calculate dynamic drive status based on dates
        String driveStatus = "Upcoming";
        LocalDate today = LocalDate.now();
        if (today.isBefore(company.getApplicationDeadline().minusDays(7))) {
            driveStatus = "Upcoming";
        } else if (!today.isAfter(company.getApplicationDeadline())) {
            driveStatus = "Registration Open";
        } else if (today.isBefore(company.getDriveDate())) {
            driveStatus = "Registration Closed";
        } else if (today.equals(company.getDriveDate())) {
            driveStatus = "Interview Ongoing";
        } else {
            driveStatus = "Completed";
        }

        // Funnel Stages conversion counts
        List<Map<String, Object>> funnel = new ArrayList<>();
        
        funnel.add(Map.of("stage", "Eligible Pool", "candidates", eligibleCount));
        funnel.add(Map.of("stage", "Registered", "candidates", totalRegistrations));
        funnel.add(Map.of("stage", "Shortlisted", "candidates", shortlistedCount));
        
        long aptitudeCount = apps.stream().filter(a -> a.getStatus() != ApplicationStatus.APPLIED && a.getStatus() != ApplicationStatus.SHORTLISTED && a.getStatus() != ApplicationStatus.REJECTED).count();
        funnel.add(Map.of("stage", "Aptitude Cleared", "candidates", aptitudeCount));
        
        long techCount = apps.stream().filter(a -> a.getStatus() == ApplicationStatus.TECHNICAL_CLEARED || a.getStatus() == ApplicationStatus.HR_CLEARED || a.getStatus() == ApplicationStatus.SELECTED).count();
        funnel.add(Map.of("stage", "Technical Cleared", "candidates", techCount));

        long hrCount = apps.stream().filter(a -> a.getStatus() == ApplicationStatus.HR_CLEARED || a.getStatus() == ApplicationStatus.SELECTED).count();
        funnel.add(Map.of("stage", "HR Cleared", "candidates", hrCount));
        
        funnel.add(Map.of("stage", "Selected", "candidates", selectedCount));

        // Department-wise participation & selection ratio mapping
        Map<String, Map<String, Long>> deptGroupMap = apps.stream()
                .collect(Collectors.groupingBy(
                        a -> a.getStudent().getDepartment(),
                        Collectors.groupingBy(
                                a -> a.getStatus().name(),
                                Collectors.counting()
                        )
                ));

        List<Map<String, Object>> departmentStats = new ArrayList<>();
        for (String dept : deptGroupMap.keySet()) {
            Map<String, Long> statusCounts = deptGroupMap.get(dept);
            long regs = statusCounts.values().stream().mapToLong(Long::longValue).sum();
            long selections = statusCounts.getOrDefault("SELECTED", 0L);
            
            Map<String, Object> map = new HashMap<>();
            map.put("departmentName", dept);
            map.put("registrations", regs);
            map.put("selections", selections);
            departmentStats.add(map);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("companyId", company.getCompanyId());
        result.put("companyName", company.getCompanyName());
        result.put("driveStatus", driveStatus);
        result.put("totalRegistrations", totalRegistrations);
        result.put("eligibleCount", eligibleCount);
        result.put("shortlistedCount", shortlistedCount);
        result.put("selectedCount", selectedCount);
        result.put("successRate", Math.round(successRate * 10.0) / 10.0);
        result.put("funnel", funnel);
        result.put("departmentStats", departmentStats);

        return ResponseEntity.ok(result);
    }
}
