import { Controller, Post, Body } from '@nestjs/common';
import { OpenAiService } from './openai.service';

@Controller('openai')
export class OpenAiController {
  constructor(private readonly openAiService: OpenAiService) {}

  @Post('analyze')
  async analyzeImage(
    @Body('imageBase64') imageBase64: string,
    @Body('email') email: string,  // Added email field here
  ) {
    if (!imageBase64) {
      return { error: 'Image data is required' };
    }

    if (!email) {
      return { error: 'Email is required' };  // Add validation for email
    }

    return this.openAiService.analyzeImage(imageBase64, email); // Pass email to service method
  } 
}
