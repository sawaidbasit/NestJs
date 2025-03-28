import {
    Controller,
    Get,
    Query,
    BadRequestException,
    Post,
    Body,
    NotFoundException,
    ConflictException,
    InternalServerErrorException,
    Delete,
  } from '@nestjs/common';
  import { FavoriteService } from './favorite.service';
  
  @Controller('favorites')
  export class FavoritesController {
    constructor(private readonly favoritesService: FavoriteService) {}
  
    @Get()
    async getFavorites(@Query('userEmail') userEmail: string) {
  
      if (!userEmail) {
        throw new BadRequestException('User email is required');
      }
  
      try {
        const favorites = await this.favoritesService.getFavorites(userEmail);
        return favorites;
      } catch (error) {
        console.error('🔴 Error in getFavorites:', error.message);
        throw new InternalServerErrorException('Failed to get favorites');
      }
    }
  
    @Post()
    async addToFavorites(
      @Body('userEmail') userEmail: string,
      @Body('materialId') materialId: string,
    ) {
  
      if (!userEmail || !materialId) {
        console.log('🔴 Missing required fields!');
        throw new BadRequestException('User email and material ID are required');
      }
  
      try {
        return await this.favoritesService.addToFavorites(userEmail, materialId);
      } catch (error) {
        console.error('🔴 Error in addToFavorites:', error.message);
  
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
  
    @Delete()
    async removeFromFavorites(
      @Body('userEmail') userEmail: string,
      @Body('materialId') materialId: string,
    ) {
  
      if (!userEmail || !materialId) {
        throw new BadRequestException('User email and material ID are required');
      }
  
      try {
        return await this.favoritesService.removeFromFavorites(userEmail, materialId);
      } catch (error) {
        console.error('🔴 Error in removeFromFavorites:', error.message);
  
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
  