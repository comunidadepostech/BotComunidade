/*
  Warnings:

  - Made the column `channel_name` on table `interactions` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `interactions` MODIFY `channel_name` VARCHAR(100) NOT NULL;
