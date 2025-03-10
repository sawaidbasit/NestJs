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

@Module({
  imports: [
    AuthModule,
    OpenAiModule,
    ImageAnalysisModule,
    PrismaModule,
    EmailModule,
    ScheduleModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'client'),
    }),
  ],
  controllers: [HomeController, OpenAiController],
})
export class AppModule {}
