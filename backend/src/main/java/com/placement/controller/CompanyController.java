package com.placement.controller;

import com.placement.dto.CompanyDto;
import com.placement.entity.Company;
import com.placement.security.UserPrincipal;
import com.placement.service.CompanyService;
import com.placement.service.AuditLogService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api")
public class CompanyController {

    @Autowired
    private CompanyService companyService;

    @Autowired
    private AuditLogService auditLogService;

    @GetMapping("/companies")
    public ResponseEntity<List<Company>> getCompanies(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return ResponseEntity.ok(companyService.getAllCompanies());
        }
        return ResponseEntity.ok(companyService.getActiveCompanies());
    }

    @GetMapping("/companies/{id}")
    public ResponseEntity<Company> getCompanyById(@PathVariable Integer id) {
        Company company = companyService.getCompanyById(id);
        return ResponseEntity.ok(company);
    }

    @PostMapping("/admin/companies")
    public ResponseEntity<Company> createCompany(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CompanyDto dto) {
        Company company = companyService.createCompany(dto);
        auditLogService.log("CREATE_COMPANY", principal.getEmail(), "ADMIN", "Created recruitment drive for company: " + company.getCompanyName());
        return new ResponseEntity<>(company, HttpStatus.CREATED);
    }

    @PutMapping("/admin/companies/{id}")
    public ResponseEntity<Company> updateCompany(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Integer id,
            @Valid @RequestBody CompanyDto dto) {
        Company company = companyService.updateCompany(id, dto);
        auditLogService.log("UPDATE_COMPANY", principal.getEmail(), "ADMIN", "Updated company drive details for: " + company.getCompanyName());
        return ResponseEntity.ok(company);
    }

    @DeleteMapping("/admin/companies/{id}")
    public ResponseEntity<Void> deleteCompany(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Integer id) {
        Company company = companyService.getCompanyById(id);
        companyService.deleteCompany(id);
        auditLogService.log("DELETE_COMPANY", principal.getEmail(), "ADMIN", "Deleted company drive: " + company.getCompanyName());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/companies/{id}/eligibility-pipeline")
    public ResponseEntity<java.util.Map<String, Object>> getCompanyEligibilityPipeline(@PathVariable Integer id) {
        java.util.Map<String, Object> pipeline = companyService.getCompanyEligibilityPipeline(id);
        return ResponseEntity.ok(pipeline);
    }

    @PostMapping("/admin/companies/{id}/notify-eligible")
    public ResponseEntity<java.util.Map<String, Object>> notifyEligibleStudents(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Integer id) {
        int count = companyService.notifyEligibleStudentsForCompany(id);
        auditLogService.log("NOTIFY_ELIGIBLE_STUDENTS", principal.getEmail(), "ADMIN", "Dispatched targeted eligibility alerts to " + count + " candidates for company ID: " + id);
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("success", true);
        response.put("notificationsSent", count);
        return ResponseEntity.ok(response);
    }
}

