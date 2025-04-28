-- AlterTable
ALTER TABLE "User" ADD COLUMN     "accessTokenExpiredTime" TIMESTAMP(3),
ADD COLUMN     "refreshAccessToken" TEXT;
