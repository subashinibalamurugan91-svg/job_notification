-- Seed 12 Comprehensive Reference Documents with Categories, File Names, Uploaded By, and Initial Download Stats

USE placement_db;

-- Clear previous test references
DELETE FROM `references`;
ALTER TABLE `references` AUTO_INCREMENT = 1;

INSERT INTO `references` (
    `reference_id`, `title`, `category`, `description`, `file_url`, `file_name`, `uploaded_by`, `download_count`, `reference_type`, `uploaded_at`
) VALUES
(
    1, 
    'Aptitude Questions & Solved Problems', 
    'Aptitude', 
    'Comprehensive practice question bank covering percentages, time & work, ratio & proportion, and number systems with step-by-step solutions.', 
    'uploads/references/Aptitude Questions.pdf', 
    'Aptitude Questions.pdf', 
    'TPO Quantitative Cell', 
    342, 
    'PDF', 
    DATE_SUB(NOW(), INTERVAL 14 DAY)
),
(
    2, 
    'Quantitative Aptitude Guide & Formula Sheet', 
    'Aptitude', 
    'Quick reference handbook containing arithmetic formulas, algebra identities, logarithms, geometry theorems, and probability rules.', 
    'uploads/references/Quantitative Aptitude Guide.pdf', 
    'Quantitative Aptitude Guide.pdf', 
    'Senior Mathematics Faculty', 
    419, 
    'PDF', 
    DATE_SUB(NOW(), INTERVAL 12 DAY)
),
(
    3, 
    'Logical Reasoning Practice & Puzzles', 
    'Aptitude', 
    'Standard logical reasoning puzzles covering seating arrangement, syllogisms, blood relations, and coding-decoding patterns.', 
    'uploads/references/Logical Reasoning Practice.pdf', 
    'Logical Reasoning Practice.pdf', 
    'Campus Reasoning Trainer', 
    278, 
    'PDF', 
    DATE_SUB(NOW(), INTERVAL 11 DAY)
),
(
    4, 
    'Technical Interview Questions (Core CS)', 
    'Technical', 
    'Core computer science interview guide spanning Operating Systems, DBMS, Computer Networks, and System Design fundamentals.', 
    'uploads/references/Technical Interview Questions.pdf', 
    'Technical Interview Questions.pdf', 
    'Technical Placement Board', 
    583, 
    'PDF', 
    DATE_SUB(NOW(), INTERVAL 10 DAY)
),
(
    5, 
    'Data Structures Notes & Algorithm Patterns', 
    'Technical', 
    'Detailed notes on Linear and Non-Linear Data Structures, Tree traversals, Graph algorithms, Dynamic Programming, and Big-O complexity.', 
    'uploads/references/Data Structures Notes.pdf', 
    'Data Structures Notes.pdf', 
    'Competitive Programming Lead', 
    612, 
    'PDF', 
    DATE_SUB(NOW(), INTERVAL 9 DAY)
),
(
    6, 
    'Java Interview Questions & Concepts', 
    'Programming', 
    'Top Java interview questions covering OOP, Collections Framework, Multithreading, JVM Architecture, and modern Java 8+ features.', 
    'uploads/references/Java Interview Questions.pdf', 
    'Java Interview Questions.pdf', 
    'Enterprise Systems Architect', 
    495, 
    'PDF', 
    DATE_SUB(NOW(), INTERVAL 8 DAY)
),
(
    7, 
    'Python Interview Questions & Coding Tips', 
    'Programming', 
    'Essential Python interview preparation guide covering language internals, memory management, decorators, generators, and data structures.', 
    'uploads/references/Python Interview Questions.pdf', 
    'Python Interview Questions.pdf', 
    'Data Science & AI Mentor', 
    380, 
    'PDF', 
    DATE_SUB(NOW(), INTERVAL 7 DAY)
),
(
    8, 
    'Resume Writing Guide & ATS Blueprint', 
    'Resume', 
    'Step-by-step master guide for engineering students to build clean, high-impact, ATS-friendly resumes for top recruiters.', 
    'uploads/references/Resume Writing Guide.pdf', 
    'Resume Writing Guide.pdf', 
    'Career Development Cell', 
    720, 
    'PDF', 
    DATE_SUB(NOW(), INTERVAL 6 DAY)
),
(
    9, 
    'Group Discussion Tips & Frameworks', 
    'Group Discussion', 
    'Proven frameworks, opening/closing strategies, etiquette, and tactics to excel in placement group discussion rounds.', 
    'uploads/references/Group Discussion Tips.pdf', 
    'Group Discussion Tips.pdf', 
    'Soft Skills Training Division', 
    245, 
    'PDF', 
    DATE_SUB(NOW(), INTERVAL 5 DAY)
),
(
    10, 
    'HR Interview Questions & Winning Answers', 
    'HR Interview', 
    'Comprehensive guide to behavioral and HR interview rounds featuring the STAR method, common pitfalls, and sample answer structures.', 
    'uploads/references/HR Interview Questions.pdf', 
    'HR Interview Questions.pdf', 
    'Senior HR Placement Consultant', 
    534, 
    'PDF', 
    DATE_SUB(NOW(), INTERVAL 4 DAY)
),
(
    11, 
    'Campus Placement Preparation Blueprint', 
    'Placement Preparation', 
    'Comprehensive 4-phase preparation roadmap covering timeline, coding milestones, aptitude strategy, and mock interview schedule.', 
    'uploads/references/Placement Preparation Blueprint.pdf', 
    'Placement Preparation Blueprint.pdf', 
    'Dean of Training & Placement', 
    670, 
    'PDF', 
    DATE_SUB(NOW(), INTERVAL 3 DAY)
),
(
    12, 
    'Verbal Ability & Grammar Master Guide', 
    'Placement Preparation', 
    'Comprehensive verbal ability guide covering error spotting, subject-verb agreement, active/passive voice, idioms, and reading comprehension.', 
    'uploads/references/Verbal Ability Master Guide.pdf', 
    'Verbal Ability Master Guide.pdf', 
    'Verbal Training Department', 
    315, 
    'PDF', 
    DATE_SUB(NOW(), INTERVAL 1 DAY)
);

-- Recreate view
CREATE OR REPLACE VIEW `resources` AS SELECT * FROM `references`;
