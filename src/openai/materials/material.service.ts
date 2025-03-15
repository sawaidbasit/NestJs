import { Injectable, HttpStatus, HttpException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service'; // Correct path

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
        category: { equals: category, mode: 'insensitive' }
      },
    });
}

async addToFavorites(userEmail: string, materialId: string) {
  try {
    // ✅ Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { email: userEmail },
      select: { email: true },
    });

    if (!user) {
      throw new HttpException("User does not exist", HttpStatus.NOT_FOUND);
    }

    // ✅ Check if material exists
    const material = await this.prisma.material.findUnique({
      where: { id: materialId },
      select: { id: true },
    });

    if (!material) {
      throw new HttpException("Material does not exist", HttpStatus.NOT_FOUND);
    }

    // ✅ Check if already in favorites
    const existingFavorite = await this.prisma.favorite.findFirst({
      where: { userEmail: user.email, materialId },
    });

    if (existingFavorite) {
      throw new HttpException("Material is already in favorites", HttpStatus.CONFLICT);
    }

    // ✅ Add to favorites
    return await this.prisma.favorite.create({
      data: { userEmail: user.email, materialId },
    });
  } catch (error) {
    console.error("Error in addToFavorites:", error.message);
    throw new HttpException(error.message || "Internal server error", HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

async removeFromFavorites(userEmail: string, materialId: string) {
  try {
    const user = await this.prisma.user.findUnique({
      where: { email: userEmail },
      select: { email: true },
    });

    if (!user) {
      throw new HttpException("User does not exist", HttpStatus.NOT_FOUND);
    }

    const deleted = await this.prisma.favorite.deleteMany({
      where: { userEmail: user.email, materialId },
    });

    if (deleted.count === 0) {
      throw new HttpException("Material was not found in favorites", HttpStatus.NOT_FOUND); 
    }

    return {
      statusCode: HttpStatus.OK,
      message: "Material removed from favorites successfully",
    };
  } catch (error) {
    console.error("Error in removeFromFavorites:", error.message);
    throw new HttpException(error.message || "Failed to remove favorite", HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

}
