package com.placement.service;

import com.placement.dto.CompanyDto;
import com.placement.entity.Company;
import com.placement.entity.Student;
import com.placement.exception.ResourceNotFoundException;
import com.placement.repository.CompanyRepository;
import com.placement.repository.StudentRepository;
import com.placement.repository.ApplicationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CompanyService {

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private EligibilityEngineService eligibilityEngineService;

    public List<Company> getAllCompanies() {
        return companyRepository.findAll();
    }

    public List<Company> getActiveCompanies() {
        return companyRepository.findByActiveTrue();
    }

    public Company getCompanyById(Integer id) {
        return companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + id));
    }

    public Company createCompany(CompanyDto dto) {
        Company company = new Company();
        copyDtoToEntity(dto, company);
        Company saved = companyRepository.save(company);

        // Run automated eligibility engine and send notifications/emails
        List<Student> eligibleStudents = getEligibleStudentsForCompany(saved);
        for (Student student : eligibleStudents) {
            com.placement.dto.EligibilityResultDto eval = eligibilityEngineService.evaluateEligibility(student, saved);
            try {
                notificationService.createNotification(student,
                    "🎯 Eligible Recruitment Drive - " + saved.getCompanyName(),
                    "You are ELIGIBLE for " + saved.getCompanyName() + "! Cleared CGPA Screening (Req: " + saved.getEligibilityCgpa() + 
                    ") and Skill Matching (" + eval.getSkillMatchPercentage() + "% match). CTC: " + saved.getPackageAmount() + " LPA. Apply before " + saved.getApplicationDeadline() + ".",
                    "ELIGIBLE_COMPANY");

                emailService.sendEmail(student.getEmail(),
                    "Campus Drive Opportunity (Eligible) - " + saved.getCompanyName(),
                    "Dear " + student.getName() + ",\n\n" +
                    "Congratulations! You satisfy the two-stage campus recruitment eligibility criteria for " + saved.getCompanyName() + ".\n\n" +
                    "Eligibility Verification Breakdown:\n" +
                    "• Stage 1 (CGPA Screening): Passed (Your CGPA: " + student.getCgpa() + " >= Minimum: " + saved.getEligibilityCgpa() + ")\n" +
                    "• Stage 2 (Skill Matching): Passed with " + eval.getSkillMatchPercentage() + "% match (Threshold: 60%)\n" +
                    "• Matched Skills: " + String.join(", ", eval.getMatchedSkills()) + "\n\n" +
                    "Drive Details:\n" +
                    "Company Name: " + saved.getCompanyName() + "\n" +
                    "Package (CTC): " + saved.getPackageAmount() + " LPA\n" +
                    "Application Deadline: " + saved.getApplicationDeadline() + "\n" +
                    "Drive Date: " + saved.getDriveDate() + "\n\n" +
                    "Please apply via your portal before the deadline.\n\n" +
                    "Best regards,\nPlacement Cell");
            } catch (Exception e) {
                // Keep execution going if email logs fail
            }
        }

        return saved;
    }

    public Company updateCompany(Integer id, CompanyDto dto) {
        Company company = getCompanyById(id);
        copyDtoToEntity(dto, company);
        return companyRepository.save(company);
    }

    public void deleteCompany(Integer id) {
        Company company = getCompanyById(id);
        companyRepository.delete(company);
    }

    // Dynamic Two-Stage Eligibility Engine
    public List<Student> getEligibleStudentsForCompany(Company company) {
        List<Student> allStudents = studentRepository.findAll();
        return allStudents.stream().filter(s -> {
            com.placement.dto.EligibilityResultDto eval = eligibilityEngineService.evaluateEligibility(s, company);
            return Boolean.TRUE.equals(eval.getFinalEligible());
        }).collect(Collectors.toList());
    }

    // Two-Stage Eligibility Pipeline Diagnostics per Company
    public java.util.Map<String, Object> getCompanyEligibilityPipeline(Integer companyId) {
        Company company = getCompanyById(companyId);
        List<Student> allStudents = studentRepository.findAll();
        int totalStudents = allStudents.size();

        long cgpaEligibleCount = 0;
        long skillEligibleCount = 0;
        long finalEligibleCount = 0;
        java.util.List<com.placement.dto.EligibilityResultDto> candidateResults = new java.util.ArrayList<>();

        for (Student student : allStudents) {
            com.placement.dto.EligibilityResultDto eval = eligibilityEngineService.evaluateEligibility(student, company);
            if (Boolean.TRUE.equals(eval.getCgpaEligible())) cgpaEligibleCount++;
            if (Boolean.TRUE.equals(eval.getSkillEligible())) skillEligibleCount++;
            if (Boolean.TRUE.equals(eval.getFinalEligible())) finalEligibleCount++;
            candidateResults.add(eval);
        }

        java.util.Map<String, Object> pipeline = new java.util.HashMap<>();
        pipeline.put("companyId", company.getCompanyId());
        pipeline.put("companyName", company.getCompanyName());
        pipeline.put("requiredCgpa", company.getEligibilityCgpa());
        pipeline.put("requiredSkills", company.getRequiredSkills() != null ? company.getRequiredSkills() : java.util.Collections.emptyList());
        pipeline.put("totalStudents", totalStudents);
        pipeline.put("cgpaEligibleStudents", cgpaEligibleCount);
        pipeline.put("skillEligibleStudents", skillEligibleCount);
        pipeline.put("finalEligibleStudents", finalEligibleCount);
        pipeline.put("cgpaPassRate", totalStudents > 0 ? Math.round(((double) cgpaEligibleCount / totalStudents) * 100.0 * 10.0) / 10.0 : 0.0);
        pipeline.put("skillPassRate", totalStudents > 0 ? Math.round(((double) skillEligibleCount / totalStudents) * 100.0 * 10.0) / 10.0 : 0.0);
        pipeline.put("finalEligibilityRate", totalStudents > 0 ? Math.round(((double) finalEligibleCount / totalStudents) * 100.0 * 10.0) / 10.0 : 0.0);
        pipeline.put("notificationsSent", finalEligibleCount);
        pipeline.put("candidates", candidateResults);
        return pipeline;
    }

    public int notifyEligibleStudentsForCompany(Integer companyId) {
        Company company = getCompanyById(companyId);
        List<Student> eligibleStudents = getEligibleStudentsForCompany(company);
        int notifiedCount = 0;

        for (Student student : eligibleStudents) {
            com.placement.dto.EligibilityResultDto eval = eligibilityEngineService.evaluateEligibility(student, company);
            try {
                notificationService.createNotification(student,
                    "🎯 Eligible Recruitment Drive - " + company.getCompanyName(),
                    "You are ELIGIBLE for " + company.getCompanyName() + "! Cleared CGPA Screening (Req: " + company.getEligibilityCgpa() + 
                    ") and Skill Matching (" + eval.getSkillMatchPercentage() + "% match). CTC: " + company.getPackageAmount() + " LPA. Apply before " + company.getApplicationDeadline() + ".",
                    "ELIGIBLE_COMPANY");

                emailService.sendEmail(student.getEmail(),
                    "Campus Drive Opportunity (Eligible) - " + company.getCompanyName(),
                    "Dear " + student.getName() + ",\n\n" +
                    "Congratulations! You satisfy the two-stage campus recruitment eligibility criteria for " + company.getCompanyName() + ".\n\n" +
                    "Eligibility Verification Breakdown:\n" +
                    "• Stage 1 (CGPA Screening): Passed (Your CGPA: " + student.getCgpa() + " >= Minimum: " + company.getEligibilityCgpa() + ")\n" +
                    "• Stage 2 (Skill Matching): Passed with " + eval.getSkillMatchPercentage() + "% match (Threshold: 60%)\n" +
                    "• Matched Skills: " + String.join(", ", eval.getMatchedSkills()) + "\n\n" +
                    "Drive Details:\n" +
                    "Company Name: " + company.getCompanyName() + "\n" +
                    "Package (CTC): " + company.getPackageAmount() + " LPA\n" +
                    "Application Deadline: " + company.getApplicationDeadline() + "\n" +
                    "Drive Date: " + company.getDriveDate() + "\n\n" +
                    "Please apply via your portal before the deadline.\n\n" +
                    "Best regards,\nPlacement Cell");
                notifiedCount++;
            } catch (Exception e) {
                // ignore
            }
        }
        return notifiedCount;
    }

    // Cron job: Runs daily at 9:00 AM to send deadline alerts
    @Scheduled(cron = "0 0 9 * * *")
    public void sendApplicationDeadlineReminders() {
        List<Company> activeCompanies = companyRepository.findByActiveTrue();
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        
        for (Company company : activeCompanies) {
            if (company.getApplicationDeadline() != null && company.getApplicationDeadline().equals(tomorrow)) {
                List<Student> eligibleStudents = getEligibleStudentsForCompany(company);
                for (Student student : eligibleStudents) {
                    boolean alreadyApplied = applicationRepository.existsByStudentStudentIdAndCompanyCompanyId(student.getStudentId(), company.getCompanyId());
                    if (!alreadyApplied) {
                        try {
                            notificationService.createNotification(student,
                                "⏰ Application Deadline Reminder - " + company.getCompanyName(),
                                "Reminder: The application deadline for " + company.getCompanyName() + " is tomorrow (" + company.getApplicationDeadline() + "). Apply immediately!",
                                "DEADLINE_REMINDER");
                            
                            emailService.sendEmail(student.getEmail(),
                                "URGENT: Application Deadline Closing - " + company.getCompanyName(),
                                "Dear " + student.getName() + ",\n\n" +
                                "The application deadline for the placement drive of " + company.getCompanyName() + " is tomorrow on " + company.getApplicationDeadline() + ".\n" +
                                "As you are eligible and haven't applied yet, please submit your application on the portal as soon as possible.\n\n" +
                                "Best regards,\nPlacement Cell");
                        } catch (Exception e) {
                            // ignore alert issues
                        }
                    }
                }
            }
        }
    }

    private void copyDtoToEntity(CompanyDto dto, Company company) {
        company.setCompanyName(dto.getCompanyName());
        company.setDescription(dto.getDescription());
        company.setEligibilityCgpa(dto.getEligibilityCgpa());
        company.setEligibleDepartments(dto.getEligibleDepartments());
        company.setPackageAmount(dto.getPackageAmount());
        company.setApplicationDeadline(dto.getApplicationDeadline());
        company.setDriveDate(dto.getDriveDate());
        if (dto.getActive() != null) {
            company.setActive(dto.getActive());
        }
        if (dto.getRequiredSkills() != null) {
            company.setRequiredSkills(new java.util.ArrayList<>(dto.getRequiredSkills()));
        }
    }
}
