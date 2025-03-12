/*
  Warnings:

  - You are about to drop the column `description` on the `ImageAnalysis` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ImageAnalysis" DROP COLUMN "description";

-- AlterTable
ALTER TABLE "Material" ADD COLUMN     "description" TEXT NOT NULL DEFAULT 'No description available';
