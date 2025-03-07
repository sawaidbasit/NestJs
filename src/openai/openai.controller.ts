import { Controller, Post, Body } from '@nestjs/common';
import { OpenAiService } from './openai.service';

@Controller('openai')
export class OpenAiController {
  constructor(private readonly openAiService: OpenAiService) {}

  @Post('analyze')
  async analyzeImage(@Body('imageBase64') imageBase64: string) {
    if (!imageBase64) {
      return { error: 'Image data is required' };
    }
    return this.openAiService.analyzeImage(imageBase64);
  }
}
