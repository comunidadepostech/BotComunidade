/*
  Warnings:

  - Added the required column `event_id` to the `discord_event_warnings` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `discord_event_warnings` ADD COLUMN `event_id` VARCHAR(19) NOT NULL;
