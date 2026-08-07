/*
  Warnings:

  - You are about to drop the column `class` on the `interactions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `interactions` 
    CHANGE COLUMN `class` `category` VARCHAR(30) NULL;
