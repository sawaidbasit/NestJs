import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ImageAnalysisService {
  constructor(private readonly prisma: PrismaService) {}

  async saveAnalysisResult(data: any) {
    return this.prisma.imageAnalysis.create({ // Use "imageAnalysis" in lowercase
      data: {
        mainObject: data.mainObject,
        material: data.material ?? null,
        quality: data.quality ?? null,
        notableItems: data.notableItems,
        sceneDescription: data.sceneDescription,
      },
    });
  }
}
