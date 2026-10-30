package com.placement.controller;

import com.placement.dto.StudentProfileResponse;
import com.placement.entity.Student;
import com.placement.security.UserPrincipal;
import com.placement.service.StudentService;
import com.placement.service.AuditLogService;
import com.placement.exception.BadRequestException;
import com.placement.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class StudentController {

    private static final String UPLOAD_DIR = "s:/job_notification/uploads/resumes/";

    @Autowired
    private StudentService studentService;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private com.placement.service.CompanyService companyService;

    @Autowired
    private com.placement.service.EligibilityEngineService eligibilityEngineService;

    @GetMapping("/students/me")
    public ResponseEntity<StudentProfileResponse> getMyProfile(@AuthenticationPrincipal UserPrincipal principal) {
        Student student = studentService.getStudentById(principal.getId());
        return ResponseEntity.ok(convertToDto(student));
    }

    @GetMapping("/students/me/eligibility-overview")
    public ResponseEntity<List<com.placement.dto.EligibilityResultDto>> getMyEligibilityOverview(
            @AuthenticationPrincipal UserPrincipal principal) {
        Student student = studentService.getStudentById(principal.getId());
        List<com.placement.entity.Company> activeCompanies = companyService.getActiveCompanies();
        List<com.placement.dto.EligibilityResultDto> results = activeCompanies.stream()
                .map(c -> eligibilityEngineService.evaluateEligibility(student, c))
                .collect(Collectors.toList());
        return ResponseEntity.ok(results);
    }

    @PutMapping("/students/me")
    public ResponseEntity<StudentProfileResponse> updateMyProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody Student updatedDetails) {
        Student student = studentService.updateStudentProfile(principal.getId(), updatedDetails);
        auditLogService.log("UPDATE_PROFILE", principal.getEmail(), "STUDENT", "Updated academic profile information.");
        return ResponseEntity.ok(convertToDto(student));
    }

    @PutMapping("/students/me/skills")
    public ResponseEntity<StudentProfileResponse> updateMySkills(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody List<String> skills) {
        Student student = studentService.updateStudentSkills(principal.getId(), skills);
        auditLogService.log("UPDATE_SKILLS", principal.getEmail(), "STUDENT", "Updated technical skill list: " + String.join(", ", skills));
        return ResponseEntity.ok(convertToDto(student));
    }

    @PostMapping("/students/me/resume")
    public ResponseEntity<StudentProfileResponse> uploadResume(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam("file") MultipartFile file) {

        String contentType = file.getContentType();
        if (contentType == null || !contentType.equals("application/pdf")) {
            throw new BadRequestException("Only PDF files are allowed.");
        }

        if (file.getSize() > 5 * 1024 * 1024) {
            throw new BadRequestException("File size exceeds the maximum limit of 5MB.");
        }

        String originalFilename = file.getOriginalFilename();
        String safeFilename = UUID.randomUUID().toString() + "_" + (originalFilename != null ? originalFilename.replaceAll("[^a-zA-Z0-9.-]", "_") : "resume.pdf");

        try {
            File uploadFolder = new File(UPLOAD_DIR);
            if (!uploadFolder.exists()) {
                uploadFolder.mkdirs();
            }

            Path filepath = Paths.get(UPLOAD_DIR, safeFilename);
            Files.write(filepath, file.getBytes());

        } catch (IOException e) {
            throw new RuntimeException("Could not store the resume file on the server. Error: " + e.getMessage());
        }

        String dbPath = "uploads/resumes/" + safeFilename;
        Student student = studentService.updateStudentResume(principal.getId(), dbPath, originalFilename);
        auditLogService.log("UPLOAD_RESUME", principal.getEmail(), "STUDENT", "Uploaded a new resume: " + originalFilename);

        return ResponseEntity.ok(convertToDto(student));
    }

    @DeleteMapping("/students/me/resume")
    public ResponseEntity<StudentProfileResponse> deleteResume(@AuthenticationPrincipal UserPrincipal principal) {
        Student student = studentService.deleteStudentResume(principal.getId());
        auditLogService.log("DELETE_RESUME", principal.getEmail(), "STUDENT", "Deleted the uploaded resume.");
        return ResponseEntity.ok(convertToDto(student));
    }

    @GetMapping("/students/resume/download/{id}")
    public ResponseEntity<org.springframework.core.io.Resource> downloadResume(
            @PathVariable Integer id,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        Student student = studentService.getStudentById(id);
        if (student.getResumeUrl() == null) {
            throw new ResourceNotFoundException("Resume not found for student ID: " + id);
        }

        // Validate that student is downloading their own resume, or user is an ADMIN
        boolean isAdmin = principal.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (!isAdmin && !student.getStudentId().equals(principal.getId())) {
            return new ResponseEntity<>(org.springframework.http.HttpStatus.FORBIDDEN);
        }

        try {
            Path filepath = Paths.get(student.getResumeUrl());
            if (!filepath.isAbsolute()) {
                filepath = Paths.get("s:/job_notification", student.getResumeUrl());
            }

            org.springframework.core.io.Resource fileResource = new org.springframework.core.io.UrlResource(filepath.toUri());
            if (fileResource.exists() || fileResource.isReadable()) {
                return ResponseEntity.ok()
                        .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + student.getResumeFileName() + "\"")
                        .header(org.springframework.http.HttpHeaders.CONTENT_TYPE, "application/pdf")
                        .body(fileResource);
            } else {
                throw new ResourceNotFoundException("Resume file not found on disk.");
            }
        } catch (java.net.MalformedURLException e) {
            throw new RuntimeException("Could not read resume file.", e);
        }
    }

    @GetMapping("/admin/students")
    public ResponseEntity<List<StudentProfileResponse>> getAllStudents(
            @RequestParam(required = false) String department) {
        List<Student> list = studentService.getAllStudents();
        List<StudentProfileResponse> students = list.stream()
                .filter(s -> department == null || s.getDepartment().equalsIgnoreCase(department))
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(students);
    }

    @GetMapping("/admin/students/{id}")
    public ResponseEntity<StudentProfileResponse> getStudentById(@PathVariable Integer id) {
        Student student = studentService.getStudentById(id);
        return ResponseEntity.ok(convertToDto(student));
    }

    private StudentProfileResponse convertToDto(Student student) {
        StudentProfileResponse dto = new StudentProfileResponse();
        dto.setStudentId(student.getStudentId());
        dto.setRegNo(student.getRegNo());
        dto.setName(student.getName());
        dto.setEmail(student.getEmail());
        dto.setDepartment(student.getDepartment());
        dto.setCgpa(student.getCgpa());
        dto.setPhone(student.getPhone());
        dto.setResumeUrl(student.getResumeUrl());
        dto.setResumeFileName(student.getResumeFileName());
        dto.setResumeUploadedAt(student.getResumeUploadedAt());
        dto.setCreatedAt(student.getCreatedAt());
        dto.setUpdatedAt(student.getUpdatedAt());
        dto.setSkills(student.getSkills() != null ? new java.util.ArrayList<>(student.getSkills()) : new java.util.ArrayList<>());
        return dto;
    }
}
