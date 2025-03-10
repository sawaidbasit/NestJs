import { Module } from '@nestjs/common';
import { OpenAiService } from './openai.service';
import { ImageAnalysisModule } from '../image-analysis/image-analysis.module';
import { PrismaModule } from '../prisma/prisma.module'; // 👈 Import PrismaModule

@Module({
  imports: [ImageAnalysisModule, PrismaModule],
  providers: [OpenAiService],
  exports: [OpenAiService], 
})
export class OpenAiModule {}
