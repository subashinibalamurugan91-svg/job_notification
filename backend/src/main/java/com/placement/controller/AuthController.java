package com.placement.controller;

import com.placement.dto.AuthRequest;
import com.placement.dto.AuthResponse;
import com.placement.dto.StudentRegisterRequest;
import com.placement.entity.Student;
import com.placement.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private com.placement.service.AuditLogService auditLogService;

    @Autowired
    private com.placement.service.AnalyticsService analyticsService;

    @PostMapping("/register")
    public ResponseEntity<Student> registerStudent(@Valid @RequestBody StudentRegisterRequest request) {
        Student student = authService.registerStudent(request);
        auditLogService.log("STUDENT_REGISTRATION", student.getEmail(), "STUDENT", "Student " + student.getName() + " registered successfully.");
        return new ResponseEntity<>(student, HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
        AuthResponse response = authService.authenticate(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/showcase")
    public ResponseEntity<java.util.Map<String, Object>> getShowcaseData() {
        java.util.Map<String, Object> data = new java.util.HashMap<>();
        data.put("summary", analyticsService.getSummaryMetrics());
        data.put("intelligence", analyticsService.getIntelligenceData());
        data.put("companyStats", analyticsService.getCompanyWiseStats());
        data.put("departmentStats", analyticsService.getDepartmentWiseStats());
        data.put("monthlyTrends", analyticsService.getMonthlyApplicationTrends());
        return ResponseEntity.ok(data);
    }
}
