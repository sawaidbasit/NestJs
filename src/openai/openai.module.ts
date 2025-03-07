import { Module } from '@nestjs/common';
import { OpenAiService } from './openai.service';
import { ImageAnalysisModule } from '../image-analysis/image-analysis.module';

@Module({
  imports: [ImageAnalysisModule],
  providers: [OpenAiService],
  exports: [OpenAiService], 
})
export class OpenAiModule {}
