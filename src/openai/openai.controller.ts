import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { OpenAiService } from './openai.service';

@Controller('openai')
export class OpenAiController {
  constructor(private readonly openAiService: OpenAiService) {}

  @Post('analyze')
  async analyzeImage(
    @Body('imageBase64') imageBase64: string,
    @Body('email') email: string,
  ) {
    if (!imageBase64) {
      return { error: 'Image data is required' };
    }
    if (!email) {
      return { error: 'Email is required' };
    }

    return this.openAiService.analyzeImage(imageBase64, email);
  }

  // ✅ New GET API to fetch analysis results by email
  @Get('analysis')
  async getAnalysis(@Query('email') email: string) {
    if (!email) {
      return { error: 'Email is required' };
    }

    return this.openAiService.getAnalysisByEmail(email);
  }
}
