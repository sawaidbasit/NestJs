-- CreateTable
CREATE TABLE "ImageAnalysis" (
    "id" TEXT NOT NULL,
    "mainObject" TEXT NOT NULL,
    "material" TEXT,
    "quality" TEXT,
    "notableItems" TEXT[],
    "sceneDescription" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImageAnalysis_pkey" PRIMARY KEY ("id")
);
