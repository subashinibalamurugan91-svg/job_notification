package com.placement.service;

import com.placement.dto.EligibilityResultDto;
import com.placement.entity.Company;
import com.placement.entity.Student;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class EligibilityEngineService {

    public static final double MIN_SKILL_MATCH_THRESHOLD = 60.0;

    /**
     * Check if a student's skill matches a required skill using smart normalization.
     * Prevents false positives (e.g., "Java" will NOT match "JavaScript").
     */
    public boolean isSkillMatch(String studentSkill, String requiredSkill) {
        if (studentSkill == null || requiredSkill == null) return false;
        String s1 = studentSkill.trim().toLowerCase();
        String s2 = requiredSkill.trim().toLowerCase();

        if (s1.equals(s2)) return true;

        // Strip non-alphanumeric characters for flexible matching
        String clean1 = s1.replaceAll("[^a-z0-9]", "");
        String clean2 = s2.replaceAll("[^a-z0-9]", "");
        if (!clean1.isEmpty() && clean1.equals(clean2)) return true;

        // Common Tech Stack Aliases & Synonyms
        if (isAliasPair(s1, s2, "react", "reactjs", "react.js")) return true;
        if (isAliasPair(s1, s2, "angular", "angularjs", "angular.js")) return true;
        if (isAliasPair(s1, s2, "vue", "vuejs", "vue.js")) return true;
        if (isAliasPair(s1, s2, "node", "nodejs", "node.js")) return true;
        if (isAliasPair(s1, s2, "spring boot", "springboot", "spring-boot")) return true;
        if (isAliasPair(s1, s2, "c++", "cpp")) return true;
        if (isAliasPair(s1, s2, "c#", "csharp")) return true;
        if (isAliasPair(s1, s2, "golang", "go")) return true;
        if (isAliasPair(s1, s2, "sql", "mysql", "postgresql", "rdbms") && (s1.equals("sql") || s2.equals("sql"))) return true;

        return false;
    }

    private boolean isAliasPair(String s1, String s2, String... aliases) {
        Set<String> set = new HashSet<>(Arrays.asList(aliases));
        return set.contains(s1) && set.contains(s2);
    }

    /**
     * Stage 2 Skill Match Calculation
     */
    public SkillMatchResult calculateSkillMatch(List<String> studentSkills, List<String> requiredSkills) {
        if (requiredSkills == null || requiredSkills.isEmpty()) {
            return new SkillMatchResult(100.0, true, Collections.emptyList(), Collections.emptyList(), Collections.emptyList());
        }

        List<String> sSkills = studentSkills != null ? studentSkills : Collections.emptyList();
        List<String> matched = new ArrayList<>();
        List<String> missing = new ArrayList<>();

        for (String reqSkill : requiredSkills) {
            if (reqSkill == null || reqSkill.trim().isEmpty()) continue;
            String trimmedReq = reqSkill.trim();

            boolean isFound = sSkills.stream()
                    .filter(Objects::nonNull)
                    .anyMatch(st -> isSkillMatch(st, trimmedReq));

            if (isFound) {
                matched.add(trimmedReq);
            } else {
                missing.add(trimmedReq);
            }
        }

        double score = ((double) matched.size() / requiredSkills.size()) * 100.0;
        score = Math.round(score * 100.0) / 100.0; // 2 decimal places
        boolean isEligible = score >= MIN_SKILL_MATCH_THRESHOLD;

        return new SkillMatchResult(score, isEligible, matched, missing, missing);
    }

    /**
     * Two-Stage Eligibility Verification:
     * Stage 1: CGPA Screening
     * - Compare student CGPA with the minimum CGPA required in the Job Description.
     * - Students failing this condition are marked as "CGPA Not Eligible".
     *
     * Stage 2: Skill Matching
     * - Compare student skills with required skills in the Job Description.
     * - Store skills as list/tag structure.
     * - Calculate skill match percentage.
     * - Skill Match Score must be >= 60%.
     *
     * Eligibility Rules:
     * - CGPA must satisfy company criteria.
     * - Skill Match Score must be >= 60%.
     * - Only students satisfying both conditions become eligible.
     */
    public EligibilityResultDto evaluateEligibility(Student student, Company company) {
        EligibilityResultDto.EligibilityResultDtoBuilder builder = EligibilityResultDto.builder();
        builder.companyId(company.getCompanyId());
        builder.companyName(company.getCompanyName());
        builder.studentCgpa(student.getCgpa());
        builder.requiredCgpa(company.getEligibilityCgpa());
        builder.studentSkills(student.getSkills() != null ? new ArrayList<>(student.getSkills()) : new ArrayList<>());
        builder.requiredSkills(company.getRequiredSkills() != null ? new ArrayList<>(company.getRequiredSkills()) : new ArrayList<>());

        // Stage 1: CGPA Screening
        boolean cgpaPassed = student.getCgpa() != null && company.getEligibilityCgpa() != null
                && student.getCgpa() >= company.getEligibilityCgpa();
        builder.cgpaEligible(cgpaPassed);
        builder.cgpaStatus(cgpaPassed ? "PASSED" : "CGPA Not Eligible");

        // Department Check (Support multiple comma-separated branches)
        boolean deptPassed = false;
        if (student.getDepartment() != null && company.getEligibleDepartments() != null) {
            String studentDept = student.getDepartment().trim().toLowerCase();
            String[] depts = company.getEligibleDepartments().toLowerCase().split(",");
            for (String d : depts) {
                if (studentDept.contains(d.trim()) || d.trim().contains(studentDept)) {
                    deptPassed = true;
                    break;
                }
            }
        }
        builder.departmentEligible(deptPassed);

        // Stage 2: Skill Matching
        SkillMatchResult skillResult = calculateSkillMatch(student.getSkills(), company.getRequiredSkills());
        builder.skillMatchPercentage(skillResult.getMatchPercentage());
        builder.skillEligible(skillResult.isEligible());
        builder.skillStatus(skillResult.isEligible() ? "PASSED" : "Skill Match Ineligible (< 60%)");
        builder.matchedSkills(skillResult.getMatchedSkills());
        builder.missingSkills(skillResult.getMissingSkills());
        builder.recommendedSkills(skillResult.getMissingSkills());

        // Final Eligibility: Must satisfy CGPA Screening AND Skill Match (>= 60%) AND Department
        boolean finalEligible = cgpaPassed && skillResult.isEligible() && deptPassed;
        builder.finalEligible(finalEligible);

        if (!cgpaPassed) {
            builder.eligibilityStatus("CGPA_NOT_ELIGIBLE");
            builder.message("CGPA Not Eligible: Minimum CGPA required is " + company.getEligibilityCgpa()
                    + " (Your CGPA: " + student.getCgpa() + ")");
        } else if (!skillResult.isEligible()) {
            builder.eligibilityStatus("SKILL_NOT_ELIGIBLE");
            builder.message("Skill Match Ineligible: Required minimum score is 60%, but your skill match is "
                    + skillResult.getMatchPercentage() + "%. Missing: " + String.join(", ", skillResult.getMissingSkills()));
        } else if (!deptPassed) {
            builder.eligibilityStatus("DEPARTMENT_NOT_ELIGIBLE");
            builder.message("Department Not Eligible: Drive open only to " + company.getEligibleDepartments());
        } else {
            builder.eligibilityStatus("FINAL_ELIGIBLE");
            builder.message("Eligible: Successfully cleared CGPA Screening and Skill Matching ("
                    + skillResult.getMatchPercentage() + "% match).");
        }

        return builder.build();
    }

    public static class SkillMatchResult {
        private final double matchPercentage;
        private final boolean eligible;
        private final List<String> matchedSkills;
        private final List<String> missingSkills;
        private final List<String> recommendedSkills;

        public SkillMatchResult(double matchPercentage, boolean eligible, List<String> matchedSkills, List<String> missingSkills, List<String> recommendedSkills) {
            this.matchPercentage = matchPercentage;
            this.eligible = eligible;
            this.matchedSkills = matchedSkills;
            this.missingSkills = missingSkills;
            this.recommendedSkills = recommendedSkills;
        }

        public double getMatchPercentage() { return matchPercentage; }
        public boolean isEligible() { return eligible; }
        public List<String> getMatchedSkills() { return matchedSkills; }
        public List<String> getMissingSkills() { return missingSkills; }
        public List<String> getRecommendedSkills() { return recommendedSkills; }
    }
}
