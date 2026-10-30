USE placement_db;

-- Hash for 'admin123': $2a$10$M4GwW3tJdJpGkgpJzq7J/.ey9ozl9H9dp7yqvBBDvny9m2o0GlSmO
-- Hash for 'password123': $2a$10$WKCDPr6Q3yxmGhCzMsg/WuLOJxEHGz0R2tZuhluwjrqiB4kavg01e

UPDATE admins 
SET password_hash = '$2a$10$M4GwW3tJdJpGkgpJzq7J/.ey9ozl9H9dp7yqvBBDvny9m2o0GlSmO' 
WHERE email IN ('admin@placement.edu', 'tpo@university.edu');

-- Ensure Amit Sharma and Priya Patel exist with password123
INSERT INTO students (student_id, reg_no, name, email, password_hash, department, cgpa, phone)
VALUES 
(202, 'CS2023901', 'Amit Sharma', 'amit.sharma@student.edu', '$2a$10$WKCDPr6Q3yxmGhCzMsg/WuLOJxEHGz0R2tZuhluwjrqiB4kavg01e', 'Computer Science', 9.20, '+919876500901')
ON DUPLICATE KEY UPDATE 
password_hash = '$2a$10$WKCDPr6Q3yxmGhCzMsg/WuLOJxEHGz0R2tZuhluwjrqiB4kavg01e',
name = 'Amit Sharma',
cgpa = 9.20;

INSERT INTO students (student_id, reg_no, name, email, password_hash, department, cgpa, phone)
VALUES 
(203, 'EC2023902', 'Priya Patel', 'priya.patel@student.edu', '$2a$10$WKCDPr6Q3yxmGhCzMsg/WuLOJxEHGz0R2tZuhluwjrqiB4kavg01e', 'Electronics & Communication', 8.50, '+919876500902')
ON DUPLICATE KEY UPDATE 
password_hash = '$2a$10$WKCDPr6Q3yxmGhCzMsg/WuLOJxEHGz0R2tZuhluwjrqiB4kavg01e',
name = 'Priya Patel',
cgpa = 8.50;
