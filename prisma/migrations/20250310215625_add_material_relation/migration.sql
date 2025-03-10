/*
  Warnings:

  - You are about to drop the column `materials` on the `ImageAnalysis` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `Material` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Material` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Material` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `Material` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Material` table. All the data in the column will be lost.
  - Added the required column `imageAnalysisId` to the `Material` table without a default value. This is not possible if the table is not empty.
  - Added the required column `materialImage` to the `Material` table without a default value. This is not possible if the table is not empty.
  - Added the required column `materialName` to the `Material` table without a default value. This is not possible if the table is not empty.
  - Added the required column `materialOrigins` to the `Material` table without a default value. This is not possible if the table is not empty.
  - Added the required column `materialProperties` to the `Material` table without a default value. This is not possible if the table is not empty.
  - Added the required column `materialType` to the `Material` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ImageAnalysis" DROP COLUMN "materials";

-- AlterTable
ALTER TABLE "Material" DROP COLUMN "category",
DROP COLUMN "createdAt",
DROP COLUMN "description",
DROP COLUMN "imageUrl",
DROP COLUMN "name",
ADD COLUMN     "imageAnalysisId" TEXT NOT NULL,
ADD COLUMN     "materialImage" TEXT NOT NULL,
ADD COLUMN     "materialName" TEXT NOT NULL,
ADD COLUMN     "materialOrigins" TEXT NOT NULL,
ADD COLUMN     "materialProperties" TEXT NOT NULL,
ADD COLUMN     "materialType" TEXT NOT NULL,
ADD COLUMN     "usesOfMaterial" TEXT[];

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_imageAnalysisId_fkey" FOREIGN KEY ("imageAnalysisId") REFERENCES "ImageAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;
