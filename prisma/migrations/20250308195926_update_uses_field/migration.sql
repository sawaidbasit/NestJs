/*
  Warnings:

  - You are about to drop the column `mainObject` on the `ImageAnalysis` table. All the data in the column will be lost.
  - You are about to drop the column `material` on the `ImageAnalysis` table. All the data in the column will be lost.
  - You are about to drop the column `notableItems` on the `ImageAnalysis` table. All the data in the column will be lost.
  - You are about to drop the column `quality` on the `ImageAnalysis` table. All the data in the column will be lost.
  - You are about to drop the column `sceneDescription` on the `ImageAnalysis` table. All the data in the column will be lost.
  - Added the required column `materialName` to the `ImageAnalysis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `ImageAnalysis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `uses` to the `ImageAnalysis` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ImageAnalysis" DROP COLUMN "mainObject",
DROP COLUMN "material",
DROP COLUMN "notableItems",
DROP COLUMN "quality",
DROP COLUMN "sceneDescription",
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "materialName" TEXT NOT NULL,
ADD COLUMN     "origin" TEXT,
ADD COLUMN     "properties" TEXT,
ADD COLUMN     "type" TEXT NOT NULL,
ADD COLUMN     "uses" JSONB NOT NULL;
