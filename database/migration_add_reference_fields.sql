USE placement_db;

-- Add columns using stored procedure to safely ignore if they already exist
DROP PROCEDURE IF EXISTS AddReferenceColumns;
DELIMITER //
CREATE PROCEDURE AddReferenceColumns()
BEGIN
    IF NOT EXISTS (
        SELECT * FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = 'placement_db' AND TABLE_NAME = 'references' AND COLUMN_NAME = 'category'
    ) THEN
        ALTER TABLE `references` ADD COLUMN `category` VARCHAR(100) NOT NULL DEFAULT 'Placement Preparation' AFTER `title`;
    END IF;

    IF NOT EXISTS (
        SELECT * FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = 'placement_db' AND TABLE_NAME = 'references' AND COLUMN_NAME = 'file_name'
    ) THEN
        ALTER TABLE `references` ADD COLUMN `file_name` VARCHAR(255) NULL AFTER `file_url`;
    END IF;

    IF NOT EXISTS (
        SELECT * FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = 'placement_db' AND TABLE_NAME = 'references' AND COLUMN_NAME = 'uploaded_by'
    ) THEN
        ALTER TABLE `references` ADD COLUMN `uploaded_by` VARCHAR(100) DEFAULT 'Placement Cell' AFTER `file_name`;
    END IF;

    IF NOT EXISTS (
        SELECT * FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = 'placement_db' AND TABLE_NAME = 'references' AND COLUMN_NAME = 'download_count'
    ) THEN
        ALTER TABLE `references` ADD COLUMN `download_count` INT NOT NULL DEFAULT 0 AFTER `uploaded_by`;
    END IF;
END //
DELIMITER ;

CALL AddReferenceColumns();
DROP PROCEDURE IF EXISTS AddReferenceColumns;

-- Update existing rows
UPDATE `references` SET 
    `category` = 'Aptitude', 
    `file_name` = 'general_aptitude_prep.pdf',
    `uploaded_by` = 'TPO Placement Cell',
    `download_count` = 142
WHERE `reference_id` = 1;

UPDATE `references` SET 
    `category` = 'Technical', 
    `file_name` = 'google_dsa_cheatsheet.pdf',
    `uploaded_by` = 'Technical Mentorship Club',
    `download_count` = 285
WHERE `reference_id` = 2;

UPDATE `references` SET 
    `category` = 'Technical', 
    `file_name` = 'system_design_primer.pdf',
    `uploaded_by` = 'Senior Placement Coordinators',
    `download_count` = 194
WHERE `reference_id` = 3;

UPDATE `references` SET 
    `category` = 'Technical', 
    `file_name` = 'tesla_mech_standards.pdf',
    `uploaded_by` = 'Mechanical Department TPO',
    `download_count` = 97
WHERE `reference_id` = 4;

-- Refresh view
CREATE OR REPLACE VIEW `resources` AS SELECT * FROM `references`;
