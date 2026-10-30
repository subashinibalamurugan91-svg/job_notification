-- Migration Script: Implement Two-Stage Eligibility (Skills & Match Percentage)
USE placement_db;

-- 1. Create student_skills table
CREATE TABLE IF NOT EXISTS student_skills (
    student_id INT NOT NULL,
    skill VARCHAR(100) NOT NULL,
    PRIMARY KEY (student_id, skill),
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 2. Create required_skills table
CREATE TABLE IF NOT EXISTS required_skills (
    company_id INT NOT NULL,
    skill VARCHAR(100) NOT NULL,
    PRIMARY KEY (company_id, skill),
    FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3. Add skill_match_percentage to applications if not exists
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'placement_db' 
  AND TABLE_NAME = 'applications' 
  AND COLUMN_NAME = 'skill_match_percentage';

SET @stmt = IF(@col_exists = 0, 'ALTER TABLE applications ADD COLUMN skill_match_percentage DECIMAL(5, 2) DEFAULT 0.00', 'SELECT "Column already exists"');
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. Seed Required Skills for all Companies
DELETE FROM required_skills;

-- Company 1: TCS
INSERT IGNORE INTO required_skills (company_id, skill) VALUES
(1, 'Java'), (1, 'Python'), (1, 'SQL'), (1, 'Git');

-- Company 2: Infosys (Matches User Prompt Example: Java, Spring Boot, MySQL, React)
INSERT IGNORE INTO required_skills (company_id, skill) VALUES
(2, 'Java'), (2, 'Spring Boot'), (2, 'MySQL'), (2, 'React');

-- Company 3: Wipro
INSERT IGNORE INTO required_skills (company_id, skill) VALUES
(3, 'Java'), (3, 'SQL'), (3, 'HTML/CSS'), (3, 'JavaScript');

-- Company 4: Cognizant
INSERT IGNORE INTO required_skills (company_id, skill) VALUES
(4, 'Java'), (4, 'Spring Boot'), (4, 'React'), (4, 'Microservices');

-- Company 5: Accenture
INSERT IGNORE INTO required_skills (company_id, skill) VALUES
(5, 'Python'), (5, 'Cloud (AWS/Azure)'), (5, 'SQL'), (5, 'Agile');

-- Company 6: Capgemini
INSERT IGNORE INTO required_skills (company_id, skill) VALUES
(6, 'Java'), (6, 'Angular'), (6, 'REST API'), (6, 'SQL');

-- Company 7: IBM
INSERT IGNORE INTO required_skills (company_id, skill) VALUES
(7, 'Python'), (7, 'Docker'), (7, 'Kubernetes'), (7, 'Linux'), (7, 'Machine Learning');

-- Company 8: HCL
INSERT IGNORE INTO required_skills (company_id, skill) VALUES
(8, 'C++'), (8, 'Linux'), (8, 'Networking'), (8, 'SQL');

-- Company 9: Tech Mahindra
INSERT IGNORE INTO required_skills (company_id, skill) VALUES
(9, 'Java'), (9, 'JavaScript'), (9, 'MySQL'), (9, 'Spring Boot');

-- Company 10: Deloitte
INSERT IGNORE INTO required_skills (company_id, skill) VALUES
(10, 'Python'), (10, 'SQL'), (10, 'Data Analytics'), (10, 'Power BI');

-- Company 11: Amazon / Product
INSERT IGNORE INTO required_skills (company_id, skill) VALUES
(11, 'Java'), (11, 'Data Structures'), (11, 'Algorithms'), (11, 'System Design'), (11, 'AWS');

-- Company 12: Microsoft
INSERT IGNORE INTO required_skills (company_id, skill) VALUES
(12, 'C++'), (12, 'Data Structures'), (12, 'Algorithms'), (12, 'Azure');

-- Company 13: Oracle
INSERT IGNORE INTO required_skills (company_id, skill) VALUES
(13, 'Java'), (13, 'SQL'), (13, 'Database Management'), (13, 'Spring Boot');

-- Company 14: Cisco
INSERT IGNORE INTO required_skills (company_id, skill) VALUES
(14, 'Python'), (14, 'Networking'), (14, 'Linux'), (14, 'C++');

-- Company 15: Google
INSERT IGNORE INTO required_skills (company_id, skill) VALUES
(15, 'Python'), (15, 'Data Structures'), (15, 'Algorithms'), (15, 'Distributed Systems');

-- 5. Seed Student Skills across all students
DELETE FROM student_skills;

-- Specifically seed Demo Students:
-- Student A: Amit Sharma (Matches prompt example: Java, Spring Boot, MySQL, React -> 100% on Infosys)
INSERT IGNORE INTO student_skills (student_id, skill) 
SELECT student_id, 'Java' FROM students WHERE email = 'amit.sharma@student.edu'
UNION ALL
SELECT student_id, 'Spring Boot' FROM students WHERE email = 'amit.sharma@student.edu'
UNION ALL
SELECT student_id, 'MySQL' FROM students WHERE email = 'amit.sharma@student.edu'
UNION ALL
SELECT student_id, 'React' FROM students WHERE email = 'amit.sharma@student.edu';

-- Student B: Priya Patel (Matches prompt example: Java, MySQL -> 50% on Infosys)
INSERT IGNORE INTO student_skills (student_id, skill) 
SELECT student_id, 'Java' FROM students WHERE email = 'priya.patel@student.edu'
UNION ALL
SELECT student_id, 'MySQL' FROM students WHERE email = 'priya.patel@student.edu';

-- Seed skills for all other students based on their department
-- CS & IT students get a rich mix of modern software skills
INSERT IGNORE INTO student_skills (student_id, skill)
SELECT student_id, 'Java' FROM students WHERE department IN ('Computer Science', 'Information Technology') AND MOD(student_id, 2) = 0
UNION ALL
SELECT student_id, 'Python' FROM students WHERE department IN ('Computer Science', 'Information Technology') AND MOD(student_id, 3) != 0
UNION ALL
SELECT student_id, 'SQL' FROM students WHERE department IN ('Computer Science', 'Information Technology')
UNION ALL
SELECT student_id, 'MySQL' FROM students WHERE department IN ('Computer Science', 'Information Technology') AND MOD(student_id, 2) = 1
UNION ALL
SELECT student_id, 'React' FROM students WHERE department IN ('Computer Science', 'Information Technology') AND MOD(student_id, 3) = 0
UNION ALL
SELECT student_id, 'Spring Boot' FROM students WHERE department IN ('Computer Science', 'Information Technology') AND MOD(student_id, 4) = 0
UNION ALL
SELECT student_id, 'Git' FROM students WHERE department IN ('Computer Science', 'Information Technology')
UNION ALL
SELECT student_id, 'HTML/CSS' FROM students WHERE department IN ('Computer Science', 'Information Technology') AND MOD(student_id, 2) = 0
UNION ALL
SELECT student_id, 'Data Structures' FROM students WHERE department IN ('Computer Science', 'Information Technology') AND cgpa >= 8.0
UNION ALL
SELECT student_id, 'Algorithms' FROM students WHERE department IN ('Computer Science', 'Information Technology') AND cgpa >= 8.5;

-- EC & EE students
INSERT IGNORE INTO student_skills (student_id, skill)
SELECT student_id, 'C++' FROM students WHERE department IN ('Electronics & Communication', 'Electrical Engineering')
UNION ALL
SELECT student_id, 'Python' FROM students WHERE department IN ('Electronics & Communication', 'Electrical Engineering') AND MOD(student_id, 2) = 0
UNION ALL
SELECT student_id, 'SQL' FROM students WHERE department IN ('Electronics & Communication', 'Electrical Engineering') AND MOD(student_id, 3) = 0
UNION ALL
SELECT student_id, 'Linux' FROM students WHERE department IN ('Electronics & Communication', 'Electrical Engineering') AND MOD(student_id, 2) = 1
UNION ALL
SELECT student_id, 'Networking' FROM students WHERE department IN ('Electronics & Communication', 'Electrical Engineering') AND MOD(student_id, 4) = 0
UNION ALL
SELECT student_id, 'MATLAB' FROM students WHERE department IN ('Electronics & Communication', 'Electrical Engineering');

-- ME & CE students
INSERT IGNORE INTO student_skills (student_id, skill)
SELECT student_id, 'Python' FROM students WHERE department IN ('Mechanical Engineering', 'Civil Engineering') AND MOD(student_id, 3) = 0
UNION ALL
SELECT student_id, 'SQL' FROM students WHERE department IN ('Mechanical Engineering', 'Civil Engineering') AND MOD(student_id, 2) = 0
UNION ALL
SELECT student_id, 'AutoCAD' FROM students WHERE department IN ('Mechanical Engineering', 'Civil Engineering')
UNION ALL
SELECT student_id, 'Project Management' FROM students WHERE department IN ('Mechanical Engineering', 'Civil Engineering');

-- 6. Backfill skill_match_percentage for existing applications
UPDATE applications a
JOIN (
    SELECT 
        a.application_id,
        COALESCE(
            CASE 
                WHEN req.total_req = 0 THEN 100.00
                ELSE ROUND((COUNT(ss.skill) / req.total_req) * 100.0, 2)
            END, 0.00
        ) AS calc_match
    FROM applications a
    JOIN (
        SELECT company_id, COUNT(*) AS total_req 
        FROM required_skills 
        GROUP BY company_id
    ) req ON a.company_id = req.company_id
    LEFT JOIN required_skills rs ON a.company_id = rs.company_id
    LEFT JOIN student_skills ss ON a.student_id = ss.student_id AND LOWER(TRIM(rs.skill)) = LOWER(TRIM(ss.skill))
    GROUP BY a.application_id, req.total_req
) matched ON a.application_id = matched.application_id
SET a.skill_match_percentage = matched.calc_match;
