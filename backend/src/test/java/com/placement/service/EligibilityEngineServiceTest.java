package com.placement.service;

import com.placement.dto.EligibilityResultDto;
import com.placement.entity.Company;
import com.placement.entity.Student;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;

class EligibilityEngineServiceTest {

    private EligibilityEngineService engineService;
    private Company infosys;

    @BeforeEach
    void setUp() {
        engineService = new EligibilityEngineService();

        infosys = new Company();
        infosys.setCompanyId(1);
        infosys.setCompanyName("Infosys");
        infosys.setEligibilityCgpa(7.0);
        infosys.setEligibleDepartments("CSE, IT, ECE");
        infosys.setPackageAmount(9.5);
        infosys.setApplicationDeadline(LocalDate.now().plusDays(10));
        infosys.setDriveDate(LocalDate.now().plusDays(20));
        infosys.setActive(true);
        // Required skills: Java, Spring Boot, MySQL, React
        infosys.setRequiredSkills(Arrays.asList("Java", "Spring Boot", "MySQL", "React"));
    }

    @Test
    @DisplayName("Prompt Example - Student A: 100% Match and CGPA >= 7.0 -> Final Eligible")
    void testStudentA_FullMatch() {
        Student studentA = new Student();
        studentA.setStudentId(202);
        studentA.setName("Amit Sharma");
        studentA.setCgpa(8.45);
        studentA.setDepartment("CSE");
        studentA.setSkills(Arrays.asList("Java", "Spring Boot", "MySQL", "React"));

        EligibilityResultDto result = engineService.evaluateEligibility(studentA, infosys);

        // Stage 1: CGPA Screening
        assertTrue(result.getCgpaEligible(), "Stage 1 CGPA screening should pass");
        assertEquals("PASSED", result.getCgpaStatus());

        // Stage 2: Skill Matching
        assertEquals(100.0, result.getSkillMatchPercentage(), 0.01, "Skill match score must be 100%");
        assertTrue(result.getSkillEligible(), "Stage 2 Skill match must be eligible (>= 60%)");
        assertEquals(4, result.getMatchedSkills().size());
        assertTrue(result.getMissingSkills().isEmpty());

        // Final Decision
        assertTrue(result.getFinalEligible(), "Student A must be marked as FINAL_ELIGIBLE");
        assertEquals("FINAL_ELIGIBLE", result.getEligibilityStatus());
    }

    @Test
    @DisplayName("Prompt Example - Student B: 50% Match (<60%) and CGPA >= 7.0 -> Skill Not Eligible")
    void testStudentB_PartialMatchBelowCutoff() {
        Student studentB = new Student();
        studentB.setStudentId(203);
        studentB.setName("Priya Patel");
        studentB.setCgpa(7.85);
        studentB.setDepartment("IT");
        studentB.setSkills(Arrays.asList("Java", "MySQL"));

        EligibilityResultDto result = engineService.evaluateEligibility(studentB, infosys);

        // Stage 1: CGPA Screening
        assertTrue(result.getCgpaEligible(), "Stage 1 CGPA screening should pass");

        // Stage 2: Skill Matching
        assertEquals(50.0, result.getSkillMatchPercentage(), 0.01, "Skill match score must be 50%");
        assertFalse(result.getSkillEligible(), "Stage 2 Skill match must fail because 50% < 60% threshold");
        assertEquals(2, result.getMatchedSkills().size());
        assertEquals(2, result.getMissingSkills().size());
        assertTrue(result.getMissingSkills().contains("Spring Boot"));
        assertTrue(result.getMissingSkills().contains("React"));

        // Final Decision
        assertFalse(result.getFinalEligible(), "Student B must NOT be final eligible");
        assertEquals("SKILL_NOT_ELIGIBLE", result.getEligibilityStatus());
    }

    @Test
    @DisplayName("Stage 1 Failure - CGPA below cutoff -> marked as 'CGPA Not Eligible'")
    void testStage1Failure_LowCgpa() {
        Student studentC = new Student();
        studentC.setStudentId(204);
        studentC.setName("Rahul Verma");
        studentC.setCgpa(6.50); // Below 7.0 required
        studentC.setDepartment("CSE");
        // Has all required skills
        studentC.setSkills(Arrays.asList("Java", "Spring Boot", "MySQL", "React"));

        EligibilityResultDto result = engineService.evaluateEligibility(studentC, infosys);

        // Stage 1: CGPA Screening
        assertFalse(result.getCgpaEligible(), "Stage 1 CGPA screening should fail");
        assertEquals("CGPA Not Eligible", result.getCgpaStatus());

        // Final Decision
        assertFalse(result.getFinalEligible(), "Must not be final eligible due to Stage 1 failure");
        assertEquals("CGPA_NOT_ELIGIBLE", result.getEligibilityStatus());
    }

    @Test
    @DisplayName("Stage 2 Qualifying threshold - Exactly 3 out of 4 skills = 75% -> Eligible")
    void testStage2_ThreeOutOfFourSkills() {
        Student studentD = new Student();
        studentD.setStudentId(205);
        studentD.setName("Deepa Nair");
        studentD.setCgpa(8.0);
        studentD.setDepartment("CSE");
        studentD.setSkills(Arrays.asList("Java", "Spring Boot", "React")); // 3 out of 4 = 75%

        EligibilityResultDto result = engineService.evaluateEligibility(studentD, infosys);

        assertTrue(result.getCgpaEligible());
        assertEquals(75.0, result.getSkillMatchPercentage(), 0.01);
        assertTrue(result.getSkillEligible());
        assertTrue(result.getFinalEligible());
        assertEquals("FINAL_ELIGIBLE", result.getEligibilityStatus());
        assertEquals(Collections.singletonList("MySQL"), result.getMissingSkills());
    }
}
