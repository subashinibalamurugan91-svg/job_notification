package com.placement.controller;

import com.placement.dto.PlacedStudentDto;
import com.placement.dto.PlacementAnalyticsDto;
import com.placement.service.AuditLogService;
import com.placement.service.PlacementService;
import com.placement.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/placed-students")
public class PlacementController {

    @Autowired
    private PlacementService placementService;

    @Autowired
    private AuditLogService auditLogService;

    /**
     * Get placed students with multi-criteria filtering and search
     */
    @GetMapping
    public ResponseEntity<List<PlacedStudentDto>> getPlacedStudents(
            @RequestParam(value = "department", required = false) String department,
            @RequestParam(value = "companyId", required = false) Integer companyId,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "academicYear", required = false) String academicYear,
            @RequestParam(value = "minPackage", required = false) Double minPackage,
            @RequestParam(value = "maxPackage", required = false) Double maxPackage,
            @RequestParam(value = "search", required = false) String search) {

        List<PlacedStudentDto> placedStudents = placementService.getPlacedStudents(
                department, companyId, status, academicYear, minPackage, maxPackage, search);
        return ResponseEntity.ok(placedStudents);
    }

    /**
     * Get placement analytics: summary metrics, department distribution, company stats, package distribution
     */
    @GetMapping("/analytics")
    public ResponseEntity<PlacementAnalyticsDto> getPlacementAnalytics(
            @RequestParam(value = "academicYear", required = false) String academicYear) {
        PlacementAnalyticsDto analytics = placementService.getPlacementAnalytics(academicYear);
        return ResponseEntity.ok(analytics);
    }

    /**
     * Update placement status / offer acceptance
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<PlacedStudentDto> updatePlacementStatus(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Integer id,
            @RequestBody Map<String, Object> body) {

        String status = (String) body.get("status");
        Boolean offerAccepted = body.get("offerAccepted") != null ? (Boolean) body.get("offerAccepted") : null;

        PlacedStudentDto updated = placementService.updatePlacementStatus(id, status, offerAccepted);
        String auditUser = principal != null ? principal.getEmail() : "admin";
        auditLogService.log("UPDATE_PLACEMENT_STATUS", auditUser, "ADMIN",
                "Updated placement status for student: " + updated.getStudentName() + " to: " + updated.getPlacementStatus());

        return ResponseEntity.ok(updated);
    }

    /**
     * Export placed students to CSV
     */
    @GetMapping("/export/csv")
    public ResponseEntity<byte[]> exportCsv(
            @RequestParam(value = "department", required = false) String department,
            @RequestParam(value = "companyId", required = false) Integer companyId,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "academicYear", required = false) String academicYear,
            @RequestParam(value = "minPackage", required = false) Double minPackage,
            @RequestParam(value = "maxPackage", required = false) Double maxPackage,
            @RequestParam(value = "search", required = false) String search) {

        List<PlacedStudentDto> list = placementService.getPlacedStudents(
                department, companyId, status, academicYear, minPackage, maxPackage, search);
        byte[] csv = placementService.exportPlacedStudentsCsv(list);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, "text/csv; charset=UTF-8")
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"placed_students.csv\"")
                .body(csv);
    }

    /**
     * Export placed students to Excel (.xls)
     */
    @GetMapping("/export/excel")
    public ResponseEntity<byte[]> exportExcel(
            @RequestParam(value = "department", required = false) String department,
            @RequestParam(value = "companyId", required = false) Integer companyId,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "academicYear", required = false) String academicYear,
            @RequestParam(value = "minPackage", required = false) Double minPackage,
            @RequestParam(value = "maxPackage", required = false) Double maxPackage,
            @RequestParam(value = "search", required = false) String search) {

        List<PlacedStudentDto> list = placementService.getPlacedStudents(
                department, companyId, status, academicYear, minPackage, maxPackage, search);
        byte[] excel = placementService.exportPlacedStudentsExcel(list);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, "application/vnd.ms-excel; charset=UTF-8")
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"placed_students.xls\"")
                .body(excel);
    }

    /**
     * Get department-wise placement statistics (Total students, placed students, percentage, avg & max pkg)
     */
    @GetMapping("/department-stats")
    public ResponseEntity<List<com.placement.dto.DepartmentStatsDto>> getDepartmentStats(
            @RequestParam(value = "academicYear", required = false) String academicYear) {
        List<com.placement.dto.DepartmentStatsDto> stats = placementService.getDepartmentStats(academicYear);
        return ResponseEntity.ok(stats);
    }

    /**
     * Export Department-wise Report as Excel (.xls)
     */
    @GetMapping("/export/department-stats/excel")
    public ResponseEntity<byte[]> exportDepartmentStatsExcel(
            @RequestParam(value = "academicYear", required = false) String academicYear) {
        List<com.placement.dto.DepartmentStatsDto> stats = placementService.getDepartmentStats(academicYear);
        byte[] excel = placementService.exportDepartmentStatsExcel(stats);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, "application/vnd.ms-excel; charset=UTF-8")
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"department_placement_statistics.xls\"")
                .body(excel);
    }

    /**
     * Export Department-wise Report as PDF-ready printable report
     */
    @GetMapping("/export/department-stats/pdf")
    public ResponseEntity<byte[]> exportDepartmentStatsPdf(
            @RequestParam(value = "academicYear", required = false) String academicYear) {
        List<com.placement.dto.DepartmentStatsDto> stats = placementService.getDepartmentStats(academicYear);
        byte[] pdf = placementService.exportDepartmentStatsPdf(stats);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, "text/html; charset=UTF-8")
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"department_placement_report.html\"")
                .body(pdf);
    }

    /**
     * General PDF export for department report
     */
    @GetMapping("/export/pdf")
    public ResponseEntity<byte[]> exportPdf(
            @RequestParam(value = "academicYear", required = false) String academicYear) {
        List<com.placement.dto.DepartmentStatsDto> stats = placementService.getDepartmentStats(academicYear);
        byte[] pdf = placementService.exportDepartmentStatsPdf(stats);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, "text/html; charset=UTF-8")
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"placement_analytics_report.html\"")
                .body(pdf);
    }
}
