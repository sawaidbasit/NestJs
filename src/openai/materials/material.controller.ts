import { Controller, Get, Query, Param, Post, Body, BadRequestException, Delete, NotFoundException, InternalServerErrorException, ConflictException } from '@nestjs/common';
import { MaterialsService } from './material.service';

@Controller('materials')
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Get()
  async getMaterials(@Query('category') category?: string) { 
    if (!category) {
      return this.materialsService.getAllMaterials();
    }
    return this.materialsService.getMaterialsByCategory(category);
  }

  @Get('search')
  async searchMaterials(@Query('query') query: string) {
    return this.materialsService.searchMaterials(query);
  }

  @Get(':id')
  async getMaterialDetails(@Param('id') id: string) {
    return this.materialsService.getMaterialDetails(id);
  }

  @Post('favorite')
async addToFavorites(
  @Body('userEmail') userEmail: string,
  @Body('materialId') materialId: string,
) {
  if (!userEmail || !materialId) {
    throw new BadRequestException('User email and material ID are required');
  }

  try {
    return await this.materialsService.addToFavorites(userEmail, materialId);
  } catch (error) {
    console.error('Error in addToFavorites:', error.message);

    if (error.message.includes('User does not exist')) {
      throw new NotFoundException('User not found');
    }

    if (error.message.includes('Material does not exist')) {
      throw new NotFoundException('Material not found');
    }

    if (error.message.includes('already in favorites')) {
      throw new ConflictException('Material is already in favorites');
    }

    throw new InternalServerErrorException('Failed to add to favorites');
  }
}


@Delete('favorite')
async removeFromFavorites(
  @Body('userEmail') userEmail: string,
  @Body('materialId') materialId: string,
) {
  if (!userEmail || !materialId) {
    throw new BadRequestException('User email and material ID are required');
  }

  try {
    return await this.materialsService.removeFromFavorites(userEmail, materialId);
  } catch (error) {
    console.error('Error in removeFromFavorites:', error.message);

    if (error.message.includes('User does not exist')) {
      throw new NotFoundException('User not found');
    }

    if (error.message.includes('Material was not found in favorites')) {
      throw new NotFoundException('Material is not in favorites');
    }

    throw new InternalServerErrorException('Failed to remove favorite');
  }
}


}
