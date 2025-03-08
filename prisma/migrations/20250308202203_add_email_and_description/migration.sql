/*
  Warnings:

  - Added the required column `description` to the `ImageAnalysis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `ImageAnalysis` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ImageAnalysis" ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "email" TEXT NOT NULL;
