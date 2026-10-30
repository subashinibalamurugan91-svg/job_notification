package com.placement.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class InterviewDto {
    private Integer interviewId;

    @NotNull(message = "Company ID is required")
    private Integer companyId;

    private String companyName;

    @NotBlank(message = "Round name is required")
    private String roundName;

    @NotNull(message = "Interview date is required")
    private LocalDateTime interviewDate;

    @NotBlank(message = "Venue is required")
    private String venue;

    private String meetingLink;

    private String instructions;

    private String remarks;

    private java.util.List<Integer> studentIds = new java.util.ArrayList<>();

    private java.util.List<String> studentNames = new java.util.ArrayList<>();
}
