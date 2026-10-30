package com.placement.service;

import com.placement.dto.ReferenceDto;
import com.placement.entity.Company;
import com.placement.entity.Reference;
import com.placement.exception.ResourceNotFoundException;
import com.placement.repository.CompanyRepository;
import com.placement.repository.ReferenceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReferenceService {

    @Autowired
    private ReferenceRepository referenceRepository;

    @Autowired
    private CompanyRepository companyRepository;

    public List<ReferenceDto> getAllReferences(String category, String search) {
        List<Reference> list = referenceRepository.findAllByOrderByUploadedAtDesc();

        if (category != null && !category.trim().isEmpty() && !category.equalsIgnoreCase("ALL")) {
            list = list.stream()
                    .filter(r -> r.getCategory() != null && r.getCategory().equalsIgnoreCase(category.trim()))
                    .collect(Collectors.toList());
        }

        if (search != null && !search.trim().isEmpty()) {
            String q = search.trim().toLowerCase();
            list = list.stream()
                    .filter(r -> (r.getTitle() != null && r.getTitle().toLowerCase().contains(q)) ||
                                 (r.getDescription() != null && r.getDescription().toLowerCase().contains(q)) ||
                                 (r.getFileName() != null && r.getFileName().toLowerCase().contains(q)) ||
                                 (r.getCategory() != null && r.getCategory().toLowerCase().contains(q)))
                    .collect(Collectors.toList());
        }

        return list.stream().map(this::toDto).collect(Collectors.toList());
    }

    public List<ReferenceDto> getRecentReferences(int limit) {
        List<Reference> list = referenceRepository.findTop5ByOrderByUploadedAtDesc();
        if (limit > 0 && limit < list.size()) {
            list = list.subList(0, limit);
        }
        return list.stream().map(this::toDto).collect(Collectors.toList());
    }

    public ReferenceDto getReferenceById(Integer id) {
        Reference ref = referenceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reference not found with id: " + id));
        return toDto(ref);
    }

    public Reference createReference(ReferenceDto dto) {
        Company company = null;
        if (dto.getCompanyId() != null) {
            company = companyRepository.findById(dto.getCompanyId())
                    .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + dto.getCompanyId()));
        }

        Reference reference = new Reference();
        reference.setCompany(company);
        reference.setTitle(dto.getTitle());
        reference.setCategory(dto.getCategory() != null && !dto.getCategory().trim().isEmpty() ? dto.getCategory().trim() : "Placement Preparation");
        reference.setDescription(dto.getDescription());
        reference.setFileUrl(dto.getFileUrl());
        reference.setFileName(dto.getFileName());
        reference.setUploadedBy(dto.getUploadedBy() != null && !dto.getUploadedBy().trim().isEmpty() ? dto.getUploadedBy().trim() : "Placement Cell");
        reference.setDownloadCount(dto.getDownloadCount() != null ? dto.getDownloadCount() : 0);
        reference.setReferenceType(dto.getReferenceType() != null ? dto.getReferenceType() : "PDF");
        reference.setUploadedAt(dto.getUploadedAt() != null ? dto.getUploadedAt() : LocalDateTime.now());

        return referenceRepository.save(reference);
    }

    @Transactional
    public ReferenceDto updateReference(Integer id, ReferenceDto dto) {
        Reference ref = referenceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reference not found with id: " + id));

        if (dto.getTitle() != null && !dto.getTitle().trim().isEmpty()) {
            ref.setTitle(dto.getTitle().trim());
        }
        if (dto.getCategory() != null && !dto.getCategory().trim().isEmpty()) {
            ref.setCategory(dto.getCategory().trim());
        }
        if (dto.getDescription() != null) {
            ref.setDescription(dto.getDescription().trim());
        }
        if (dto.getUploadedBy() != null && !dto.getUploadedBy().trim().isEmpty()) {
            ref.setUploadedBy(dto.getUploadedBy().trim());
        }
        if (dto.getCompanyId() != null) {
            Company company = companyRepository.findById(dto.getCompanyId())
                    .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + dto.getCompanyId()));
            ref.setCompany(company);
        } else if (dto.getCompanyId() == null && dto.getCompanyName() == null) {
            ref.setCompany(null);
        }

        Reference updated = referenceRepository.save(ref);
        return toDto(updated);
    }

    @Transactional
    public void deleteReference(Integer id) {
        Reference reference = referenceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reference not found with id: " + id));
        referenceRepository.delete(reference);
    }

    @Transactional
    public Reference recordDownload(Integer id) {
        Reference ref = referenceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reference not found with id: " + id));
        ref.setDownloadCount(ref.getDownloadCount() == null ? 1 : ref.getDownloadCount() + 1);
        return referenceRepository.save(ref);
    }

    public Map<String, Object> getStatistics() {
        Map<String, Object> stats = new HashMap<>();
        long totalReferences = referenceRepository.count();
        Long totalDownloads = referenceRepository.sumDownloadCount();

        List<Object[]> catRows = referenceRepository.getCategoryCounts();
        Map<String, Long> categoryBreakdown = new LinkedHashMap<>();
        for (Object[] row : catRows) {
            String cat = (String) row[0];
            Long count = (Long) row[1];
            categoryBreakdown.put(cat != null ? cat : "General", count);
        }

        stats.put("totalReferences", totalReferences);
        stats.put("totalDownloads", totalDownloads != null ? totalDownloads : 0L);
        stats.put("categoryBreakdown", categoryBreakdown);

        return stats;
    }

    public ReferenceDto toDto(Reference ref) {
        if (ref == null) return null;
        ReferenceDto dto = new ReferenceDto();
        dto.setReferenceId(ref.getReferenceId());
        dto.setTitle(ref.getTitle());
        dto.setCategory(ref.getCategory() != null ? ref.getCategory() : "Placement Preparation");
        dto.setDescription(ref.getDescription());
        dto.setFileUrl(ref.getFileUrl());
        dto.setFileName(ref.getFileName());
        dto.setUploadedBy(ref.getUploadedBy() != null ? ref.getUploadedBy() : "Placement Cell");
        dto.setDownloadCount(ref.getDownloadCount() != null ? ref.getDownloadCount() : 0);
        dto.setReferenceType(ref.getReferenceType());
        dto.setUploadedAt(ref.getUploadedAt());
        if (ref.getCompany() != null) {
            dto.setCompanyId(ref.getCompany().getCompanyId());
            dto.setCompanyName(ref.getCompany().getCompanyName());
        }
        return dto;
    }
}
