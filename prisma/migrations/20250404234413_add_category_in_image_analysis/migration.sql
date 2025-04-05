/*
  Warnings:

  - Added the required column `category` to the `ImageAnalysis` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ImageAnalysis" ADD COLUMN     "category" TEXT NOT NULL;
