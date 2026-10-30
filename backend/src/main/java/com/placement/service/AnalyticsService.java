package com.placement.service;

import com.placement.dto.AnalyticsSummaryDto;
import com.placement.dto.EligibilityResultDto;
import com.placement.dto.IntelligenceDto;
import com.placement.entity.Application;
import com.placement.entity.ApplicationStatus;
import com.placement.entity.Company;
import com.placement.entity.Interview;
import com.placement.entity.Student;
import com.placement.repository.ApplicationRepository;
import com.placement.repository.CompanyRepository;
import com.placement.repository.InterviewRepository;
import com.placement.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private InterviewRepository interviewRepository;

    @Autowired
    private EligibilityEngineService eligibilityEngineService;

    @Autowired
    private ReadinessEngineService readinessEngineService;

    @Autowired
    private com.placement.repository.ReferenceRepository referenceRepository;

    public AnalyticsSummaryDto getSummaryMetrics() {
        long studentsCount = studentRepository.count();
        long companiesCount = companyRepository.count();
        long applicationsCount = applicationRepository.count();

        long shortlisted = applicationRepository.countByStatus(ApplicationStatus.SHORTLISTED);
        long selected = applicationRepository.countByStatus(ApplicationStatus.SELECTED);
        long rejected = applicationRepository.countByStatus(ApplicationStatus.REJECTED);
        long upcomingInterviews = interviewRepository.countByInterviewDateAfter(LocalDateTime.now());

        LocalDateTime startOfToday = LocalDateTime.now().with(LocalTime.MIN);
        LocalDateTime endOfToday = LocalDateTime.now().with(LocalTime.MAX);
        long interviewsToday = interviewRepository.findAllByInterviewDateBetween(startOfToday, endOfToday).size();

        LocalDate today = LocalDate.now();
        long scheduledDrives = companyRepository.findAll().stream()
                .filter(c -> c.getDriveDate() != null && !c.getDriveDate().isBefore(today))
                .count();

        double placementPct = 0.0;
        if (studentsCount > 0) {
            placementPct = ((double) selected / studentsCount) * 100.0;
        }

        long totalReferences = referenceRepository.count();
        Long totalDownloads = referenceRepository.sumDownloadCount();

        AnalyticsSummaryDto summary = new AnalyticsSummaryDto();
        summary.setTotalStudents(studentsCount);
        summary.setTotalCompanies(companiesCount);
        summary.setTotalApplications(applicationsCount);
        summary.setShortlistedCount(shortlisted);
        summary.setSelectedCount(selected);
        summary.setRejectedCount(rejected);
        summary.setUpcomingInterviewsCount(upcomingInterviews);
        summary.setInterviewsTodayCount(interviewsToday);
        summary.setScheduledDrivesCount(scheduledDrives);
        summary.setPlacementPercentage(Math.round(placementPct * 100.0) / 100.0);
        summary.setTotalReferences(totalReferences);
        summary.setTotalDownloads(totalDownloads != null ? totalDownloads : 0L);

        return summary;
    }

    public List<Map<String, Object>> getCompanyWiseStats() {
        List<Object[]> queryResults = applicationRepository.getCompanyWiseStats();
        List<Map<String, Object>> statsList = new ArrayList<>();

        for (Object[] row : queryResults) {
            Map<String, Object> map = new HashMap<>();
            map.put("companyName", row[0]);
            map.put("applicationsCount", row[1]);
            map.put("selectionsCount", row[2]);
            statsList.add(map);
        }
        return statsList;
    }

    public List<Map<String, Object>> getDepartmentWiseStats() {
        List<Object[]> queryResults = applicationRepository.getDepartmentWiseStats();
        List<Map<String, Object>> statsList = new ArrayList<>();

        for (Object[] row : queryResults) {
            Map<String, Object> map = new HashMap<>();
            map.put("departmentName", row[0]);
            map.put("applicationsCount", row[1]);
            map.put("selectionsCount", row[2]);
            statsList.add(map);
        }
        return statsList;
    }

    public List<Map<String, Object>> getMonthlyApplicationTrends() {
        List<Application> apps = applicationRepository.findAll();
        Map<String, Long> grouped = apps.stream()
                .collect(Collectors.groupingBy(
                        app -> {
                            LocalDateTime date = app.getAppliedDate();
                            if (date == null) {
                                return "Unknown";
                            }
                            return date.getYear() + "-" + String.format("%02d", date.getMonthValue());
                        },
                        Collectors.counting()
                ));

        List<Map<String, Object>> list = new ArrayList<>();
        grouped.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .forEach(entry -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("month", entry.getKey());
                    map.put("count", entry.getValue());
                    list.add(map);
                });
        return list;
    }

    public IntelligenceDto getIntelligenceData() {
        List<Student> rawStudentsList = studentRepository.findAll();
        List<Company> rawCompaniesList = companyRepository.findAll();
        List<Application> rawApplicationsList = applicationRepository.findAll();
        List<Interview> rawInterviewsList = interviewRepository.findAll();

        final List<Student> students = (rawStudentsList != null) ? rawStudentsList : new ArrayList<>();
        final List<Company> companies = (rawCompaniesList != null) ? rawCompaniesList : new ArrayList<>();
        final List<Application> applications = (rawApplicationsList != null) ? rawApplicationsList : new ArrayList<>();
        final List<Interview> interviews = (rawInterviewsList != null) ? rawInterviewsList : new ArrayList<>();

        List<Company> filteredActive = companies.stream()
                .filter(c -> c != null && Boolean.TRUE.equals(c.getActive()))
                .collect(Collectors.toList());
        final List<Company> activeCompanies = filteredActive.isEmpty() ? companies : filteredActive;

        // 1. Calculate Summary with Two-Stage Eligibility Screening
        long totalStudents = students.size();

        // Stage 1: CGPA Screening
        long cgpaEligibleStudents = students.stream().filter(s -> {
            if (s == null || s.getCgpa() == null) return false;
            return activeCompanies.stream().anyMatch(c -> c.getEligibilityCgpa() != null && s.getCgpa() >= c.getEligibilityCgpa());
        }).count();

        // Stage 2: Skill Matching (>= 60%)
        long skillEligibleStudents = students.stream().filter(s -> {
            if (s == null) return false;
            return activeCompanies.stream().anyMatch(c -> {
                EligibilityEngineService.SkillMatchResult res = eligibilityEngineService.calculateSkillMatch(s.getSkills(), c.getRequiredSkills());
                return res.isEligible();
            });
        }).count();

        // Final Eligible Students: Passed both CGPA Screening and Skill Matching (>= 60%)
        long finalEligibleStudents = students.stream().filter(s -> {
            if (s == null) return false;
            return activeCompanies.stream().anyMatch(c -> {
                EligibilityResultDto eval = eligibilityEngineService.evaluateEligibility(s, c);
                return Boolean.TRUE.equals(eval.getFinalEligible());
            });
        }).count();

        long appliedStudents = applications.stream()
                .filter(a -> a != null && a.getStudent() != null && a.getStudent().getStudentId() != null)
                .map(a -> a.getStudent().getStudentId())
                .distinct()
                .count();

        long shortlistedStudents = applications.stream()
                .filter(a -> a != null && a.getStatus() == ApplicationStatus.SHORTLISTED)
                .filter(a -> a.getStudent() != null && a.getStudent().getStudentId() != null)
                .map(a -> a.getStudent().getStudentId())
                .distinct()
                .count();

        long selectedStudents = applications.stream()
                .filter(a -> a != null && a.getStatus() == ApplicationStatus.SELECTED)
                .filter(a -> a.getStudent() != null && a.getStudent().getStudentId() != null)
                .map(a -> a.getStudent().getStudentId())
                .distinct()
                .count();

        double placementPercentage = totalStudents > 0
                ? ((double) selectedStudents / totalStudents) * 100.0
                : 0.0;

        double averagePackage = applications.stream()
                .filter(a -> a != null && a.getStatus() == ApplicationStatus.SELECTED)
                .filter(a -> a.getCompany() != null && a.getCompany().getPackageAmount() != null)
                .mapToDouble(a -> a.getCompany().getPackageAmount())
                .average()
                .orElse(0.0);

        double highestPackage = applications.stream()
                .filter(a -> a != null && a.getStatus() == ApplicationStatus.SELECTED)
                .filter(a -> a.getCompany() != null && a.getCompany().getPackageAmount() != null)
                .mapToDouble(a -> a.getCompany().getPackageAmount())
                .max()
                .orElse(0.0);

        IntelligenceDto.Summary summary = new IntelligenceDto.Summary();
        summary.setTotalStudents(totalStudents);
        summary.setCgpaEligibleStudents(cgpaEligibleStudents);
        summary.setSkillEligibleStudents(skillEligibleStudents);
        summary.setFinalEligibleStudents(finalEligibleStudents);
        summary.setEligibleStudents(finalEligibleStudents); // Backward compatibility
        summary.setAppliedStudents(appliedStudents);
        summary.setShortlistedStudents(shortlistedStudents);
        summary.setSelectedStudents(selectedStudents);
        summary.setPlacementPercentage(Math.round(placementPercentage * 100.0) / 100.0);
        summary.setAveragePackage(Math.round(averagePackage * 100.0) / 100.0);
        summary.setHighestPackage(Math.round(highestPackage * 100.0) / 100.0);

        // 2. Recruitment Funnel
        List<Map<String, Object>> funnel = new ArrayList<>();
        long regCount = applications.stream().filter(Objects::nonNull).count();
        long shortCount = applications.stream().filter(a -> a != null && a.getStatus() != null && a.getStatus() != ApplicationStatus.APPLIED && a.getStatus() != ApplicationStatus.REJECTED).count();
        long aptitudeCount = applications.stream().filter(a -> a != null && a.getStatus() != null && a.getStatus() != ApplicationStatus.APPLIED && a.getStatus() != ApplicationStatus.SHORTLISTED && a.getStatus() != ApplicationStatus.REJECTED).count();
        long techCount = applications.stream().filter(a -> a != null && a.getStatus() != null && (a.getStatus() == ApplicationStatus.TECHNICAL_CLEARED || a.getStatus() == ApplicationStatus.HR_CLEARED || a.getStatus() == ApplicationStatus.SELECTED)).count();
        long hrCount = applications.stream().filter(a -> a != null && a.getStatus() != null && (a.getStatus() == ApplicationStatus.HR_CLEARED || a.getStatus() == ApplicationStatus.SELECTED)).count();
        long selCount = applications.stream().filter(a -> a != null && a.getStatus() != null && a.getStatus() == ApplicationStatus.SELECTED).count();

        funnel.add(createFunnelStage("Eligible Pool", finalEligibleStudents, finalEligibleStudents));
        funnel.add(createFunnelStage("Applied", regCount, finalEligibleStudents));
        funnel.add(createFunnelStage("Shortlisted", shortCount, regCount));
        funnel.add(createFunnelStage("Aptitude Cleared", aptitudeCount, shortCount));
        funnel.add(createFunnelStage("Technical Cleared", techCount, aptitudeCount));
        funnel.add(createFunnelStage("HR Cleared", hrCount, techCount));
        funnel.add(createFunnelStage("Selected", selCount, hrCount));

        // 3. Professional Eligibility Pipeline
        // CGPA Check → Skill Match Analysis → Final Eligibility → Notification Sent
        List<Map<String, Object>> eligibilityPipeline = new ArrayList<>();

        Map<String, Object> ep0 = new HashMap<>();
        ep0.put("stage", "Total Candidates");
        ep0.put("count", totalStudents);
        ep0.put("rate", 100.0);
        ep0.put("dropOffRate", 0.0);
        ep0.put("description", "Registered active candidates in pool");
        eligibilityPipeline.add(ep0);

        double cgpaRate = totalStudents > 0 ? ((double) cgpaEligibleStudents / totalStudents) * 100.0 : 0.0;
        Map<String, Object> ep1 = new HashMap<>();
        ep1.put("stage", "CGPA Screening");
        ep1.put("count", cgpaEligibleStudents);
        ep1.put("rate", Math.round(cgpaRate * 10.0) / 10.0);
        ep1.put("dropOffRate", Math.round((100.0 - cgpaRate) * 10.0) / 10.0);
        ep1.put("description", "Candidates meeting minimum academic CGPA threshold");
        eligibilityPipeline.add(ep1);

        double skillRate = totalStudents > 0 ? ((double) skillEligibleStudents / totalStudents) * 100.0 : 0.0;
        Map<String, Object> ep2 = new HashMap<>();
        ep2.put("stage", "Skill Match Analysis");
        ep2.put("count", skillEligibleStudents);
        ep2.put("rate", Math.round(skillRate * 10.0) / 10.0);
        ep2.put("dropOffRate", Math.round((100.0 - skillRate) * 10.0) / 10.0);
        ep2.put("description", "Candidates meeting >= 60% technical skill match");
        eligibilityPipeline.add(ep2);

        double finalRate = totalStudents > 0 ? ((double) finalEligibleStudents / totalStudents) * 100.0 : 0.0;
        Map<String, Object> ep3 = new HashMap<>();
        ep3.put("stage", "Final Eligibility");
        ep3.put("count", finalEligibleStudents);
        ep3.put("rate", Math.round(finalRate * 10.0) / 10.0);
        ep3.put("dropOffRate", Math.round((100.0 - finalRate) * 10.0) / 10.0);
        ep3.put("description", "Satisfied both CGPA and Technical Skill Matching");
        eligibilityPipeline.add(ep3);

        Map<String, Object> ep4 = new HashMap<>();
        ep4.put("stage", "Notification Sent");
        ep4.put("count", finalEligibleStudents);
        ep4.put("rate", 100.0);
        ep4.put("dropOffRate", 0.0);
        ep4.put("description", "Direct placement drive alerts dispatched to eligible candidates");
        eligibilityPipeline.add(ep4);

        // 4. Skill Match Distribution
        Map<String, Integer> distBuckets = new LinkedHashMap<>();
        distBuckets.put("0-20%", 0);
        distBuckets.put("21-40%", 0);
        distBuckets.put("41-59%", 0);
        distBuckets.put("60-79%", 0);
        distBuckets.put("80-100%", 0);

        int totalEvaluations = 0;
        for (Company c : activeCompanies) {
            for (Student s : students) {
                double score = eligibilityEngineService.calculateSkillMatch(s.getSkills(), c.getRequiredSkills()).getMatchPercentage();
                totalEvaluations++;
                if (score <= 20.0) distBuckets.put("0-20%", distBuckets.get("0-20%") + 1);
                else if (score <= 40.0) distBuckets.put("21-40%", distBuckets.get("21-40%") + 1);
                else if (score < 60.0) distBuckets.put("41-59%", distBuckets.get("41-59%") + 1);
                else if (score <= 80.0) distBuckets.put("60-79%", distBuckets.get("60-79%") + 1);
                else distBuckets.put("80-100%", distBuckets.get("80-100%") + 1);
            }
        }

        List<Map<String, Object>> skillMatchDist = new ArrayList<>();
        for (Map.Entry<String, Integer> entry : distBuckets.entrySet()) {
            Map<String, Object> map = new HashMap<>();
            map.put("range", entry.getKey());
            map.put("count", entry.getValue());
            double pct = totalEvaluations > 0 ? ((double) entry.getValue() / totalEvaluations) * 100.0 : 0.0;
            map.put("percentage", Math.round(pct * 10.0) / 10.0);
            boolean isEligible = entry.getKey().equals("60-79%") || entry.getKey().equals("80-100%");
            map.put("status", isEligible ? "Eligible (>=60%)" : "Ineligible (<60%)");
            skillMatchDist.add(map);
        }

        // 5. Most Missing Skills
        Map<String, Integer> missingSkillFreq = new HashMap<>();
        Map<String, Set<Integer>> missingSkillStudents = new HashMap<>();

        for (Company c : activeCompanies) {
            if (c.getRequiredSkills() == null || c.getRequiredSkills().isEmpty()) continue;
            for (Student s : students) {
                EligibilityEngineService.SkillMatchResult res = eligibilityEngineService.calculateSkillMatch(s.getSkills(), c.getRequiredSkills());
                for (String m : res.getMissingSkills()) {
                    missingSkillFreq.put(m, missingSkillFreq.getOrDefault(m, 0) + 1);
                    missingSkillStudents.computeIfAbsent(m, k -> new HashSet<>()).add(s.getStudentId());
                }
            }
        }

        List<Map<String, Object>> mostMissingSkills = missingSkillFreq.entrySet().stream()
                .sorted((e1, e2) -> Integer.compare(e2.getValue(), e1.getValue()))
                .limit(10)
                .map(e -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("skill", e.getKey());
                    map.put("missingCount", e.getValue());
                    int affectedCount = missingSkillStudents.getOrDefault(e.getKey(), Collections.emptySet()).size();
                    map.put("affectedStudents", affectedCount);
                    double impact = totalStudents > 0 ? ((double) affectedCount / totalStudents) * 100.0 : 0.0;
                    map.put("impactRate", Math.round(impact * 10.0) / 10.0);
                    return map;
                })
                .collect(Collectors.toList());

        // 6. Eligibility Rate per Company
        List<Map<String, Object>> compEligibilityRates = new ArrayList<>();
        for (Company c : companies) {
            if (c == null || c.getCompanyId() == null) continue;
            long cCgpaCount = 0;
            long cSkillCount = 0;
            long cFinalCount = 0;

            for (Student s : students) {
                EligibilityResultDto eval = eligibilityEngineService.evaluateEligibility(s, c);
                if (Boolean.TRUE.equals(eval.getCgpaEligible())) cCgpaCount++;
                if (Boolean.TRUE.equals(eval.getSkillEligible())) cSkillCount++;
                if (Boolean.TRUE.equals(eval.getFinalEligible())) cFinalCount++;
            }

            double eRate = totalStudents > 0 ? ((double) cFinalCount / totalStudents) * 100.0 : 0.0;
            double cPassRate = totalStudents > 0 ? ((double) cCgpaCount / totalStudents) * 100.0 : 0.0;
            double sPassRate = totalStudents > 0 ? ((double) cSkillCount / totalStudents) * 100.0 : 0.0;

            Map<String, Object> map = new HashMap<>();
            map.put("companyId", c.getCompanyId());
            map.put("companyName", c.getCompanyName());
            map.put("packageAmount", c.getPackageAmount() != null ? c.getPackageAmount() : 0.0);
            map.put("eligibilityCgpa", c.getEligibilityCgpa() != null ? c.getEligibilityCgpa() : 0.0);
            map.put("requiredSkillsCount", c.getRequiredSkills() != null ? c.getRequiredSkills().size() : 0);
            map.put("requiredSkills", c.getRequiredSkills() != null ? c.getRequiredSkills() : Collections.emptyList());
            map.put("totalStudents", totalStudents);
            map.put("cgpaEligible", cCgpaCount);
            map.put("skillEligible", cSkillCount);
            map.put("finalEligible", cFinalCount);
            map.put("eligibilityRate", Math.round(eRate * 10.0) / 10.0);
            map.put("cgpaPassRate", Math.round(cPassRate * 10.0) / 10.0);
            map.put("skillPassRate", Math.round(sPassRate * 10.0) / 10.0);
            compEligibilityRates.add(map);
        }

        // 7. Student Readiness Score
        double avgReadiness = 75.0;
        try {
            Map<String, Object> readinessSummary = readinessEngineService.calculateAdminReadinessSummary();
            Number scoreNum = (Number) readinessSummary.get("averageReadinessScore");
            if (scoreNum != null) {
                avgReadiness = scoreNum.doubleValue();
            }
        } catch (Exception ignored) {
        }

        // 8. Department Stats
        List<Map<String, Object>> deptStats = new ArrayList<>();
        Map<String, List<Student>> deptStudents = students.stream()
                .filter(s -> s != null && s.getDepartment() != null)
                .collect(Collectors.groupingBy(Student::getDepartment));

        for (Map.Entry<String, List<Student>> entry : deptStudents.entrySet()) {
            String dept = entry.getKey();
            List<Student> deptSts = entry.getValue();
            long total = deptSts.size();

            long placed = deptSts.stream().filter(s ->
                    applications.stream().anyMatch(a -> a != null && a.getStudent() != null
                            && a.getStudent().getStudentId().equals(s.getStudentId())
                            && a.getStatus() == ApplicationStatus.SELECTED)
            ).count();

            double deptPlacementRate = total > 0 ? ((double) placed / total) * 100.0 : 0.0;

            long deptApps = applications.stream()
                    .filter(a -> a != null && a.getStudent() != null && dept.equals(a.getStudent().getDepartment()))
                    .count();

            long deptSels = applications.stream()
                    .filter(a -> a != null && a.getStudent() != null && dept.equals(a.getStudent().getDepartment()) && a.getStatus() == ApplicationStatus.SELECTED)
                    .count();

            double deptAvgPkg = applications.stream()
                    .filter(a -> a != null && a.getStudent() != null && dept.equals(a.getStudent().getDepartment()) && a.getStatus() == ApplicationStatus.SELECTED)
                    .filter(a -> a.getCompany() != null && a.getCompany().getPackageAmount() != null)
                    .mapToDouble(a -> a.getCompany().getPackageAmount())
                    .average()
                    .orElse(0.0);

            Map<String, Object> map = new HashMap<>();
            map.put("department", dept);
            map.put("totalStudents", total);
            map.put("placedStudents", placed);
            map.put("placementRate", Math.round(deptPlacementRate * 100.0) / 100.0);
            map.put("applications", deptApps);
            map.put("selections", deptSels);
            map.put("averagePackage", Math.round(deptAvgPkg * 100.0) / 100.0);
            deptStats.add(map);
        }

        // 9. Company Stats
        List<Map<String, Object>> companyStats = new ArrayList<>();
        for (Company c : companies) {
            if (c == null || c.getCompanyId() == null || c.getCompanyName() == null) continue;
            long compApps = applications.stream().filter(a -> a != null && a.getCompany() != null && c.getCompanyId().equals(a.getCompany().getCompanyId())).count();
            long compSels = applications.stream().filter(a -> a != null && a.getCompany() != null && c.getCompanyId().equals(a.getCompany().getCompanyId()) && a.getStatus() == ApplicationStatus.SELECTED).count();
            double selPct = compApps > 0 ? ((double) compSels / compApps) * 100.0 : 0.0;

            Map<String, Object> map = new HashMap<>();
            map.put("companyId", c.getCompanyId());
            map.put("companyName", c.getCompanyName());
            map.put("applications", compApps);
            map.put("selections", compSels);
            map.put("selectionPercentage", Math.round(selPct * 100.0) / 100.0);
            map.put("packageAmount", c.getPackageAmount() != null ? c.getPackageAmount() : 0.0);
            map.put("driveDate", c.getDriveDate() != null ? c.getDriveDate().toString() : "");
            map.put("applicationDeadline", c.getApplicationDeadline() != null ? c.getApplicationDeadline().toString() : "");
            companyStats.add(map);
        }

        long maxApps = companyStats.stream().mapToLong(m -> (long) m.get("applications")).max().orElse(0);
        long maxSels = companyStats.stream().mapToLong(m -> (long) m.get("selections")).max().orElse(0);

        for (Map<String, Object> m : companyStats) {
            long apps = (long) m.get("applications");
            long sels = (long) m.get("selections");
            m.put("isPopular", apps > 0 && apps == maxApps);
            m.put("isHighestRecruiting", sels > 0 && sels == maxSels);
        }

        // 10. Student Insights
        IntelligenceDto.StudentInsights insights = new IntelligenceDto.StudentInsights();

        List<Map<String, Object>> topPerforming = students.stream()
                .filter(s -> s != null && s.getName() != null && s.getDepartment() != null && s.getCgpa() != null)
                .filter(s -> applications.stream().anyMatch(a -> a != null && a.getStudent() != null && a.getStudent().getStudentId().equals(s.getStudentId()) && a.getStatus() == ApplicationStatus.SELECTED))
                .sorted((s1, s2) -> Double.compare(s2.getCgpa(), s1.getCgpa()))
                .limit(5)
                .map(s -> {
                    double pkg = applications.stream()
                            .filter(a -> a != null && a.getStudent() != null && a.getStudent().getStudentId().equals(s.getStudentId()) && a.getStatus() == ApplicationStatus.SELECTED)
                            .filter(a -> a.getCompany() != null && a.getCompany().getPackageAmount() != null)
                            .mapToDouble(a -> a.getCompany().getPackageAmount())
                            .max()
                            .orElse(0.0);
                    Map<String, Object> map = new HashMap<>();
                    map.put("name", s.getName());
                    map.put("department", s.getDepartment());
                    map.put("cgpa", s.getCgpa());
                    map.put("packageAmount", pkg);
                    return map;
                })
                .collect(Collectors.toList());
        insights.setTopPerforming(topPerforming);

        List<Map<String, Object>> awaitingInterviews = new ArrayList<>();
        for (Interview interview : interviews) {
            if (interview != null && interview.getInterviewDate() != null && interview.getCompany() != null && interview.getRoundName() != null && interview.getInterviewDate().isAfter(LocalDateTime.now())) {
                if (interview.getStudents() != null) {
                    for (Student s : interview.getStudents()) {
                        if (s != null && s.getStudentId() != null && s.getName() != null && s.getDepartment() != null) {
                            boolean waiting = applications.stream().anyMatch(a ->
                                    a != null && a.getStudent() != null && a.getCompany() != null &&
                                            a.getStudent().getStudentId().equals(s.getStudentId()) &&
                                            a.getCompany().getCompanyId().equals(interview.getCompany().getCompanyId()) &&
                                            a.getStatus() != ApplicationStatus.SELECTED &&
                                            a.getStatus() != ApplicationStatus.REJECTED
                            );
                            if (waiting) {
                                Map<String, Object> map = new HashMap<>();
                                map.put("name", s.getName());
                                map.put("department", s.getDepartment());
                                map.put("cgpa", s.getCgpa() != null ? s.getCgpa() : 0.0);
                                map.put("companyName", interview.getCompany().getCompanyName());
                                map.put("roundName", interview.getRoundName());
                                map.put("interviewDate", interview.getInterviewDate().toString());
                                map.put("venue", interview.getVenue() != null ? interview.getVenue() : "Virtual");
                                awaitingInterviews.add(map);
                            }
                        }
                    }
                }
            }
        }
        insights.setAwaitingInterviews(awaitingInterviews);

        List<Map<String, Object>> withoutApps = students.stream()
                .filter(s -> s != null && s.getName() != null && s.getDepartment() != null && s.getCgpa() != null)
                .filter(s -> applications.stream().noneMatch(a -> a != null && a.getStudent() != null && a.getStudent().getStudentId().equals(s.getStudentId())))
                .sorted((s1, s2) -> Double.compare(s2.getCgpa(), s1.getCgpa()))
                .limit(10)
                .map(s -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("name", s.getName());
                    map.put("department", s.getDepartment());
                    map.put("cgpa", s.getCgpa());
                    map.put("phone", s.getPhone() != null ? s.getPhone() : "");
                    return map;
                })
                .collect(Collectors.toList());
        insights.setWithoutApplications(withoutApps);

        List<Map<String, Object>> nearThreshold = new ArrayList<>();
        for (Student s : students) {
            if (s == null || s.getCgpa() == null || s.getDepartment() == null || s.getName() == null) continue;
            for (Company c : companies) {
                if (c == null || c.getEligibilityCgpa() == null || c.getEligibleDepartments() == null || c.getCompanyName() == null) continue;
                String sDept = s.getDepartment().trim().toLowerCase();
                List<String> cDepts = Arrays.stream(c.getEligibleDepartments().split(","))
                        .map(d -> d.trim().toLowerCase())
                        .collect(Collectors.toList());
                if (cDepts.contains(sDept)) {
                    double diff = c.getEligibilityCgpa() - s.getCgpa();
                    if (diff > 0 && diff <= 0.21) {
                        boolean alreadyApplied = applications.stream().anyMatch(a ->
                                a != null && a.getStudent() != null && a.getCompany() != null &&
                                        a.getStudent().getStudentId().equals(s.getStudentId()) &&
                                        a.getCompany().getCompanyId().equals(c.getCompanyId())
                        );
                        if (!alreadyApplied) {
                            Map<String, Object> map = new HashMap<>();
                            map.put("name", s.getName());
                            map.put("department", s.getDepartment());
                            map.put("cgpa", s.getCgpa());
                            map.put("companyName", c.getCompanyName());
                            map.put("cutoffCgpa", c.getEligibilityCgpa());
                            map.put("diff", Math.round(diff * 100.0) / 100.0);
                            nearThreshold.add(map);
                        }
                    }
                }
            }
        }
        insights.setNearThreshold(nearThreshold.stream().limit(10).collect(Collectors.toList()));

        IntelligenceDto dto = new IntelligenceDto();
        dto.setSummary(summary);
        dto.setFunnel(funnel);
        dto.setEligibilityPipeline(eligibilityPipeline);
        dto.setSkillMatchDistribution(skillMatchDist);
        dto.setMostMissingSkills(mostMissingSkills);
        dto.setCompanyEligibilityRates(compEligibilityRates);
        dto.setAverageStudentReadiness(avgReadiness);
        dto.setDepartmentStats(deptStats);
        dto.setCompanyStats(companyStats);
        dto.setStudentInsights(insights);

        return dto;
    }

    private Map<String, Object> createFunnelStage(String stage, long count, long prevCount) {
        double conv = prevCount > 0 ? ((double) count / prevCount) * 100.0 : 0.0;
        if (conv > 100.0) conv = 100.0;
        double drop = 100.0 - conv;

        Map<String, Object> map = new HashMap<>();
        map.put("stage", stage);
        map.put("candidates", count);
        map.put("conversionRate", Math.round(conv * 10.0) / 10.0);
        map.put("dropOffRate", Math.round(drop * 10.0) / 10.0);
        return map;
    }
}
