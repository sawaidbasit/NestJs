/*
  Warnings:

  - You are about to drop the column `materialName` on the `ImageAnalysis` table. All the data in the column will be lost.
  - You are about to drop the column `origin` on the `ImageAnalysis` table. All the data in the column will be lost.
  - You are about to drop the column `properties` on the `ImageAnalysis` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `ImageAnalysis` table. All the data in the column will be lost.
  - You are about to drop the column `uses` on the `ImageAnalysis` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ImageAnalysis" DROP COLUMN "materialName",
DROP COLUMN "origin",
DROP COLUMN "properties",
DROP COLUMN "type",
DROP COLUMN "uses",
ADD COLUMN     "materials" JSONB NOT NULL DEFAULT '[]';
