-- MySQL Database Schema for Student Placement Progress Monitoring and Analytics System

CREATE DATABASE IF NOT EXISTS placement_db;
USE placement_db;

-- 1. Admins Table
CREATE TABLE IF NOT EXISTS admins (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(150) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Students Table
CREATE TABLE IF NOT EXISTS students (
    student_id INT AUTO_INCREMENT PRIMARY KEY,
    reg_no VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    cgpa DECIMAL(4, 2) NOT NULL CHECK (cgpa >= 0.00 AND cgpa <= 10.00),
    phone VARCHAR(20) NOT NULL,
    resume_url VARCHAR(500),
    resume_file_name VARCHAR(255),
    resume_uploaded_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3. Companies Table
CREATE TABLE IF NOT EXISTS companies (
    company_id INT AUTO_INCREMENT PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    description TEXT,
    eligibility_cgpa DECIMAL(4, 2) NOT NULL DEFAULT 0.00 CHECK (eligibility_cgpa >= 0.00 AND eligibility_cgpa <= 10.00),
    eligible_departments VARCHAR(500) NOT NULL, -- Stored as comma-separated or JSON list of branches, e.g., "Computer Science,Electronics"
    package_amount DECIMAL(10, 2) NOT NULL, -- e.g. in LPA (Lakhs Per Annum)
    application_deadline DATE NOT NULL,
    drive_date DATE NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3b. Student Skills Table
CREATE TABLE IF NOT EXISTS student_skills (
    student_id INT NOT NULL,
    skill VARCHAR(100) NOT NULL,
    PRIMARY KEY (student_id, skill),
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3c. Company Required Skills Table
CREATE TABLE IF NOT EXISTS required_skills (
    company_id INT NOT NULL,
    skill VARCHAR(100) NOT NULL,
    PRIMARY KEY (company_id, skill),
    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. Applications Table
CREATE TABLE IF NOT EXISTS applications (
    application_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    company_id INT NOT NULL,
    applied_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'APPLIED',
    skill_match_percentage DECIMAL(5, 2) DEFAULT 0.00,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    UNIQUE KEY unique_student_company (student_id, company_id)
) ENGINE=InnoDB;

-- 5. Status History Table
CREATE TABLE IF NOT EXISTS status_history (
    history_id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL,
    previous_status VARCHAR(50),
    current_status VARCHAR(50) NOT NULL,
    updated_by VARCHAR(150) NOT NULL, -- e.g., "admin@placement.edu"
    remarks TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES applications(application_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6. Interviews Table
CREATE TABLE IF NOT EXISTS interviews (
    interview_id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    round_name VARCHAR(150) NOT NULL,
    interview_date DATETIME NOT NULL,
    venue VARCHAR(255) NOT NULL,
    meeting_link VARCHAR(500),
    instructions TEXT,
    remarks VARCHAR(500),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6b. Interview Students Join Table (Assign Eligible Students)
CREATE TABLE IF NOT EXISTS interview_students (
    interview_id INT NOT NULL,
    student_id INT NOT NULL,
    PRIMARY KEY (interview_id, student_id),
    FOREIGN KEY (interview_id) REFERENCES interviews(interview_id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 7. References Table
CREATE TABLE IF NOT EXISTS `references` (
    reference_id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_url VARCHAR(500) NOT NULL,
    reference_type VARCHAR(100) NOT NULL DEFAULT 'PDF',
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- View for backward compatibility
CREATE OR REPLACE VIEW `resources` AS
SELECT reference_id AS resource_id, company_id, title, description, file_url, reference_type AS resource_type, uploaded_at FROM `references`;

-- 8. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT, -- Nullable for global notifications/announcements
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'GENERAL', -- INTERVIEW_REMINDER, RESULT_UPDATE, etc.
    is_read BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 9. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    action VARCHAR(255) NOT NULL,
    performed_by VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 10. Placement Master Table (Placed Students Tracking)
CREATE TABLE IF NOT EXISTS placement_mst (
    placement_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    company_id INT NOT NULL,
    department VARCHAR(100) NOT NULL,
    package DECIMAL(10,2) NOT NULL,
    offer_date DATETIME NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'SELECTED',
    offer_accepted TINYINT(1) NOT NULL DEFAULT 1,
    academic_year VARCHAR(20) DEFAULT '2026-2027',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
    UNIQUE KEY uk_student_company_placement (student_id, company_id)
) ENGINE=InnoDB;
