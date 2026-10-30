package com.placement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlacedStudentDto {
    private Integer placementId;
    private Integer studentId;
    private String regNo;
    private String studentName;
    private String department;
    private Double cgpa;
    private List<String> skills;
    private Integer companyId;
    private String companyName;
    private Double packageAmount;
    private String placementStatus;
    private Boolean offerAccepted;
    private LocalDateTime offerDate;
    private String contactNumber;
    private String email;
    private String academicYear;
}
