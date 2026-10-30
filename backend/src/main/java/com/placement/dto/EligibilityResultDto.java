package com.placement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EligibilityResultDto {
    private Integer companyId;
    private String companyName;
    private Double studentCgpa;
    private Double requiredCgpa;
    private Boolean cgpaEligible;
    private String cgpaStatus; // "PASSED" or "CGPA Not Eligible"

    private Double skillMatchPercentage;
    private Boolean skillEligible; // >= 60%
    private String skillStatus; // "PASSED" or "Skill Match Ineligible"
    private List<String> studentSkills = new ArrayList<>();
    private List<String> requiredSkills = new ArrayList<>();
    private List<String> matchedSkills = new ArrayList<>();
    private List<String> missingSkills = new ArrayList<>();
    private List<String> recommendedSkills = new ArrayList<>();

    private Boolean departmentEligible;
    private Boolean finalEligible;
    private String eligibilityStatus; // "FINAL_ELIGIBLE", "CGPA_NOT_ELIGIBLE", "SKILL_NOT_ELIGIBLE", etc.
    private String message;
}
