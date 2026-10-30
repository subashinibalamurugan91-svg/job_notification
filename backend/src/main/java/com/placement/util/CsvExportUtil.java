package com.placement.util;

import com.placement.entity.Application;
import java.util.List;

public class CsvExportUtil {

    public static byte[] exportApplicationsToCsv(List<Application> applications) {
        StringBuilder sb = new StringBuilder();
        // CSV Header
        sb.append("Application ID,Student Roll No,Student Name,Department,CGPA,Skill Match (%),Phone,Applied Company,CTC (LPA),Application Status,Applied Date\n");

        for (Application app : applications) {
            sb.append(app.getApplicationId()).append(",")
              .append(escapeCsv(app.getStudent().getRegNo())).append(",")
              .append(escapeCsv(app.getStudent().getName())).append(",")
              .append(escapeCsv(app.getStudent().getDepartment())).append(",")
              .append(app.getStudent().getCgpa()).append(",")
              .append(app.getSkillMatchPercentage() != null ? app.getSkillMatchPercentage() : 0.0).append(",")
              .append(escapeCsv(app.getStudent().getPhone())).append(",")
              .append(escapeCsv(app.getCompany().getCompanyName())).append(",")
              .append(app.getCompany().getPackageAmount()).append(",")
              .append(app.getStatus().name()).append(",")
              .append(app.getAppliedDate()).append("\n");
        }

        return sb.toString().getBytes();
    }

    public static byte[] exportSelectedStudentsToCsv(List<Application> selectedApplications) {
        StringBuilder sb = new StringBuilder();
        // CSV Header
        sb.append("Placement ID,Roll Number,Student Name,Email,Department,CGPA,Placed Company,CTC (LPA),Application Date\n");

        for (Application app : selectedApplications) {
            sb.append(app.getApplicationId()).append(",")
              .append(escapeCsv(app.getStudent().getRegNo())).append(",")
              .append(escapeCsv(app.getStudent().getName())).append(",")
              .append(escapeCsv(app.getStudent().getEmail())).append(",")
              .append(escapeCsv(app.getStudent().getDepartment())).append(",")
              .append(app.getStudent().getCgpa()).append(",")
              .append(escapeCsv(app.getCompany().getCompanyName())).append(",")
              .append(app.getCompany().getPackageAmount()).append(",")
              .append(app.getAppliedDate()).append("\n");
        }

        return sb.toString().getBytes();
    }

    private static String escapeCsv(String value) {
        if (value == null) {
            return "";
        }
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}
