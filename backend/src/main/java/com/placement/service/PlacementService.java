package com.placement.service;

import com.placement.dto.DepartmentStatsDto;
import com.placement.dto.PlacedStudentDto;
import com.placement.dto.PlacementAnalyticsDto;
import com.placement.entity.Application;
import com.placement.entity.Company;
import com.placement.entity.PlacementMst;
import com.placement.entity.Student;
import com.placement.exception.ResourceNotFoundException;
import com.placement.repository.PlacementMstRepository;
import com.placement.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class PlacementService {

    @Autowired
    private PlacementMstRepository placementMstRepository;

    @Autowired
    private StudentRepository studentRepository;

    /**
     * Retrieve filtered placed students
     */
    public List<PlacedStudentDto> getPlacedStudents(
            String department,
            Integer companyId,
            String status,
            String academicYear,
            Double minPackage,
            Double maxPackage,
            String search) {

        List<PlacementMst> list = placementMstRepository.findAllByOrderByOfferDateDesc();

        // 1. Department Filter (flexible matching for CSE, IT, ECE, EEE, Mechanical, Civil)
        if (department != null && !department.trim().isEmpty() && !department.equalsIgnoreCase("ALL")) {
            String deptFilter = department.trim().toLowerCase();
            list = list.stream().filter(p -> {
                String d = p.getDepartment() != null ? p.getDepartment().toLowerCase() : "";
                if (deptFilter.equals("cse") || deptFilter.contains("computer")) {
                    return d.contains("computer");
                } else if (deptFilter.equals("it") || deptFilter.contains("information")) {
                    return d.contains("information");
                } else if (deptFilter.equals("ece") || deptFilter.contains("electronic")) {
                    return d.contains("electronic");
                } else if (deptFilter.equals("eee") || deptFilter.contains("electrical")) {
                    return d.contains("electrical");
                } else if (deptFilter.equals("mechanical") || deptFilter.contains("mech")) {
                    return d.contains("mech");
                } else if (deptFilter.equals("civil")) {
                    return d.contains("civil");
                }
                return d.equalsIgnoreCase(deptFilter);
            }).collect(Collectors.toList());
        }

        // 2. Company Filter
        if (companyId != null) {
            list = list.stream()
                    .filter(p -> p.getCompany() != null && p.getCompany().getCompanyId().equals(companyId))
                    .collect(Collectors.toList());
        }

        // 3. Status Filter (SELECTED, OFFER_ACCEPTED, etc.)
        if (status != null && !status.trim().isEmpty() && !status.equalsIgnoreCase("ALL")) {
            String s = status.trim().toUpperCase();
            list = list.stream().filter(p -> {
                if (s.equals("OFFER_ACCEPTED")) {
                    return Boolean.TRUE.equals(p.getOfferAccepted()) || "OFFER_ACCEPTED".equalsIgnoreCase(p.getStatus());
                }
                return p.getStatus() != null && p.getStatus().equalsIgnoreCase(s);
            }).collect(Collectors.toList());
        }

        // 4. Academic Year Filter
        if (academicYear != null && !academicYear.trim().isEmpty() && !academicYear.equalsIgnoreCase("ALL")) {
            list = list.stream()
                    .filter(p -> p.getAcademicYear() != null && p.getAcademicYear().equalsIgnoreCase(academicYear.trim()))
                    .collect(Collectors.toList());
        }

        // 5. Package Range Filter
        if (minPackage != null) {
            list = list.stream()
                    .filter(p -> p.getPackageAmount() != null && p.getPackageAmount() >= minPackage)
                    .collect(Collectors.toList());
        }
        if (maxPackage != null) {
            list = list.stream()
                    .filter(p -> p.getPackageAmount() != null && p.getPackageAmount() <= maxPackage)
                    .collect(Collectors.toList());
        }

        // 6. Search Filter (Student Name, Register Number, Company Name)
        if (search != null && !search.trim().isEmpty()) {
            String q = search.trim().toLowerCase();
            list = list.stream().filter(p -> {
                boolean matchName = p.getStudent() != null && p.getStudent().getName() != null && p.getStudent().getName().toLowerCase().contains(q);
                boolean matchReg = p.getStudent() != null && p.getStudent().getRegNo() != null && p.getStudent().getRegNo().toLowerCase().contains(q);
                boolean matchCompany = p.getCompany() != null && p.getCompany().getCompanyName() != null && p.getCompany().getCompanyName().toLowerCase().contains(q);
                return matchName || matchReg || matchCompany;
            }).collect(Collectors.toList());
        }

        return list.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    /**
     * Get aggregate statistics and chart series for placed students dashboard
     */
    public PlacementAnalyticsDto getPlacementAnalytics(String academicYear) {
        List<PlacementMst> allPlacements = placementMstRepository.findAll();
        if (academicYear != null && !academicYear.trim().isEmpty() && !academicYear.equalsIgnoreCase("ALL")) {
            allPlacements = allPlacements.stream()
                    .filter(p -> p.getAcademicYear() != null && p.getAcademicYear().equalsIgnoreCase(academicYear.trim()))
                    .collect(Collectors.toList());
        }

        long totalPlaced = allPlacements.size();
        double highestPkg = 0.0;
        double totalPkg = 0.0;
        Set<Integer> uniqueCompanies = new HashSet<>();

        // Standard Department map with zero initializers (Requirement #6)
        Map<String, Long> deptCounts = new LinkedHashMap<>();
        deptCounts.put("CSE", 0L);
        deptCounts.put("IT", 0L);
        deptCounts.put("ECE", 0L);
        deptCounts.put("EEE", 0L);
        deptCounts.put("Mechanical", 0L);
        deptCounts.put("Civil", 0L);

        // Package Range distribution
        Map<String, Long> pkgDist = new LinkedHashMap<>();
        pkgDist.put("< 5 LPA", 0L);
        pkgDist.put("5 - 10 LPA", 0L);
        pkgDist.put("10 - 20 LPA", 0L);
        pkgDist.put("> 20 LPA", 0L);

        // Company counts
        Map<String, Integer> compCounts = new HashMap<>();
        Map<String, Double> compSumPkg = new HashMap<>();

        for (PlacementMst p : allPlacements) {
            double pkg = p.getPackageAmount() != null ? p.getPackageAmount() : 0.0;
            totalPkg += pkg;
            if (pkg > highestPkg) {
                highestPkg = pkg;
            }

            if (p.getCompany() != null) {
                uniqueCompanies.add(p.getCompany().getCompanyId());
                String cName = p.getCompany().getCompanyName();
                compCounts.put(cName, compCounts.getOrDefault(cName, 0) + 1);
                compSumPkg.put(cName, compSumPkg.getOrDefault(cName, 0.0) + pkg);
            }

            // Department categorization
            String dept = p.getDepartment() != null ? p.getDepartment().toLowerCase() : "";
            if (dept.contains("computer")) {
                deptCounts.put("CSE", deptCounts.get("CSE") + 1);
            } else if (dept.contains("information")) {
                deptCounts.put("IT", deptCounts.get("IT") + 1);
            } else if (dept.contains("electronic")) {
                deptCounts.put("ECE", deptCounts.get("ECE") + 1);
            } else if (dept.contains("electrical")) {
                deptCounts.put("EEE", deptCounts.get("EEE") + 1);
            } else if (dept.contains("mech")) {
                deptCounts.put("Mechanical", deptCounts.get("Mechanical") + 1);
            } else if (dept.contains("civil")) {
                deptCounts.put("Civil", deptCounts.get("Civil") + 1);
            } else {
                deptCounts.put(p.getDepartment(), deptCounts.getOrDefault(p.getDepartment(), 0L) + 1);
            }

            // Package brackets
            if (pkg < 5.0) {
                pkgDist.put("< 5 LPA", pkgDist.get("< 5 LPA") + 1);
            } else if (pkg <= 10.0) {
                pkgDist.put("5 - 10 LPA", pkgDist.get("5 - 10 LPA") + 1);
            } else if (pkg <= 20.0) {
                pkgDist.put("10 - 20 LPA", pkgDist.get("10 - 20 LPA") + 1);
            } else {
                pkgDist.put("> 20 LPA", pkgDist.get("> 20 LPA") + 1);
            }
        }

        double avgPkg = totalPlaced > 0 ? (totalPkg / totalPlaced) : 0.0;
        avgPkg = Math.round(avgPkg * 100.0) / 100.0;

        // Top recruiting companies list
        List<Map<String, Object>> compList = new ArrayList<>();
        compCounts.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .forEach(entry -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("companyName", entry.getKey());
                    map.put("placedCount", entry.getValue());
                    double avg = compSumPkg.get(entry.getKey()) / entry.getValue();
                    map.put("averagePackage", Math.round(avg * 100.0) / 100.0);
                    compList.add(map);
                });

        List<String> years = placementMstRepository.findDistinctAcademicYears();
        if (years.isEmpty()) {
            years = List.of("2026-2027", "2025-2026");
        }

        List<DepartmentStatsDto> departmentStats = getDepartmentStats(academicYear);

        return PlacementAnalyticsDto.builder()
                .totalPlacedStudents(totalPlaced)
                .highestPackage(highestPkg)
                .averagePackage(avgPkg)
                .totalRecruitingCompanies((long) uniqueCompanies.size())
                .departmentWisePlacements(deptCounts)
                .departmentStats(departmentStats)
                .companyWisePlacements(compList)
                .packageDistribution(pkgDist)
                .academicYears(years)
                .build();
    }

    /**
     * Synchronize placement record when an application is SELECTED
     */
    @Transactional
    public void syncFromApplication(Application application) {
        if (application == null || application.getStudent() == null || application.getCompany() == null) {
            return;
        }

        Integer studentId = application.getStudent().getStudentId();
        Integer companyId = application.getCompany().getCompanyId();

        Optional<PlacementMst> existing = placementMstRepository.findByStudentStudentIdAndCompanyCompanyId(studentId, companyId);

        if (existing.isPresent()) {
            PlacementMst p = existing.get();
            p.setStatus(application.getStatus().name());
            p.setPackageAmount(application.getCompany().getPackageAmount());
            p.setDepartment(application.getStudent().getDepartment());
            placementMstRepository.save(p);
        } else {
            PlacementMst p = PlacementMst.builder()
                    .student(application.getStudent())
                    .company(application.getCompany())
                    .department(application.getStudent().getDepartment())
                    .packageAmount(application.getCompany().getPackageAmount() != null ? application.getCompany().getPackageAmount() : 4.50)
                    .offerDate(application.getAppliedDate() != null ? application.getAppliedDate() : LocalDateTime.now())
                    .status("SELECTED")
                    .offerAccepted(true)
                    .academicYear("2026-2027")
                    .createdAt(LocalDateTime.now())
                    .build();
            placementMstRepository.save(p);
        }
    }

    /**
     * Remove placement record if application status is reverted from SELECTED
     */
    @Transactional
    public void removePlacementForApplication(Integer studentId, Integer companyId) {
        Optional<PlacementMst> existing = placementMstRepository.findByStudentStudentIdAndCompanyCompanyId(studentId, companyId);
        existing.ifPresent(placementMstRepository::delete);
    }

    /**
     * Update placement status / offer acceptance
     */
    @Transactional
    public PlacedStudentDto updatePlacementStatus(Integer placementId, String status, Boolean offerAccepted) {
        PlacementMst p = placementMstRepository.findById(placementId)
                .orElseThrow(() -> new ResourceNotFoundException("Placement record not found with id: " + placementId));

        if (status != null && !status.trim().isEmpty()) {
            p.setStatus(status.trim().toUpperCase());
        }
        if (offerAccepted != null) {
            p.setOfferAccepted(offerAccepted);
        }

        PlacementMst updated = placementMstRepository.save(p);
        return convertToDto(updated);
    }

    /**
     * Generate CSV export
     */
    public byte[] exportPlacedStudentsCsv(List<PlacedStudentDto> list) {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (PrintWriter writer = new PrintWriter(baos, true, StandardCharsets.UTF_8)) {
            // Write BOM for Excel UTF-8 recognition
            baos.write(new byte[]{(byte)0xEF, (byte)0xBB, (byte)0xBF});

            writer.println("Student ID,Register Number,Student Name,Department,CGPA,Skills,Company Name,Package (LPA),Placement Status,Offer Date,Contact Number,Email");

            DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            for (PlacedStudentDto s : list) {
                String skillsStr = s.getSkills() != null ? String.join("; ", s.getSkills()) : "";
                String dateStr = s.getOfferDate() != null ? s.getOfferDate().format(dtf) : "";

                writer.println(String.format("\"%d\",\"%s\",\"%s\",\"%s\",\"%.2f\",\"%s\",\"%s\",\"%.2f\",\"%s\",\"%s\",\"%s\",\"%s\"",
                        s.getStudentId(),
                        escapeCsv(s.getRegNo()),
                        escapeCsv(s.getStudentName()),
                        escapeCsv(s.getDepartment()),
                        s.getCgpa() != null ? s.getCgpa() : 0.0,
                        escapeCsv(skillsStr),
                        escapeCsv(s.getCompanyName()),
                        s.getPackageAmount() != null ? s.getPackageAmount() : 0.0,
                        escapeCsv(s.getPlacementStatus()),
                        dateStr,
                        escapeCsv(s.getContactNumber()),
                        escapeCsv(s.getEmail())
                ));
            }
        } catch (Exception e) {
            throw new RuntimeException("Error generating CSV: " + e.getMessage());
        }
        return baos.toByteArray();
    }

    /**
     * Generate Excel-compatible XML HTML table export
     */
    public byte[] exportPlacedStudentsExcel(List<PlacedStudentDto> list) {
        StringBuilder sb = new StringBuilder();
        sb.append("<html xmlns:o=\"urn:schemas-microsoft-com:office:office\" ");
        sb.append("xmlns:x=\"urn:schemas-microsoft-com:office:excel\" ");
        sb.append("xmlns=\"http://www.w3.org/TR/REC-html40\">");
        sb.append("<head><meta charset=\"UTF-8\">");
        sb.append("<style>");
        sb.append("th { background-color: #1e3a8a; color: #ffffff; font-weight: bold; border: 1px solid #cbd5e1; padding: 8px; text-align: left; }");
        sb.append("td { border: 1px solid #e2e8f0; padding: 6px; }");
        sb.append(".dept { font-weight: bold; color: #0f172a; }");
        sb.append(".pkg { color: #047857; font-weight: bold; }");
        sb.append("</style></head><body>");
        sb.append("<h2>Campus Recruitment System - Placed Students Official Report</h2>");
        sb.append("<p>Generated Date: ").append(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"))).append("</p>");
        sb.append("<table>");
        sb.append("<tr>");
        sb.append("<th>Student ID</th><th>Register Number</th><th>Student Name</th><th>Department</th>");
        sb.append("<th>CGPA</th><th>Skills</th><th>Company Name</th><th>Package (LPA)</th>");
        sb.append("<th>Placement Status</th><th>Offer Date</th><th>Contact Number</th><th>Email</th>");
        sb.append("</tr>");

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        for (PlacedStudentDto s : list) {
            String skillsStr = s.getSkills() != null ? String.join(", ", s.getSkills()) : "";
            String dateStr = s.getOfferDate() != null ? s.getOfferDate().format(dtf) : "";

            sb.append("<tr>");
            sb.append("<td>").append(s.getStudentId()).append("</td>");
            sb.append("<td>").append(escapeHtml(s.getRegNo())).append("</td>");
            sb.append("<td><b>").append(escapeHtml(s.getStudentName())).append("</b></td>");
            sb.append("<td class=\"dept\">").append(escapeHtml(s.getDepartment())).append("</td>");
            sb.append("<td>").append(s.getCgpa() != null ? s.getCgpa() : "").append("</td>");
            sb.append("<td>").append(escapeHtml(skillsStr)).append("</td>");
            sb.append("<td>").append(escapeHtml(s.getCompanyName())).append("</td>");
            sb.append("<td class=\"pkg\">₹").append(s.getPackageAmount() != null ? s.getPackageAmount() : "").append(" LPA</td>");
            sb.append("<td>").append(escapeHtml(s.getPlacementStatus())).append("</td>");
            sb.append("<td>").append(dateStr).append("</td>");
            sb.append("<td>").append(escapeHtml(s.getContactNumber())).append("</td>");
            sb.append("<td>").append(escapeHtml(s.getEmail())).append("</td>");
            sb.append("</tr>");
        }
        sb.append("</table></body></html>");

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    public PlacedStudentDto convertToDto(PlacementMst p) {
        Student s = p.getStudent();
        Company c = p.getCompany();

        return PlacedStudentDto.builder()
                .placementId(p.getPlacementId())
                .studentId(s != null ? s.getStudentId() : null)
                .regNo(s != null ? s.getRegNo() : "")
                .studentName(s != null ? s.getName() : "")
                .department(p.getDepartment() != null ? p.getDepartment() : (s != null ? s.getDepartment() : ""))
                .cgpa(s != null ? s.getCgpa() : 0.0)
                .skills(s != null && s.getSkills() != null ? new ArrayList<>(s.getSkills()) : Collections.emptyList())
                .companyId(c != null ? c.getCompanyId() : null)
                .companyName(c != null ? c.getCompanyName() : "")
                .packageAmount(p.getPackageAmount() != null ? p.getPackageAmount() : (c != null ? c.getPackageAmount() : 0.0))
                .placementStatus(p.getStatus() != null ? p.getStatus() : "SELECTED")
                .offerAccepted(Boolean.TRUE.equals(p.getOfferAccepted()))
                .offerDate(p.getOfferDate())
                .contactNumber(s != null ? s.getPhone() : "")
                .email(s != null ? s.getEmail() : "")
                .academicYear(p.getAcademicYear() != null ? p.getAcademicYear() : "2026-2027")
                .build();
    }

    /**
     * Compute department-wise statistics dynamically
     */
    public List<DepartmentStatsDto> getDepartmentStats(String academicYear) {
        List<PlacementMst> allPlacements = placementMstRepository.findAll();
        if (academicYear != null && !academicYear.trim().isEmpty() && !academicYear.equalsIgnoreCase("ALL")) {
            allPlacements = allPlacements.stream()
                    .filter(p -> p.getAcademicYear() != null && p.getAcademicYear().equalsIgnoreCase(academicYear.trim()))
                    .collect(Collectors.toList());
        }

        List<Object[]> rawStudentCounts = studentRepository.getDepartmentStudentCounts();
        Map<String, Long> totalStudentsByDept = new LinkedHashMap<>();
        totalStudentsByDept.put("CSE", 0L);
        totalStudentsByDept.put("IT", 0L);
        totalStudentsByDept.put("ECE", 0L);
        totalStudentsByDept.put("EEE", 0L);
        totalStudentsByDept.put("MECH", 0L);
        totalStudentsByDept.put("CIVIL", 0L);

        for (Object[] row : rawStudentCounts) {
            String rawDept = row[0] != null ? row[0].toString() : "";
            Long count = row[1] != null ? ((Number) row[1]).longValue() : 0L;
            String norm = normalizeDepartmentCode(rawDept);
            totalStudentsByDept.put(norm, totalStudentsByDept.getOrDefault(norm, 0L) + count);
        }

        Map<String, List<PlacementMst>> placementsByDept = new LinkedHashMap<>();
        placementsByDept.put("CSE", new ArrayList<>());
        placementsByDept.put("IT", new ArrayList<>());
        placementsByDept.put("ECE", new ArrayList<>());
        placementsByDept.put("EEE", new ArrayList<>());
        placementsByDept.put("MECH", new ArrayList<>());
        placementsByDept.put("CIVIL", new ArrayList<>());

        for (PlacementMst p : allPlacements) {
            String norm = normalizeDepartmentCode(p.getDepartment());
            placementsByDept.computeIfAbsent(norm, k -> new ArrayList<>()).add(p);
        }

        Map<String, String> deptFullNames = new LinkedHashMap<>();
        deptFullNames.put("CSE", "Computer Science & Engineering");
        deptFullNames.put("IT", "Information Technology");
        deptFullNames.put("ECE", "Electronics & Communication Engineering");
        deptFullNames.put("EEE", "Electrical & Electronics Engineering");
        deptFullNames.put("MECH", "Mechanical Engineering");
        deptFullNames.put("CIVIL", "Civil Engineering");

        List<DepartmentStatsDto> statsList = new ArrayList<>();
        for (String code : List.of("CSE", "IT", "ECE", "EEE", "MECH", "CIVIL")) {
            long total = totalStudentsByDept.getOrDefault(code, 0L);
            List<PlacementMst> placedList = placementsByDept.getOrDefault(code, Collections.emptyList());
            long placed = placedList.size();
            double pct = total > 0 ? Math.round(((double) placed / total * 100.0) * 100.0) / 100.0 : 0.0;

            double sumPkg = 0.0;
            double maxPkg = 0.0;
            for (PlacementMst p : placedList) {
                double pkg = p.getPackageAmount() != null ? p.getPackageAmount() : 0.0;
                sumPkg += pkg;
                if (pkg > maxPkg) maxPkg = pkg;
            }
            double avgPkg = placed > 0 ? Math.round((sumPkg / placed) * 100.0) / 100.0 : 0.0;

            statsList.add(DepartmentStatsDto.builder()
                    .department(code)
                    .departmentName(deptFullNames.getOrDefault(code, code))
                    .totalStudents(total)
                    .placedStudents(placed)
                    .placementPercentage(pct)
                    .averagePackage(avgPkg)
                    .highestPackage(Math.round(maxPkg * 100.0) / 100.0)
                    .build());
        }

        return statsList;
    }

    public String normalizeDepartmentCode(String dept) {
        if (dept == null) return "OTHER";
        String d = dept.toLowerCase().trim();
        if (d.contains("computer") || d.equals("cse")) return "CSE";
        if (d.contains("information") || d.equals("it")) return "IT";
        if (d.contains("electronic") || d.equals("ece")) return "ECE";
        if (d.contains("electrical") || d.equals("eee")) return "EEE";
        if (d.contains("mech")) return "MECH";
        if (d.contains("civil")) return "CIVIL";
        return dept.toUpperCase();
    }

    /**
     * Generate Department-wise Excel report (.xls format)
     */
    public byte[] exportDepartmentStatsExcel(List<DepartmentStatsDto> stats) {
        StringBuilder sb = new StringBuilder();
        sb.append("<html xmlns:o=\"urn:schemas-microsoft-com:office:office\" ");
        sb.append("xmlns:x=\"urn:schemas-microsoft-com:office:excel\" ");
        sb.append("xmlns=\"http://www.w3.org/TR/REC-html40\">");
        sb.append("<head><meta charset=\"UTF-8\">");
        sb.append("<style>");
        sb.append("th { background-color: #1e3a8a; color: #ffffff; font-weight: bold; border: 1px solid #cbd5e1; padding: 10px; text-align: left; }");
        sb.append("td { border: 1px solid #e2e8f0; padding: 8px; }");
        sb.append(".dept-code { font-weight: bold; color: #1e40af; text-align: center; }");
        sb.append(".metric { text-align: right; }");
        sb.append(".pct { color: #047857; font-weight: bold; text-align: right; }");
        sb.append(".total-row { background-color: #f1f5f9; font-weight: bold; }");
        sb.append("</style></head><body>");
        sb.append("<h2>Campus Recruitment System - Department-wise Placement Statistics Report</h2>");
        sb.append("<p>Academic Year: 2026-2027 | Generated Date: ").append(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"))).append("</p>");
        sb.append("<table>");
        sb.append("<tr>");
        sb.append("<th>Department</th><th>Department Full Name</th><th class=\"metric\">Total Students</th><th class=\"metric\">Placed Students</th><th class=\"metric\">Placement %</th><th class=\"metric\">Average Package (LPA)</th><th class=\"metric\">Highest Package (LPA)</th>");
        sb.append("</tr>");

        long grandTotalStudents = 0;
        long grandTotalPlaced = 0;
        for (DepartmentStatsDto d : stats) {
            grandTotalStudents += d.getTotalStudents();
            grandTotalPlaced += d.getPlacedStudents();

            sb.append("<tr>");
            sb.append("<td class=\"dept-code\">").append(escapeHtml(d.getDepartment())).append("</td>");
            sb.append("<td><b>").append(escapeHtml(d.getDepartmentName())).append("</b></td>");
            sb.append("<td class=\"metric\">").append(d.getTotalStudents()).append("</td>");
            sb.append("<td class=\"metric\">").append(d.getPlacedStudents()).append("</td>");
            sb.append("<td class=\"pct\">").append(String.format("%.2f%%", d.getPlacementPercentage())).append("</td>");
            sb.append("<td class=\"metric\">₹").append(String.format("%.2f", d.getAveragePackage())).append(" LPA</td>");
            sb.append("<td class=\"metric\">₹").append(String.format("%.2f", d.getHighestPackage())).append(" LPA</td>");
            sb.append("</tr>");
        }

        double grandPct = grandTotalStudents > 0 ? ((double) grandTotalPlaced / grandTotalStudents * 100.0) : 0.0;
        sb.append("<tr class=\"total-row\">");
        sb.append("<td class=\"dept-code\">TOTAL</td>");
        sb.append("<td>All Departments Combined</td>");
        sb.append("<td class=\"metric\">").append(grandTotalStudents).append("</td>");
        sb.append("<td class=\"metric\">").append(grandTotalPlaced).append("</td>");
        sb.append("<td class=\"pct\">").append(String.format("%.2f%%", grandPct)).append("</td>");
        sb.append("<td class=\"metric\">-</td>");
        sb.append("<td class=\"metric\">-</td>");
        sb.append("</tr>");

        sb.append("</table></body></html>");
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    /**
     * Generate Department-wise PDF-ready printable report
     */
    public byte[] exportDepartmentStatsPdf(List<DepartmentStatsDto> stats) {
        StringBuilder sb = new StringBuilder();
        sb.append("<!DOCTYPE html><html><head><meta charset=\"UTF-8\"><title>Department Placement Statistics Report</title>");
        sb.append("<style>");
        sb.append("@page { size: A4 portrait; margin: 15mm; }");
        sb.append("body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.5; margin: 0; padding: 20px; }");
        sb.append(".header { border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }");
        sb.append(".title { font-size: 20px; font-weight: bold; color: #1e3a8a; margin: 0; }");
        sb.append(".subtitle { font-size: 12px; color: #64748b; margin-top: 4px; }");
        sb.append(".meta { font-size: 11px; color: #475569; text-align: right; }");
        sb.append(".cards { display: flex; gap: 12px; margin-bottom: 20px; }");
        sb.append(".card { flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; }");
        sb.append(".card-title { font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; }");
        sb.append(".card-val { font-size: 18px; font-weight: bold; color: #0f172a; margin-top: 4px; }");
        sb.append("table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }");
        sb.append("th { background-color: #1e3a8a; color: #ffffff; padding: 8px 10px; text-align: left; font-weight: 600; border: 1px solid #1e3a8a; }");
        sb.append("td { padding: 8px 10px; border: 1px solid #cbd5e1; }");
        sb.append("tr:nth-child(even) { background-color: #f8fafc; }");
        sb.append(".badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-weight: 600; font-size: 10px; background: #dbeafe; color: #1e40af; }");
        sb.append(".pct { font-weight: bold; color: #047857; text-align: right; }");
        sb.append(".text-right { text-align: right; }");
        sb.append(".footer { margin-top: 40px; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 12px; display: flex; justify-content: space-between; }");
        sb.append("</style></head><body>");

        long grandTotalStudents = 0;
        long grandTotalPlaced = 0;
        for (DepartmentStatsDto d : stats) {
            grandTotalStudents += d.getTotalStudents();
            grandTotalPlaced += d.getPlacedStudents();
        }
        double grandPct = grandTotalStudents > 0 ? ((double) grandTotalPlaced / grandTotalStudents * 100.0) : 0.0;

        sb.append("<div class=\"header\">");
        sb.append("<div><div class=\"title\">Campus Recruitment Progress and Analytics</div>");
        sb.append("<div class=\"subtitle\">Department-wise Placement Official Analytics Report</div></div>");
        sb.append("<div class=\"meta\">Academic Year: <b>2026-2027</b><br>Generated: ").append(LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a"))).append("</div>");
        sb.append("</div>");

        sb.append("<div class=\"cards\">");
        sb.append("<div class=\"card\"><div class=\"card-title\">Total Students</div><div class=\"card-val\">").append(grandTotalStudents).append("</div></div>");
        sb.append("<div class=\"card\"><div class=\"card-title\">Total Placed</div><div class=\"card-val\" style=\"color:#2563eb;\">").append(grandTotalPlaced).append("</div></div>");
        sb.append("<div class=\"card\"><div class=\"card-title\">Overall Placement Rate</div><div class=\"card-val\" style=\"color:#059669;\">").append(String.format("%.2f%%", grandPct)).append("</div></div>");
        sb.append("<div class=\"card\"><div class=\"card-title\">Tracked Departments</div><div class=\"card-val\">").append(stats.size()).append("</div></div>");
        sb.append("</div>");

        sb.append("<table>");
        sb.append("<thead><tr>");
        sb.append("<th>Department</th><th>Department Name</th><th class=\"text-right\">Total Students</th><th class=\"text-right\">Placed Students</th><th class=\"text-right\">Placement %</th><th class=\"text-right\">Avg Package</th><th class=\"text-right\">Max Package</th>");
        sb.append("</tr></thead><tbody>");

        for (DepartmentStatsDto d : stats) {
            sb.append("<tr>");
            sb.append("<td><span class=\"badge\">").append(escapeHtml(d.getDepartment())).append("</span></td>");
            sb.append("<td><b>").append(escapeHtml(d.getDepartmentName())).append("</b></td>");
            sb.append("<td class=\"text-right\">").append(d.getTotalStudents()).append("</td>");
            sb.append("<td class=\"text-right\">").append(d.getPlacedStudents()).append("</td>");
            sb.append("<td class=\"pct\">").append(String.format("%.2f%%", d.getPlacementPercentage())).append("</td>");
            sb.append("<td class=\"text-right\">₹").append(String.format("%.2f", d.getAveragePackage())).append(" LPA</td>");
            sb.append("<td class=\"text-right\">₹").append(String.format("%.2f", d.getHighestPackage())).append(" LPA</td>");
            sb.append("</tr>");
        }

        sb.append("<tr style=\"background:#f1f5f9; font-weight:bold;\">");
        sb.append("<td>TOTAL</td><td>All Departments Combined</td>");
        sb.append("<td class=\"text-right\">").append(grandTotalStudents).append("</td>");
        sb.append("<td class=\"text-right\">").append(grandTotalPlaced).append("</td>");
        sb.append("<td class=\"pct\">").append(String.format("%.2f%%", grandPct)).append("</td>");
        sb.append("<td class=\"text-right\">-</td><td class=\"text-right\">-</td>");
        sb.append("</tr>");
        sb.append("</tbody></table>");

        sb.append("<div class=\"footer\">");
        sb.append("<div>Verified & Approved by: Placement & Training Cell</div>");
        sb.append("<div>Report ID: PLACEMENT-DEPT-").append(System.currentTimeMillis()).append("</div>");
        sb.append("</div>");
        sb.append("</body></html>");

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }


    private String escapeCsv(String str) {
        if (str == null) return "";
        return str.replace("\"", "\"\"");
    }

    private String escapeHtml(String str) {
        if (str == null) return "";
        return str.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
