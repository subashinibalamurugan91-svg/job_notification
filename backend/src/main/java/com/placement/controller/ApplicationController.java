package com.placement.controller;

import com.placement.dto.ApplicationResponseDto;
import com.placement.entity.Application;
import com.placement.entity.StatusHistory;
import com.placement.security.UserPrincipal;
import com.placement.service.ApplicationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class ApplicationController {

    @Autowired
    private ApplicationService applicationService;

    @Autowired
    private com.placement.service.AuditLogService auditLogService;

    @Autowired
    private com.placement.service.EligibilityEngineService eligibilityEngineService;

    @Autowired
    private com.placement.service.StudentService studentService;

    @Autowired
    private com.placement.service.CompanyService companyService;

    @GetMapping("/applications/check-eligibility/{companyId}")
    public ResponseEntity<com.placement.dto.EligibilityResultDto> checkEligibility(
            @PathVariable Integer companyId,
            @AuthenticationPrincipal UserPrincipal principal) {
        com.placement.entity.Student student = studentService.getStudentById(principal.getId());
        com.placement.entity.Company company = companyService.getCompanyById(companyId);
        com.placement.dto.EligibilityResultDto eval = eligibilityEngineService.evaluateEligibility(student, company);
        return ResponseEntity.ok(eval);
    }

    @PostMapping("/applications")
    public ResponseEntity<ApplicationResponseDto> applyToCompany(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody Map<String, Integer> request) {
        
        Integer companyId = request.get("companyId");
        Application application = applicationService.applyToCompany(principal.getId(), companyId);
        auditLogService.log("APPLY_TO_COMPANY", principal.getEmail(), "STUDENT", "Applied to company recruitment drive: " + application.getCompany().getCompanyName());
        return new ResponseEntity<>(convertToDto(application), HttpStatus.CREATED);
    }

    @GetMapping("/applications/me")
    public ResponseEntity<List<ApplicationResponseDto>> getMyApplications(@AuthenticationPrincipal UserPrincipal principal) {
        List<ApplicationResponseDto> applications = applicationService.getStudentApplications(principal.getId())
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(applications);
    }

    @GetMapping("/admin/applications")
    public ResponseEntity<List<ApplicationResponseDto>> getAllApplications(
            @RequestParam(required = false) Integer companyId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) Double minCgpa,
            @RequestParam(required = false) Double minPackage) {
        
        List<Application> apps = applicationService.getAllApplications();
        
        List<ApplicationResponseDto> applications = apps.stream()
                .filter(a -> companyId == null || a.getCompany().getCompanyId().equals(companyId))
                .filter(a -> status == null || a.getStatus().name().equalsIgnoreCase(status))
                .filter(a -> department == null || a.getStudent().getDepartment().equalsIgnoreCase(department))
                .filter(a -> minCgpa == null || a.getStudent().getCgpa() >= minCgpa)
                .filter(a -> minPackage == null || a.getCompany().getPackageAmount() >= minPackage)
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(applications);
    }

    @PutMapping("/admin/applications/{id}/status")
    public ResponseEntity<ApplicationResponseDto> updateStatus(
            @PathVariable Integer id,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody Map<String, String> request) {
        
        String status = request.get("status");
        String remarks = request.get("remarks");
        Application application = applicationService.updateApplicationStatus(id, status, principal.getEmail(), remarks);
        auditLogService.log("UPDATE_APPLICATION_STATUS", principal.getEmail(), "ADMIN", "Updated application status for student: " + application.getStudent().getName() + " to: " + status);
        return ResponseEntity.ok(convertToDto(application));
    }

    @GetMapping("/applications/{id}/history")
    public ResponseEntity<List<StatusHistory>> getHistory(
            @PathVariable Integer id,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        Application app = applicationService.getApplicationById(id);
        
        // Enforce student ownership check
        boolean isAdmin = principal.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (!isAdmin && !app.getStudent().getStudentId().equals(principal.getId())) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        }
        
        List<StatusHistory> history = applicationService.getStatusHistory(id);
        return ResponseEntity.ok(history);
    }

    private ApplicationResponseDto convertToDto(Application app) {
        ApplicationResponseDto dto = new ApplicationResponseDto();
        dto.setApplicationId(app.getApplicationId());
        dto.setStudentId(app.getStudent().getStudentId());
        dto.setStudentName(app.getStudent().getName());
        dto.setStudentRegNo(app.getStudent().getRegNo());
        dto.setStudentDepartment(app.getStudent().getDepartment());
        dto.setStudentCgpa(app.getStudent().getCgpa());
        dto.setCompanyId(app.getCompany().getCompanyId());
        dto.setCompanyName(app.getCompany().getCompanyName());
        dto.setPackageAmount(app.getCompany().getPackageAmount());
        dto.setAppliedDate(app.getAppliedDate());
        dto.setStatus(app.getStatus().name());
        dto.setSkillMatchPercentage(app.getSkillMatchPercentage());

        if (app.getStudent() != null && app.getCompany() != null) {
            com.placement.dto.EligibilityResultDto eval = eligibilityEngineService.evaluateEligibility(app.getStudent(), app.getCompany());
            if (dto.getSkillMatchPercentage() == null || dto.getSkillMatchPercentage() == 0.0) {
                dto.setSkillMatchPercentage(eval.getSkillMatchPercentage());
            }
            dto.setStudentSkills(eval.getStudentSkills());
            dto.setRequiredSkills(eval.getRequiredSkills());
            dto.setMatchedSkills(eval.getMatchedSkills());
            dto.setMissingSkills(eval.getMissingSkills());
            dto.setEligibilityStatus(eval.getEligibilityStatus());
        }

        return dto;
    }
}
