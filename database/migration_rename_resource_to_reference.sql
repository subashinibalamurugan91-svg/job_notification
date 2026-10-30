-- Migration Script: Rename RESOURCE to REFERENCE across Database
USE placement_db;

-- 1. Drop existing view if any
DROP VIEW IF EXISTS `resources_view`;

-- 2. Rename table resources to references
SET @table_exists = 0;
SELECT COUNT(*) INTO @table_exists 
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'placement_db' 
  AND TABLE_NAME = 'resources'
  AND TABLE_TYPE = 'BASE TABLE';

SET @stmt = IF(@table_exists > 0, 'RENAME TABLE `resources` TO `references`', 'SELECT "Table already renamed or not found"');
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. Rename columns resource_id -> reference_id and resource_type -> reference_type
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'placement_db' 
  AND TABLE_NAME = 'references' 
  AND COLUMN_NAME = 'resource_id';

SET @stmt = IF(@col_exists > 0, 'ALTER TABLE `references` CHANGE COLUMN `resource_id` `reference_id` INT AUTO_INCREMENT', 'SELECT "Column reference_id already exists"');
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col2_exists = 0;
SELECT COUNT(*) INTO @col2_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'placement_db' 
  AND TABLE_NAME = 'references' 
  AND COLUMN_NAME = 'resource_type';

SET @stmt2 = IF(@col2_exists > 0, 'ALTER TABLE `references` CHANGE COLUMN `resource_type` `reference_type` VARCHAR(100) NOT NULL DEFAULT \'PDF\'', 'SELECT "Column reference_type already exists"');
PREPARE stmt2 FROM @stmt2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- 4. Create compatibility view for resources to prevent any breaking changes
DROP VIEW IF EXISTS `resources`;
CREATE OR REPLACE VIEW `resources` AS
SELECT 
    `reference_id` AS `resource_id`,
    `company_id`,
    `title`,
    `description`,
    `file_url`,
    `reference_type` AS `resource_type`,
    `uploaded_at`
FROM `references`;
