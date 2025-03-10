import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ImageAnalysisService {
  constructor(private readonly prisma: PrismaService) {}

  // Save analysis result for a user
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
      const analysisResult = await this.prisma.imageAnalysis.create({
        data: {
          userId: user.id,
          materialName: data.materialName,
          type: data.type,
          properties: data.properties ?? null,
          origin: data.origin ?? null,
          uses: Array.isArray(data.uses) ? data.uses : [],
          imageUrl: data.imageUrl || "",
          description: data.description ?? "No description available",
          createdAt: new Date(),
        },
      });

      return analysisResult;

    } catch (error) {
      console.error('Error saving analysis result:', error);
      throw new HttpException('Error saving analysis result.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
