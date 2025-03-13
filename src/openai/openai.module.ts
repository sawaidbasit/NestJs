import { Module } from '@nestjs/common';
import { OpenAiService } from './openai.service';
import { ImageAnalysisModule } from '../image-analysis/image-analysis.module';
import { PrismaModule } from '../prisma/prisma.module'; // 👈 Import PrismaModule
import { MaterialsModule } from './materials/material.module';

@Module({
  imports: [ImageAnalysisModule, PrismaModule, MaterialsModule],
  providers: [OpenAiService],
  exports: [OpenAiService], 
})
export class OpenAiModule {}
