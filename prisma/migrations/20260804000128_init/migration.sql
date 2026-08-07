-- CreateTable
CREATE TABLE `classes` (
    `class` VARCHAR(100) NOT NULL,
    `quantity` SMALLINT UNSIGNED NULL,
    `guild_name` VARCHAR(100) NOT NULL,

    UNIQUE INDEX `class`(`class`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `command_hashes` (
    `command_name` VARCHAR(255) NOT NULL,
    `file_hash` VARCHAR(64) NOT NULL,

    PRIMARY KEY (`command_name`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `discord_event_warnings` (
    `message_id` VARCHAR(19) NOT NULL,
    `channel_id` VARCHAR(19) NOT NULL,

    PRIMARY KEY (`message_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `featureFlags` (
    `guild_id` VARCHAR(22) NOT NULL,
    `flags` JSON NULL,

    PRIMARY KEY (`guild_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `guilds` (
    `guild_id` VARCHAR(19) NOT NULL,
    `guild_name` VARCHAR(100) NOT NULL,
    `clusters` VARCHAR(255) NULL,

    PRIMARY KEY (`guild_name`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `interactions` (
    `message_id` VARCHAR(30) NOT NULL,
    `guild_name` VARCHAR(100) NOT NULL,
    `class` VARCHAR(7) NOT NULL,
    `role_name` VARCHAR(100) NULL,
    `user_name` VARCHAR(32) NOT NULL,
    `channel_name` VARCHAR(100) NULL,
    `message` VARCHAR(2000) NOT NULL,
    `thread_name` VARCHAR(100) NULL,
    `dt` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `id` INTEGER NOT NULL AUTO_INCREMENT,

    INDEX `idx_message_id`(`message_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `online_members` (
    `dt` DATETIME(0) NOT NULL,
    `quantity` SMALLINT UNSIGNED NOT NULL,

    PRIMARY KEY (`dt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `polls` (
    `poll_hash` VARCHAR(40) NULL,
    `guild_name` VARCHAR(100) NOT NULL,
    `class` VARCHAR(7) NOT NULL,
    `poll_question` VARCHAR(300) NOT NULL,
    `response1_text` VARCHAR(55) NOT NULL,
    `response1_value` SMALLINT UNSIGNED NOT NULL,
    `response2_text` VARCHAR(55) NOT NULL,
    `response2_value` SMALLINT UNSIGNED NOT NULL,
    `response3_text` VARCHAR(55) NULL,
    `response3_value` SMALLINT UNSIGNED NULL,
    `response4_text` VARCHAR(55) NULL,
    `response4_value` SMALLINT UNSIGNED NULL,
    `response5_text` VARCHAR(55) NULL,
    `response5_value` SMALLINT UNSIGNED NULL,
    `response6_text` VARCHAR(55) NULL,
    `response6_value` SMALLINT UNSIGNED NULL,
    `response7_text` VARCHAR(55) NULL,
    `response7_value` SMALLINT UNSIGNED NULL,
    `response8_text` VARCHAR(55) NULL,
    `response8_value` SMALLINT UNSIGNED NULL,
    `response9_text` VARCHAR(55) NULL,
    `response9_value` SMALLINT UNSIGNED NULL,
    `response10_text` VARCHAR(55) NULL,
    `response10_value` SMALLINT UNSIGNED NULL,
    `dt` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `id` INTEGER NOT NULL AUTO_INCREMENT,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `zoom_meetings` (
    `title` VARCHAR(200) NOT NULL,
    `department` VARCHAR(50) NULL,
    `duration_in_minutes` SMALLINT UNSIGNED NOT NULL,
    `host_email` VARCHAR(254) NOT NULL,
    `metting_creation_source` VARCHAR(100) NOT NULL,
    `metting_group` VARCHAR(200) NULL,
    `created_at` TIMESTAMP(0) NOT NULL,
    `started_at` TIMESTAMP(0) NOT NULL,
    `ended_at` TIMESTAMP(0) NOT NULL,
    `meeting_id` CHAR(11) NOT NULL,
    `max_simultaneous_views` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    `host_name` VARCHAR(100) NULL,
    `max_entries` SMALLINT UNSIGNED NOT NULL,
    `meeting_type` VARCHAR(7) NOT NULL,
    `max_unique_views` SMALLINT UNSIGNED NOT NULL,
    `place` VARCHAR(100) NULL,
    `total_participants_minutes` SMALLINT UNSIGNED NOT NULL,

    PRIMARY KEY (`meeting_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
