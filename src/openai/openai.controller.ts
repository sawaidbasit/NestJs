import { Controller, Post, Get, Body, Query, NotFoundException } from '@nestjs/common';
import { OpenAiService } from './openai.service';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Controller('openai')
export class OpenAiController {
  constructor(
    private readonly openAiService: OpenAiService, 
    private readonly prisma: PrismaService) {}


  @Post('analyze')
  async analyzeImage(
    @Body('imageBase64') imageBase64: string,
    @Body('email') email: string,
  ) {

    const user = await this.prisma.user.findUnique({
      where: { email: email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!imageBase64) {
      return { statusCode: 400, message: 'Image data is required' };
    }
    if (!email) {
      return { statusCode: 400, message: 'Email is required' };
    }

    try {
      const result = await this.openAiService.analyzeImage(imageBase64, email);
      return result;
    } catch (error) {
      console.error('❌ Error in analyzeImage:', error.message);

      return {  
        statusCode: 500,
        message: 'Something went wrong while processing the image.',
      };
    }
  }
}
