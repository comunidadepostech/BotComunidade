/*
  Warnings:

  - You are about to drop the column `class` on the `polls` table. All the data in the column will be lost.
  - Added the required column `category` to the `polls` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `polls` DROP COLUMN `class`,
    ADD COLUMN `category` VARCHAR(30) NOT NULL;
