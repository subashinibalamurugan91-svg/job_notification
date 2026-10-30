package com.placement.service;

import com.placement.entity.*;
import com.placement.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReadinessEngineService {

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private InterviewRepository interviewRepository;

    // Calculate student readiness score and recommendations
    public Map<String, Object> calculateStudentReadiness(Integer studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        List<Application> apps = applicationRepository.findByStudentStudentId(studentId);
        List<Interview> interviews = interviewRepository.findInterviewsForStudent(studentId) // Wait, let's search interviews for student
                .stream()
                .filter(i -> i.getStudents().contains(student))
                .collect(Collectors.toList());

        long appsCount = apps.size();
        long interviewsCount = interviews.size();

        // 1. Calculate Score (Max 100)
        double cgpaPoints = (student.getCgpa() / 10.0) * 30; // Max 30
        double resumePoints = student.getResumeUrl() != null ? 20.0 : 0.0; // Max 20
        double appPoints = Math.min(20.0, appsCount * 5.0); // Max 20 (4 apps = 20 pts)
        double interviewPoints = Math.min(15.0, interviewsCount * 5.0); // Max 15 (3 interviews = 15 pts)

        // Progress status weight (Max 15)
        double progressPoints = 0.0;
        for (Application app : apps) {
            double currentAppProgress = 0.0;
            switch (app.getStatus()) {
                case SELECTED: currentAppProgress = 15.0; break;
                case HR_CLEARED: currentAppProgress = 12.0; break;
                case TECHNICAL_CLEARED: currentAppProgress = 10.0; break;
                case APTITUDE_CLEARED: currentAppProgress = 8.0; break;
                case SHORTLISTED: currentAppProgress = 5.0; break;
                case APPLIED: currentAppProgress = 3.0; break;
                default: currentAppProgress = 0.0;
            }
            if (currentAppProgress > progressPoints) {
                progressPoints = currentAppProgress;
            }
        }

        int score = (int) Math.round(cgpaPoints + resumePoints + appPoints + interviewPoints + progressPoints);
        score = Math.min(100, Math.max(0, score));

        // Category Classification
        String category = "Needs Improvement";
        if (score >= 90) category = "Excellent";
        else if (score >= 75) category = "Good";
        else if (score >= 60) category = "Average";

        // Profile Completion %
        int profileCompleteness = 40; // Base: name, email, regNo
        if (student.getPhone() != null && !student.getPhone().isEmpty()) profileCompleteness += 20;
        if (student.getResumeUrl() != null) profileCompleteness += 20;
        if (appsCount > 0) profileCompleteness += 20;

        // Insights — Strengths & Improvement Areas
        List<String> strengths = new ArrayList<>();
        List<String> improvements = new ArrayList<>();

        if (student.getCgpa() >= 8.5) strengths.add("High Academic Score (CGPA: " + student.getCgpa() + ")");
        if (student.getResumeUrl() != null) strengths.add("Resume PDF uploaded and verified");
        if (appsCount >= 2) strengths.add("Active drive applications (" + appsCount + " submitted)");
        
        boolean hasSelected = apps.stream().anyMatch(a -> a.getStatus() == ApplicationStatus.SELECTED);
        if (hasSelected) strengths.add("Recruitment Offer Secured");

        if (student.getCgpa() < 7.5) improvements.add("Enhance Academic CGPA above 8.0");
        if (student.getResumeUrl() == null) improvements.add("Upload structured resume PDF");
        if (appsCount == 0) improvements.add("Apply to active eligible recruitment drives");
        if (interviewsCount == 0 && appsCount > 0) improvements.add("Boost mock screenings rounds success rate");

        // 3. Recommended Companies
        List<Company> activeCompanies = companyRepository.findByActiveTrue();
        String studentDept = student.getDepartment().trim().toLowerCase();

        List<Map<String, Object>> recommendations = activeCompanies.stream()
                .filter(c -> {
                    // Check if CGPA satisfies
                    if (student.getCgpa() < c.getEligibilityCgpa()) return false;
                    // Check if department satisfies
                    boolean deptMatch = false;
                    String[] depts = c.getEligibleDepartments().toLowerCase().split(",");
                    for (String dept : depts) {
                        if (studentDept.contains(dept.trim())) {
                            deptMatch = true;
                            break;
                        }
                    }
                    if (!deptMatch) return false;
                    // Check if already applied
                    return apps.stream().noneMatch(a -> a.getCompany().getCompanyId().equals(c.getCompanyId()));
                })
                .sorted((c1, c2) -> Double.compare(c2.getPackageAmount(), c1.getPackageAmount())) // Descending packages
                .map(c -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("companyId", c.getCompanyId());
                    map.put("companyName", c.getCompanyName());
                    map.put("packageAmount", c.getPackageAmount());
                    map.put("eligibilityCgpa", c.getEligibilityCgpa());
                    map.put("applicationDeadline", c.getApplicationDeadline());
                    return map;
                })
                .collect(Collectors.toList());

        Map<String, Object> result = new HashMap<>();
        result.put("readinessScore", score);
        result.put("category", category);
        result.put("profileCompleteness", profileCompleteness);
        result.put("strengths", strengths);
        result.put("improvements", improvements);
        result.put("recommendations", recommendations);
        result.put("applicationsCount", appsCount);
        result.put("interviewsCount", interviewsCount);
        result.put("resumeStatus", student.getResumeUrl() != null ? "Uploaded" : "Missing");

        return result;
    }

    // Admin readiness diagnostics and at-risk listings
    public Map<String, Object> calculateAdminReadinessSummary() {
        List<Student> students = studentRepository.findAll();
        double totalScoreSum = 0;
        int totalStudentsCount = students.size();

        Map<String, Double> deptScoreSum = new HashMap<>();
        Map<String, Integer> deptStudentCount = new HashMap<>();
        List<Map<String, Object>> atRiskStudentsList = new ArrayList<>();

        for (Student student : students) {
            Map<String, Object> readiness = calculateStudentReadiness(student.getStudentId());
            int score = (int) readiness.get("readinessScore");
            totalScoreSum += score;

            // Department aggregations
            String dept = student.getDepartment();
            deptScoreSum.put(dept, deptScoreSum.getOrDefault(dept, 0.0) + score);
            deptStudentCount.put(dept, deptStudentCount.getOrDefault(dept, 0) + 1);

            // Risk Detection: 0 applications AND no resume AND 0 interviews
            long appsCount = (long) readiness.get("applicationsCount");
            long interviewsCount = (long) readiness.get("interviewsCount");
            String resumeStatus = (String) readiness.get("resumeStatus");

            if (appsCount == 0 && "Missing".equals(resumeStatus) && interviewsCount == 0) {
                Map<String, Object> riskMap = new HashMap<>();
                riskMap.put("studentId", student.getStudentId());
                riskMap.put("regNo", student.getRegNo());
                riskMap.put("name", student.getName());
                riskMap.put("department", student.getDepartment());
                riskMap.put("cgpa", student.getCgpa());
                riskMap.put("readinessScore", score);
                riskMap.put("phone", student.getPhone());
                atRiskStudentsList.add(riskMap);
            }
        }

        double averageReadiness = totalStudentsCount > 0 ? (totalScoreSum / totalStudentsCount) : 0;
        
        List<Map<String, Object>> deptAverages = new ArrayList<>();
        for (String dept : deptScoreSum.keySet()) {
            Map<String, Object> map = new HashMap<>();
            double avg = deptScoreSum.get(dept) / deptStudentCount.get(dept);
            map.put("departmentName", dept);
            map.put("averageScore", Math.round(avg));
            map.put("studentCount", deptStudentCount.get(dept));
            deptAverages.add(map);
        }

        Map<String, Object> summary = new HashMap<>();
        summary.put("averageReadinessScore", Math.round(averageReadiness));
        summary.put("atRiskCount", atRiskStudentsList.size());
        summary.put("deptAverages", deptAverages);
        summary.put("atRiskStudents", atRiskStudentsList);
        summary.put("totalStudents", totalStudentsCount);

        return summary;
    }
}
