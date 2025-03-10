import { Controller, Post, Body } from '@nestjs/common';
import { ImageAnalysisService } from './image-analysis.service';

@Controller('image-analysis')
export class ImageAnalysisController {
  constructor(private readonly imageAnalysisService: ImageAnalysisService) {}

  @Post('save')
  async saveAnalysis(@Body() data: any) {
    return this.imageAnalysisService.saveAnalysisResult(data);
  }
}
