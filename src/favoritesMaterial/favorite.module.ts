import { Module } from '@nestjs/common';
import { FavoritesController } from './favorite.controller';
import { FavoriteService } from './favorite.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [FavoritesController],
  providers: [FavoriteService, PrismaService],
  exports: [FavoriteService],
})
export class FavoriteModule {}
