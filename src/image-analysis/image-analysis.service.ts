import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ImageAnalysisService {
  constructor(private readonly prisma: PrismaService) {}

  // ✅ Add the function here
  async saveAnalysisResult(data: any) {
    if (!data.email) {
      throw new HttpException('Email is required!', HttpStatus.BAD_REQUEST);
    }

    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      console.error(`User with email ${data.email} not found.`);
      throw new HttpException('User not found!', HttpStatus.NOT_FOUND);
    }

    try {
      // 1️⃣ Save image analysis
      const analysisResult = await this.prisma.imageAnalysis.create({
        data: {
          userId: user.id,
          imageUrl: data.imageUrl || "",
          createdAt: new Date(),
        },
      });

      // 2️⃣ Save materials separately
      if (Array.isArray(data.materials) && data.materials.length > 0) {
        const materialsData = data.materials.map((material) => ({
          materialName: material.materialName,
          description: data.description ?? "No description available",
          materialType: material.materialType,
          materialProperties: JSON.stringify(material.materialProperties || []),
          materialOrigin: material.materialOrigin || "Unknown",
          uses: JSON.stringify(material.uses || []),
          materialImage: material.materialImage || "",
          imageAnalysisId: analysisResult.id, // Linking to ImageAnalysis
        }));

        await this.prisma.material.createMany({ data: materialsData });
      }

      return analysisResult;

    } catch (error) {
      console.error('Error saving analysis result:', error);
      throw new HttpException('Error saving analysis result.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  
}
