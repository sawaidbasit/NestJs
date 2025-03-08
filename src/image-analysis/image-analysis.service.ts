import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ImageAnalysisService {
  constructor(private readonly prisma: PrismaService) {}

  async saveAnalysisResult(data: any) {
    console.log("Received Data:", data);

    if (!data.email) {
      throw new Error("Email is required!");
    }

    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new Error("User not found!");
    }

    return this.prisma.imageAnalysis.create({
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
  }
}
