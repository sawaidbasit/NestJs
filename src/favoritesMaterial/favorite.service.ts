import { Injectable, HttpStatus, HttpException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Correct path

@Injectable()
export class FavoriteService {
  constructor(private prisma: PrismaService) {}

  // ➤ Add Material to Favorites
  async addToFavorites(userEmail: string, materialId: string, accessToken: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { accessToken },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.accessToken !== accessToken) {
      throw new Error('Invalid access token');
    }

    if (!user.isPremium && user.isTrialLimitExceeded) {
      return { error: 'Access denied. Premium membership required.' };
    }
    try {
      console.log(`🟢 Adding to favorites: User(${userEmail}) - Material(${materialId})`);

      // ✅ Check if user exists
      const user = await this.prisma.user.findUnique({
        where: { email: userEmail },
        select: { email: true },
      });

      if (!user) {
        console.log('❌ User not found:', userEmail);
        throw new HttpException('User does not exist', HttpStatus.NOT_FOUND);
      }

      // ✅ Check if material exists
      const material = await this.prisma.material.findUnique({
        where: { id: materialId },
        select: { id: true },
      });

      if (!material) {
        console.log('❌ Material not found:', materialId);
        throw new HttpException('Material does not exist', HttpStatus.NOT_FOUND);
      }

      // ✅ Check if already in favorites
      const existingFavorite = await this.prisma.favorite.findFirst({
        where: { userEmail: user.email, materialId },
      });

      if (existingFavorite) {
        console.log('⚠️ Material already in favorites:', materialId);
        throw new HttpException('Material is already in favorites', HttpStatus.CONFLICT);
      }

      // ✅ Add to favorites
      const favorite = await this.prisma.favorite.create({
        data: { userEmail: user.email, materialId },
      });

      console.log('✅ Material added to favorites:', favorite);
      return {
        statusCode: HttpStatus.CREATED,
        message: 'Material added to favorites successfully',
        data: favorite,
      };
    } catch (error) {
      console.error('🔴 Error in addToFavorites:', error.message);
      throw new HttpException(error.message || 'Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // ➤ Remove Material from Favorites
  async removeFromFavorites(userEmail: string, materialId: string) {
    try {
      console.log(`🟢 Removing from favorites: User(${userEmail}) - Material(${materialId})`);

      // ✅ Check if user exists
      const user = await this.prisma.user.findUnique({
        where: { email: userEmail },
        select: { email: true },
      });

      if (!user) {
        console.log('❌ User not found:', userEmail);
        throw new HttpException('User does not exist', HttpStatus.NOT_FOUND);
      }

      // ✅ Delete favorite material
      const deleted = await this.prisma.favorite.deleteMany({
        where: { userEmail: user.email, materialId },
      });

      if (deleted.count === 0) {
        console.log('❌ Material was not found in favorites:', materialId);
        throw new HttpException('Material was not found in favorites', HttpStatus.NOT_FOUND);
      }

      console.log('✅ Material removed from favorites:', materialId);
      return {
        statusCode: HttpStatus.OK,
        message: 'Material removed from favorites successfully',
      };
    } catch (error) {
      console.error('🔴 Error in removeFromFavorites:', error.message);
      throw new HttpException(error.message || 'Failed to remove favorite', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // ➤ Get All Favorites of User
  async getFavorites(userEmail: string) {
    try {

      const favorites = await this.prisma.favorite.findMany({
        where: { userEmail },
        include: { material: true },
      });

      if (!favorites || favorites.length === 0) {
        return {
          statusCode: HttpStatus.OK,
          message: 'No materials found in favorites',
          data: [],
        };
      }

      return {
        statusCode: HttpStatus.OK,
        message: 'Favorites fetched successfully',
        data: favorites,
      };
    } catch (error) {
      console.error('🔴 Error in getFavorites:', error.message);
      throw new HttpException(error.message || 'Failed to fetch favorites', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }


}
