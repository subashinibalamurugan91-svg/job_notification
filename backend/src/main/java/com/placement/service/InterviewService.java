package com.placement.service;

import com.placement.dto.InterviewDto;
import com.placement.entity.Company;
import com.placement.entity.Interview;
import com.placement.entity.Student;
import com.placement.exception.BadRequestException;
import com.placement.exception.ResourceNotFoundException;
import com.placement.repository.CompanyRepository;
import com.placement.repository.InterviewRepository;
import com.placement.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class InterviewService {

    @Autowired
    private InterviewRepository interviewRepository;

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private NotificationService notificationService;

    public List<Interview> getInterviewsForStudent(Integer studentId) {
        return interviewRepository.findInterviewsForStudent(studentId);
    }

    public List<Interview> getAllInterviews() {
        return interviewRepository.findAll();
    }

    public List<Interview> getUpcomingInterviews() {
        return interviewRepository.findAll().stream()
                .filter(i -> i.getInterviewDate().isAfter(LocalDateTime.now()))
                .collect(Collectors.toList());
    }

    public Interview getInterviewById(Integer id) {
        return interviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Interview not found with id: " + id));
    }

    @Transactional
    public Interview createInterview(InterviewDto dto) {
        Company company = companyRepository.findById(dto.getCompanyId())
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + dto.getCompanyId()));

        // 1. Validation: No past dates
        if (dto.getInterviewDate().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Interview date cannot be in the past");
        }

        // 2. Validation: No duplicate schedules (same company, same round, same date/time)
        validateDuplicateSchedule(dto, null);

        // 3. Validation: Student eligibility
        java.util.Set<Student> assignedStudents = validateAndGetEligibleStudents(dto, company);

        Interview interview = new Interview();
        interview.setCompany(company);
        interview.setStudents(assignedStudents);
        copyDtoToEntity(dto, interview);
        
        Interview saved = interviewRepository.save(interview);

        // 4. Send Notifications & Emails
        for (Student student : assignedStudents) {
            notificationService.createNotification(student,
                "New Interview Scheduled - " + company.getCompanyName(),
                "A new interview round '" + saved.getRoundName() + "' has been scheduled for you. Venue: " + saved.getVenue() + " at " + saved.getInterviewDate(),
                "INTERVIEW_REMINDER");

            try {
                emailService.sendEmail(student.getEmail(),
                    "Interview Scheduled - " + company.getCompanyName(),
                    "Dear " + student.getName() + ",\n\n" +
                    "A new interview round has been scheduled for you.\n\n" +
                    "Company: " + company.getCompanyName() + "\n" +
                    "Round: " + saved.getRoundName() + "\n" +
                    "Date & Time: " + saved.getInterviewDate() + "\n" +
                    "Venue/Location: " + saved.getVenue() + "\n" +
                    "Remarks: " + (saved.getRemarks() != null ? saved.getRemarks() : "N/A") + "\n" +
                    "Meeting Link: " + (saved.getMeetingLink() != null ? saved.getMeetingLink() : "N/A") + "\n\n" +
                    "Instructions: " + (saved.getInstructions() != null ? saved.getInstructions() : "None") + "\n\n" +
                    "Best regards,\nPlacement Cell");
            } catch (Exception e) {
                // Ignore email failure
            }
        }

        return saved;
    }

    @Transactional
    public Interview updateInterview(Integer id, InterviewDto dto) {
        Interview interview = getInterviewById(id);
        Company company = interview.getCompany();
        
        if (!company.getCompanyId().equals(dto.getCompanyId())) {
            company = companyRepository.findById(dto.getCompanyId())
                    .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + dto.getCompanyId()));
            interview.setCompany(company);
        }

        // 1. Validation: No past dates (if date changed)
        if (!interview.getInterviewDate().equals(dto.getInterviewDate()) && dto.getInterviewDate().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Rescheduled interview date cannot be in the past");
        }

        // 2. Validation: No duplicate schedules
        validateDuplicateSchedule(dto, id);

        // 3. Validation: Student eligibility
        java.util.Set<Student> assignedStudents = validateAndGetEligibleStudents(dto, company);
        interview.setStudents(assignedStudents);

        boolean isRescheduled = !interview.getInterviewDate().equals(dto.getInterviewDate()) || !interview.getVenue().equals(dto.getVenue());
        
        copyDtoToEntity(dto, interview);
        Interview saved = interviewRepository.save(interview);

        // 4. Send rescheduling notifications if applicable
        if (isRescheduled) {
            for (Student student : assignedStudents) {
                notificationService.createNotification(student,
                    "Interview Rescheduled - " + company.getCompanyName(),
                    "Your interview round '" + saved.getRoundName() + "' for " + company.getCompanyName() + " has been rescheduled to " + saved.getInterviewDate() + " at " + saved.getVenue(),
                    "INTERVIEW_REMINDER");

                try {
                    emailService.sendEmail(student.getEmail(),
                        "Interview Rescheduled - " + company.getCompanyName(),
                        "Dear " + student.getName() + ",\n\n" +
                        "Your scheduled interview has been rescheduled.\n\n" +
                        "Company: " + company.getCompanyName() + "\n" +
                        "Round: " + saved.getRoundName() + "\n" +
                        "New Date & Time: " + saved.getInterviewDate() + "\n" +
                        "New Venue/Location: " + saved.getVenue() + "\n" +
                        "Remarks: " + (saved.getRemarks() != null ? saved.getRemarks() : "N/A") + "\n" +
                        "Meeting Link: " + (saved.getMeetingLink() != null ? saved.getMeetingLink() : "N/A") + "\n\n" +
                        "Please update your calendar.\n\n" +
                        "Best regards,\nPlacement Cell");
                } catch (Exception e) {
                    // Ignore email failure
                }
            }
        }

        return saved;
    }

    @Transactional
    public void deleteInterview(Integer id) {
        Interview interview = getInterviewById(id);
        
        // Notify of cancellation
        for (Student student : interview.getStudents()) {
            notificationService.createNotification(student,
                "Interview Cancelled - " + interview.getCompany().getCompanyName(),
                "Your interview round '" + interview.getRoundName() + "' for " + interview.getCompany().getCompanyName() + " has been cancelled.",
                "INTERVIEW_REMINDER");

            try {
                emailService.sendEmail(student.getEmail(),
                    "Interview Cancelled - " + interview.getCompany().getCompanyName(),
                    "Dear " + student.getName() + ",\n\n" +
                    "Please note that the interview round '" + interview.getRoundName() + "' scheduled on " + interview.getInterviewDate() + " for " + interview.getCompany().getCompanyName() + " has been cancelled.\n\n" +
                    "Best regards,\nPlacement Cell");
            } catch (Exception e) {
                // Ignore email failure
            }
        }

        interviewRepository.delete(interview);
    }

    private void validateDuplicateSchedule(InterviewDto dto, Integer currentId) {
        List<Interview> existing = interviewRepository.findByCompanyCompanyId(dto.getCompanyId());
        for (Interview ext : existing) {
            if (ext.getRoundName().equalsIgnoreCase(dto.getRoundName()) && 
                ext.getInterviewDate().isEqual(dto.getInterviewDate())) {
                if (currentId == null || !ext.getInterviewId().equals(currentId)) {
                    throw new BadRequestException("Duplicate interview schedule detected for same company, round, and date/time");
                }
            }
        }
    }

    private java.util.Set<Student> validateAndGetEligibleStudents(InterviewDto dto, Company company) {
        java.util.Set<Student> assignedStudents = new java.util.HashSet<>();
        if (dto.getStudentIds() != null && !dto.getStudentIds().isEmpty()) {
            for (Integer studentId : dto.getStudentIds()) {
                Student student = studentRepository.findById(studentId)
                        .orElseThrow(() -> new ResourceNotFoundException("Student not found with ID: " + studentId));
                
                // Eligibility validation: CGPA Cutoff
                if (student.getCgpa().compareTo(company.getEligibilityCgpa()) < 0) {
                    throw new BadRequestException("Student " + student.getName() + " does not meet minimum CGPA cutoff of " + company.getEligibilityCgpa());
                }
                // Eligibility validation: Branch/Department Check
                String studentDept = student.getDepartment().trim().toLowerCase();
                List<String> eligibleBranches = java.util.Arrays.stream(company.getEligibleDepartments().split(","))
                        .map(d -> d.trim().toLowerCase())
                        .collect(Collectors.toList());
                if (!eligibleBranches.contains(studentDept)) {
                    throw new BadRequestException("Student " + student.getName() + "'s department (" + student.getDepartment() + ") is not eligible for this placement drive.");
                }
                
                assignedStudents.add(student);
            }
        }
        return assignedStudents;
    }

    private void copyDtoToEntity(InterviewDto dto, Interview interview) {
        interview.setRoundName(dto.getRoundName());
        interview.setInterviewDate(dto.getInterviewDate());
        interview.setVenue(dto.getVenue());
        interview.setMeetingLink(dto.getMeetingLink());
        interview.setInstructions(dto.getInstructions());
        interview.setRemarks(dto.getRemarks());
    }

    @Scheduled(cron = "0 0 * * * *") // Runs every hour
    public void send24HourReminders() {
        LocalDateTime targetTimeStart = LocalDateTime.now().plusHours(23).plusMinutes(30);
        LocalDateTime targetTimeEnd = LocalDateTime.now().plusHours(24).plusMinutes(30);
        List<Interview> upcomingInterviews = interviewRepository.findAllByInterviewDateBetween(targetTimeStart, targetTimeEnd);
        for (Interview interview : upcomingInterviews) {
            for (Student student : interview.getStudents()) {
                try {
                    notificationService.createNotification(student,
                        "24-Hour Interview Reminder - " + interview.getCompany().getCompanyName(),
                        "Reminder: Your interview round '" + interview.getRoundName() + "' starts in 24 hours at " + interview.getInterviewDate(),
                        "INTERVIEW_REMINDER");
                    emailService.sendEmail(student.getEmail(),
                        "24-Hour Interview Reminder - " + interview.getCompany().getCompanyName(),
                        "Dear " + student.getName() + ",\n\n" +
                        "This is a reminder that your interview round '" + interview.getRoundName() + "' for " + interview.getCompany().getCompanyName() + " starts in 24 hours.\n\n" +
                        "Date & Time: " + interview.getInterviewDate() + "\n" +
                        "Venue: " + interview.getVenue() + "\n\n" +
                        "Best regards,\nPlacement Cell");
                } catch (Exception e) {
                    // ignore
                }
            }
        }
    }
}
