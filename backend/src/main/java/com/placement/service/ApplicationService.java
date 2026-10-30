package com.placement.service;

import com.placement.dto.EligibilityResultDto;
import com.placement.entity.*;
import com.placement.exception.BadRequestException;
import com.placement.exception.ResourceNotFoundException;
import com.placement.repository.ApplicationRepository;
import com.placement.repository.CompanyRepository;
import com.placement.repository.StatusHistoryRepository;
import com.placement.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Service
public class ApplicationService {

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private EligibilityEngineService eligibilityEngineService;

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private StatusHistoryRepository statusHistoryRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private PlacementService placementService;

    public List<Application> getStudentApplications(Integer studentId) {
        return applicationRepository.findByStudentStudentId(studentId);
    }

    public List<Application> getAllApplications() {
        return applicationRepository.findAll();
    }

    public Application getApplicationById(Integer id) {
        return applicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found with id: " + id));
    }

    @Transactional
    public Application applyToCompany(Integer studentId, Integer companyId) {
        // 1. Verify student and company exist
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));

        // 2. Prevent duplicate application
        if (applicationRepository.existsByStudentStudentIdAndCompanyCompanyId(studentId, companyId)) {
            throw new BadRequestException("You have already applied to this company");
        }

        // 3. Two-Stage Eligibility Check (CGPA + Skill Match >= 60%)
        EligibilityResultDto eval = checkEligibility(student, company);

        // 4. Create Application with calculated skill match percentage
        Application application = new Application();
        application.setStudent(student);
        application.setCompany(company);
        application.setAppliedDate(LocalDateTime.now());
        application.setStatus(ApplicationStatus.APPLIED);
        application.setSkillMatchPercentage(eval.getSkillMatchPercentage());
        Application savedApplication = applicationRepository.save(application);

        // 5. Save initial status history
        saveStatusHistory(savedApplication, null, ApplicationStatus.APPLIED.name(), "Student", 
            "Application submitted successfully. Two-Stage Eligibility Cleared (CGPA: " + student.getCgpa() + 
            ", Skill Match: " + eval.getSkillMatchPercentage() + "%).");

        // 6. Create internal notification for student
        notificationService.createNotification(student,
                "Application Submitted (" + eval.getSkillMatchPercentage() + "% Skill Match)",
                "Your application for " + company.getCompanyName() + " has been submitted successfully with a " + 
                eval.getSkillMatchPercentage() + "% skill match score.",
                "GENERAL");

        try {
            emailService.sendEmail(student.getEmail(),
                "Application Submitted - " + company.getCompanyName(),
                "Dear " + student.getName() + ",\n\n" +
                "You have successfully applied to the recruitment drive for: " + company.getCompanyName() + ".\n" +
                "Two-Stage Eligibility Status: Cleared\n" +
                "• CGPA: " + student.getCgpa() + " (Min Required: " + company.getEligibilityCgpa() + ")\n" +
                "• Skill Match Score: " + eval.getSkillMatchPercentage() + "% (Threshold: 60%)\n" +
                "• Matched Skills: " + String.join(", ", eval.getMatchedSkills()) + "\n" +
                "Job Package: " + company.getPackageAmount() + " LPA\n" +
                "Application Date: " + LocalDateTime.now() + "\n\n" +
                "You can monitor your application status and progress timeline in your dashboard.\n\n" +
                "Best regards,\nPlacement Cell");
        } catch (Exception e) {
            // Ignore email fail
        }

        return savedApplication;
    }

    @Transactional
    public Application updateApplicationStatus(Integer applicationId, String statusStr, String updatedBy, String remarks) {
        Application application = getApplicationById(applicationId);
        ApplicationStatus previousStatus = application.getStatus();
        
        ApplicationStatus newStatus;
        try {
            newStatus = ApplicationStatus.valueOf(statusStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid application status: " + statusStr);
        }

        // Selected and Rejected are terminal application outcomes unless explicitly reopened
        if ((previousStatus == ApplicationStatus.SELECTED || previousStatus == ApplicationStatus.REJECTED) 
                && (newStatus != ApplicationStatus.SELECTED && newStatus != ApplicationStatus.REJECTED)) {
            // Admin can reopen if explicitly passed via remarks, let's allow updating but record it
        }

        application.setStatus(newStatus);
        Application saved = applicationRepository.save(application);

        // Record history
        saveStatusHistory(saved, previousStatus.name(), newStatus.name(), updatedBy, remarks);

        // Notification and placement synchronization triggered for student
        if (newStatus == ApplicationStatus.SELECTED) {
            placementService.syncFromApplication(saved);
            notificationService.createNotification(application.getStudent(),
                    "🎉 Congratulations! Selected at " + application.getCompany().getCompanyName(),
                    "We are thrilled to inform you that you have been SELECTED for the placement drive of " + 
                    application.getCompany().getCompanyName() + "! Check your email for more details.",
                    "SELECTION_UPDATE");

            try {
                emailService.sendEmail(saved.getStudent().getEmail(),
                    "🎉 Congratulations on your Selection - " + saved.getCompany().getCompanyName(),
                    "Dear " + saved.getStudent().getName() + ",\n\n" +
                    "Congratulations! We are absolutely delighted to inform you that you have cleared all rounds and have been SELECTED for placement at " + 
                    saved.getCompany().getCompanyName() + ".\n\n" +
                    "Details:\n" +
                    "Company: " + saved.getCompany().getCompanyName() + "\n" +
                    "Package (CTC): " + saved.getCompany().getPackageAmount() + " LPA\n" +
                    "Remarks/Feedback: " + (remarks != null && !remarks.isEmpty() ? remarks : "N/A") + "\n\n" +
                    "Further instructions regarding onboarding and documentation will be shared shortly.\n\n" +
                    "We wish you a stellar career ahead!\n\n" +
                    "Warm regards,\nPlacement Cell & Coordinator");
            } catch (Exception e) {
                // Ignore email fail
            }
        } else {
            if (previousStatus == ApplicationStatus.SELECTED) {
                placementService.removePlacementForApplication(saved.getStudent().getStudentId(), saved.getCompany().getCompanyId());
            }

            notificationService.createNotification(application.getStudent(),
                    "Application Status Update - " + application.getCompany().getCompanyName(),
                    "Your application status has changed from " + previousStatus + " to " + newStatus + ".",
                    "RESULT_UPDATE");

            try {
                emailService.sendEmail(saved.getStudent().getEmail(),
                    "Application Status Update - " + saved.getCompany().getCompanyName(),
                    "Dear " + saved.getStudent().getName() + ",\n\n" +
                    "Your application status for " + saved.getCompany().getCompanyName() + " has been updated.\n\n" +
                    "Previous Status: " + previousStatus + "\n" +
                    "New Status: " + newStatus + "\n" +
                    "Remarks/Feedback: " + (remarks != null && !remarks.isEmpty() ? remarks : "None") + "\n\n" +
                    "Please check the portal for more details.\n\n" +
                    "Best regards,\nPlacement Cell");
            } catch (Exception e) {
                // Ignore email fail
            }
        }

        return saved;
    }

    public List<StatusHistory> getStatusHistory(Integer applicationId) {
        return statusHistoryRepository.findByApplicationApplicationIdOrderByUpdatedAtDesc(applicationId);
    }

    public EligibilityResultDto checkEligibility(Student student, Company company) {
        // Rule A: Company is active
        if (!company.getActive()) {
            throw new BadRequestException("This recruitment drive is currently inactive.");
        }

        // Rule B: Application deadline has not passed
        if (LocalDate.now().isAfter(company.getApplicationDeadline())) {
            throw new BadRequestException("The application deadline has passed.");
        }

        // Two-Stage Eligibility Verification:
        // Stage 1: CGPA Screening
        // Stage 2: Skill Matching (>= 60%)
        EligibilityResultDto eval = eligibilityEngineService.evaluateEligibility(student, company);
        if (!Boolean.TRUE.equals(eval.getFinalEligible())) {
            throw new BadRequestException(eval.getMessage());
        }

        return eval;
    }

    private void saveStatusHistory(Application application, String prevStatus, String currStatus, String updatedBy, String remarks) {
        StatusHistory history = new StatusHistory();
        history.setApplication(application);
        history.setPreviousStatus(prevStatus);
        history.setCurrentStatus(currStatus);
        history.setUpdatedBy(updatedBy);
        history.setRemarks(remarks);
        history.setUpdatedAt(LocalDateTime.now());
        statusHistoryRepository.save(history);
    }
}
