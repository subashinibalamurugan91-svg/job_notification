package com.placement.controller;

import com.placement.dto.InterviewDto;
import com.placement.entity.Interview;
import com.placement.security.UserPrincipal;
import com.placement.service.InterviewService;
import com.placement.service.AuditLogService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class InterviewController {

    @Autowired
    private InterviewService interviewService;

    @Autowired
    private AuditLogService auditLogService;

    @GetMapping("/interviews")
    public ResponseEntity<List<InterviewDto>> getInterviews(@AuthenticationPrincipal UserPrincipal principal) {
        List<Interview> list;
        if (principal.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            list = interviewService.getAllInterviews();
        } else {
            list = interviewService.getInterviewsForStudent(principal.getId());
        }
        List<InterviewDto> dtos = list.stream().map(this::convertToDto).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/interviews/upcoming")
    public ResponseEntity<List<InterviewDto>> getUpcomingInterviews(@AuthenticationPrincipal UserPrincipal principal) {
        List<Interview> list;
        if (principal.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            list = interviewService.getUpcomingInterviews();
        } else {
            list = interviewService.getInterviewsForStudent(principal.getId()).stream()
                    .filter(i -> i.getInterviewDate().isAfter(java.time.LocalDateTime.now()))
                    .collect(Collectors.toList());
        }
        List<InterviewDto> dtos = list.stream().map(this::convertToDto).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/interviews/student")
    public ResponseEntity<List<InterviewDto>> getStudentInterviews(@AuthenticationPrincipal UserPrincipal principal) {
        List<InterviewDto> dtos = interviewService.getInterviewsForStudent(principal.getId())
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @PostMapping("/interviews")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<InterviewDto> createInterview(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody InterviewDto dto) {
        Interview interview = interviewService.createInterview(dto);
        auditLogService.log("CREATE_INTERVIEW", principal.getEmail(), "ADMIN", "Scheduled round: " + interview.getRoundName() + " for company: " + interview.getCompany().getCompanyName());
        return new ResponseEntity<>(convertToDto(interview), HttpStatus.CREATED);
    }

    @PutMapping("/interviews/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<InterviewDto> updateInterview(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Integer id,
            @Valid @RequestBody InterviewDto dto) {
        Interview interview = interviewService.updateInterview(id, dto);
        auditLogService.log("UPDATE_INTERVIEW", principal.getEmail(), "ADMIN", "Updated round details: " + interview.getRoundName() + " for company: " + interview.getCompany().getCompanyName());
        return ResponseEntity.ok(convertToDto(interview));
    }

    @DeleteMapping("/interviews/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteInterview(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Integer id) {
        Interview interview = interviewService.getInterviewById(id);
        interviewService.deleteInterview(id);
        auditLogService.log("DELETE_INTERVIEW", principal.getEmail(), "ADMIN", "Cancelled interview round: " + interview.getRoundName() + " for company: " + interview.getCompany().getCompanyName());
        return ResponseEntity.noContent().build();
    }

    private InterviewDto convertToDto(Interview i) {
        InterviewDto dto = new InterviewDto();
        dto.setInterviewId(i.getInterviewId());
        dto.setCompanyId(i.getCompany().getCompanyId());
        dto.setCompanyName(i.getCompany().getCompanyName());
        dto.setRoundName(i.getRoundName());
        dto.setInterviewDate(i.getInterviewDate());
        dto.setVenue(i.getVenue());
        dto.setMeetingLink(i.getMeetingLink());
        dto.setInstructions(i.getInstructions());
        dto.setRemarks(i.getRemarks());
        dto.setStudentIds(i.getStudents().stream().map(com.placement.entity.Student::getStudentId).collect(Collectors.toList()));
        dto.setStudentNames(i.getStudents().stream().map(com.placement.entity.Student::getName).collect(Collectors.toList()));
        return dto;
    }
}
