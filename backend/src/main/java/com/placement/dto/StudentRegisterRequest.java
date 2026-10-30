package com.placement.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class StudentRegisterRequest {

    @NotBlank(message = "Registration number is required")
    private String regNo;

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    @NotBlank(message = "Department is required")
    private String department;

    @NotNull(message = "CGPA is required")
    @Min(value = 0, message = "CGPA cannot be negative")
    @Max(value = 10, message = "CGPA cannot exceed 10.00")
    private Double cgpa;

    @NotBlank(message = "Phone number is required")
    private String phone;
}
