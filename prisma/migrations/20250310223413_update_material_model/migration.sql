/*
  Warnings:

  - The `materialOrigins` column on the `Material` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `materialProperties` column on the `Material` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Material" ALTER COLUMN "materialImage" DROP NOT NULL,
DROP COLUMN "materialOrigins",
ADD COLUMN     "materialOrigins" TEXT[],
DROP COLUMN "materialProperties",
ADD COLUMN     "materialProperties" TEXT[];
