package com.placement.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDate;

@Data
public class CompanyDto {
    private Integer companyId;

    @NotBlank(message = "Company name is required")
    private String companyName;

    private String description;

    @NotNull(message = "Eligibility CGPA is required")
    @Min(value = 0, message = "CGPA cannot be negative")
    @Max(value = 10, message = "CGPA cannot exceed 10.00")
    private Double eligibilityCgpa;

    @NotBlank(message = "Eligible departments are required")
    private String eligibleDepartments; // comma-separated

    @NotNull(message = "Package amount (CTC) is required")
    @Positive(message = "Package must be positive")
    private Double packageAmount;

    @NotNull(message = "Application deadline is required")
    private LocalDate applicationDeadline;

    @NotNull(message = "Drive date is required")
    private LocalDate driveDate;

    private Boolean active = true;

    private java.util.List<String> requiredSkills = new java.util.ArrayList<>();
}
