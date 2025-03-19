import { Injectable, HttpStatus, HttpException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Correct path

@Injectable()
export class MaterialsService {
  constructor(private prisma: PrismaService) {}

  async getAllMaterials() {
    return this.prisma.material.findMany();
  }

  async searchMaterials(query: string) {
    return this.prisma.material.findMany({
      where: {
        OR: [
          { materialName: { contains: query, mode: 'insensitive' } },
          { materialType: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
    });
  }

  async getMaterialDetails(id: string) {
    return this.prisma.material.findUnique({
      where: { id },
      include: { imageAnalysis: true },
    });
  }

  async getMaterialsByCategory(category: string) {
    return this.prisma.material.findMany({
      where: {
        category: { equals: category, mode: 'insensitive' },
      },
    });
  }
}
