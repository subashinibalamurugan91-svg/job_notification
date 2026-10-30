package com.placement.controller;

import com.placement.security.UserPrincipal;
import com.placement.service.ReadinessEngineService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class ReadinessController {

    @Autowired
    private ReadinessEngineService readinessEngineService;

    // Student endpoint
    @GetMapping("/readiness/me")
    public ResponseEntity<Map<String, Object>> getMyReadiness(@AuthenticationPrincipal UserPrincipal principal) {
        Map<String, Object> data = readinessEngineService.calculateStudentReadiness(principal.getId());
        return ResponseEntity.ok(data);
    }

    // Admin endpoint
    @GetMapping("/admin/readiness/summary")
    public ResponseEntity<Map<String, Object>> getAdminReadinessSummary() {
        Map<String, Object> data = readinessEngineService.calculateAdminReadinessSummary();
        return ResponseEntity.ok(data);
    }
}
