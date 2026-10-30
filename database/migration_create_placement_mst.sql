-- Migration: Create placement_mst table and populate with existing SELECTED placement records

USE placement_db;

CREATE TABLE IF NOT EXISTS `placement_mst` (
    `placement_id` INT AUTO_INCREMENT PRIMARY KEY,
    `student_id` INT NOT NULL,
    `company_id` INT NOT NULL,
    `department` VARCHAR(100) NOT NULL,
    `package` DECIMAL(10,2) NOT NULL,
    `offer_date` DATETIME NOT NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'SELECTED',
    `offer_accepted` TINYINT(1) NOT NULL DEFAULT 1,
    `academic_year` VARCHAR(20) DEFAULT '2026-2027',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_pmst_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_pmst_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`company_id`) ON DELETE CASCADE,
    UNIQUE KEY `uk_student_company_placement` (`student_id`, `company_id`)
);

-- Seed initial placed records from applications where status = 'SELECTED'
INSERT INTO `placement_mst` (`student_id`, `company_id`, `department`, `package`, `offer_date`, `status`, `offer_accepted`, `academic_year`, `created_at`)
SELECT 
    a.student_id,
    a.company_id,
    s.department,
    COALESCE(c.package_amount, 4.50),
    COALESCE(a.applied_date, NOW()),
    'SELECTED',
    1,
    '2026-2027',
    NOW()
FROM applications a
JOIN students s ON a.student_id = s.student_id
JOIN companies c ON a.company_id = c.company_id
WHERE a.status = 'SELECTED'
ON DUPLICATE KEY UPDATE 
    `package` = VALUES(`package`),
    `status` = VALUES(`status`),
    `department` = VALUES(`department`);
