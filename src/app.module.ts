import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { HomeController } from './home/home.controller';
import { EmailModule } from './email/email.module';
import { ScheduleModule } from '@nestjs/schedule';
import { OpenAiModule } from './openai/openai.module';
import { ImageAnalysisModule } from './image-analysis/image-analysis.module';
import { OpenAiController } from './openai/openai.controller';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { HomeModule } from './home/home.module';
import { MaterialsController } from './materials/material.controller';
import { MaterialsModule } from './materials/material.module';
import { FavoriteModule } from './favoritesMaterial/favorite.module';

@Module({
  imports: [
    HomeModule,
    AuthModule,
    OpenAiModule,
    MaterialsModule,
    FavoriteModule,
    ImageAnalysisModule,
    PrismaModule,
    EmailModule,
    ScheduleModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'client'),
    }),
  ],
  controllers: [HomeController, OpenAiController, MaterialsController],
})
export class AppModule {}
