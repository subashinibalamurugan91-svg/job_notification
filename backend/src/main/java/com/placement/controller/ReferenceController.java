package com.placement.controller;

import com.placement.dto.ReferenceDto;
import com.placement.exception.BadRequestException;
import com.placement.exception.ResourceNotFoundException;
import com.placement.service.ReferenceService;
import com.placement.service.AuditLogService;
import com.placement.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class ReferenceController {

    private static final String UPLOAD_DIR = "s:/job_notification/uploads/references/";

    @Autowired
    private ReferenceService referenceService;

    @Autowired
    private AuditLogService auditLogService;

    /**
     * Get all references with optional category and search filters
     */
    @GetMapping({"/references", "/resources"})
    public ResponseEntity<List<ReferenceDto>> getAllReferences(
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "search", required = false) String search) {
        List<ReferenceDto> list = referenceService.getAllReferences(category, search);
        return ResponseEntity.ok(list);
    }

    /**
     * Get top 5 recently added references for student dashboard widget
     */
    @GetMapping({"/references/recent", "/resources/recent"})
    public ResponseEntity<List<ReferenceDto>> getRecentReferences(
            @RequestParam(value = "limit", defaultValue = "5") int limit) {
        List<ReferenceDto> list = referenceService.getRecentReferences(limit);
        return ResponseEntity.ok(list);
    }

    /**
     * Get reference statistics: total references, total downloads, category counts
     */
    @GetMapping({"/references/stats", "/admin/references/stats"})
    public ResponseEntity<Map<String, Object>> getReferenceStatistics() {
        Map<String, Object> stats = referenceService.getStatistics();
        return ResponseEntity.ok(stats);
    }

    /**
     * Get a specific reference by ID
     */
    @GetMapping({"/references/{id}", "/resources/{id}"})
    public ResponseEntity<ReferenceDto> getReferenceById(@PathVariable Integer id) {
        ReferenceDto dto = referenceService.getReferenceById(id);
        return ResponseEntity.ok(dto);
    }

    /**
     * Admin: Upload new reference document
     */
    @PostMapping({"/admin/references", "/admin/resources"})
    public ResponseEntity<ReferenceDto> createReference(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam("title") String title,
            @RequestParam(value = "category", required = false, defaultValue = "Placement Preparation") String category,
            @RequestParam("description") String description,
            @RequestParam(value = "uploadedBy", required = false) String uploadedBy,
            @RequestParam(value = "companyId", required = false) Integer companyId,
            @RequestParam("file") MultipartFile file) {

        // Validate file type
        String contentType = file.getContentType();
        String originalFilename = file.getOriginalFilename();
        if (contentType == null || (!contentType.equals("application/pdf") && (originalFilename == null || !originalFilename.toLowerCase().endsWith(".pdf")))) {
            throw new BadRequestException("Only PDF files are allowed.");
        }

        // Validate file size (max 5MB)
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new BadRequestException("File size exceeds the maximum limit of 5MB.");
        }

        // Determine uploader name
        String uploader = (uploadedBy != null && !uploadedBy.trim().isEmpty()) 
                ? uploadedBy.trim() 
                : (principal != null ? principal.getEmail() : "Placement Cell");

        // Generate safe unique filename on disk
        String cleanOriginalName = (originalFilename != null) ? originalFilename.replaceAll("[^a-zA-Z0-9.-]", "_") : "document.pdf";
        String safeDiskFilename = UUID.randomUUID().toString().substring(0, 8) + "_" + cleanOriginalName;

        try {
            File uploadFolder = new File(UPLOAD_DIR);
            if (!uploadFolder.exists()) {
                uploadFolder.mkdirs();
            }

            Path filepath = Paths.get(UPLOAD_DIR, safeDiskFilename);
            Files.write(filepath, file.getBytes());

        } catch (IOException e) {
            throw new RuntimeException("Could not store the file on the server. Error: " + e.getMessage());
        }

        ReferenceDto dto = new ReferenceDto();
        dto.setTitle(title.trim());
        dto.setCategory(category != null && !category.trim().isEmpty() ? category.trim() : "Placement Preparation");
        dto.setDescription(description != null ? description.trim() : "");
        dto.setCompanyId(companyId);
        dto.setFileUrl("uploads/references/" + safeDiskFilename);
        dto.setFileName(originalFilename != null ? originalFilename : cleanOriginalName);
        dto.setUploadedBy(uploader);
        dto.setDownloadCount(0);
        dto.setReferenceType("PDF");

        var created = referenceService.createReference(dto);
        String auditUser = principal != null ? principal.getEmail() : "admin";
        auditLogService.log("CREATE_REFERENCE", auditUser, "ADMIN", "Uploaded study reference: " + created.getTitle() + " in [" + created.getCategory() + "]");
        
        return new ResponseEntity<>(referenceService.toDto(created), HttpStatus.CREATED);
    }

    /**
     * Admin: Update reference metadata (Title, Category, Description, Company, UploadedBy)
     */
    @PutMapping({"/admin/references/{id}", "/admin/resources/{id}"})
    public ResponseEntity<ReferenceDto> updateReference(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Integer id,
            @RequestBody ReferenceDto dto) {
        ReferenceDto updated = referenceService.updateReference(id, dto);
        String auditUser = principal != null ? principal.getEmail() : "admin";
        auditLogService.log("UPDATE_REFERENCE", auditUser, "ADMIN", "Updated reference: " + updated.getTitle());
        return ResponseEntity.ok(updated);
    }

    /**
     * Admin: Delete reference
     */
    @DeleteMapping({"/admin/references/{id}", "/admin/resources/{id}"})
    public ResponseEntity<Void> deleteReference(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Integer id) {
        ReferenceDto reference = referenceService.getReferenceById(id);
        referenceService.deleteReference(id);
        String auditUser = principal != null ? principal.getEmail() : "admin";
        auditLogService.log("DELETE_REFERENCE", auditUser, "ADMIN", "Deleted study reference: " + reference.getTitle());
        return ResponseEntity.noContent().build();
    }

    /**
     * Preview or Download PDF file (increments download statistics)
     */
    @GetMapping({"/references/download/{id}", "/resources/download/{id}", "/references/preview/{id}", "/resources/preview/{id}"})
    public ResponseEntity<Resource> downloadOrPreviewFile(
            @PathVariable Integer id,
            @RequestParam(value = "download", defaultValue = "false") boolean forceDownload) {
        
        ReferenceDto reference = referenceService.getReferenceById(id);
        // Increment download count
        referenceService.recordDownload(id);

        try {
            Path filepath = Paths.get(reference.getFileUrl());
            if (!filepath.isAbsolute()) {
                filepath = Paths.get("s:/job_notification", reference.getFileUrl());
            }

            Resource fileResource = new UrlResource(filepath.toUri());
            if (!fileResource.exists() || !fileResource.isReadable()) {
                // Fallback check in uploads/resources if old path
                filepath = Paths.get("s:/job_notification/uploads/references", filepath.getFileName().toString());
                fileResource = new UrlResource(filepath.toUri());
            }

            if (fileResource.exists() && fileResource.isReadable()) {
                String dispositionType = forceDownload ? "attachment" : "inline";
                String downloadFilename = reference.getFileName() != null && !reference.getFileName().isEmpty() 
                        ? reference.getFileName() 
                        : fileResource.getFilename();

                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, dispositionType + "; filename=\"" + downloadFilename + "\"")
                        .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_PDF_VALUE)
                        .body(fileResource);
            } else {
                throw new ResourceNotFoundException("PDF Reference file not found on disk: " + reference.getFileUrl());
            }
        } catch (java.net.MalformedURLException e) {
            throw new RuntimeException("Could not read file: " + reference.getFileUrl(), e);
        }
    }
}
