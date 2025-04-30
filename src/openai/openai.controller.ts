import { Controller, Post, Get, Body, Query, NotFoundException, HttpException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { OpenAiService } from './openai.service';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Controller('openai')
export class OpenAiController {
  constructor(
    private readonly openAiService: OpenAiService,
    private readonly prisma: PrismaService
  ) {}

  @Post('analyze')
  async analyzeImage(
    @Body('imageBase64') imageBase64: string,
    @Body('email') email: string,
  ) {
    if (!imageBase64) {
      throw new HttpException('Image data is required', 400);
    }
    if (!email) {
      throw new HttpException('Email is required', 400);
    }

    const user = await this.prisma.user.findUnique({
      where: { email: email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const storedAccessToken = user.accessToken;

    if (!storedAccessToken) {
      throw new ForbiddenException('Access token not found for user');
    }

    try {
      const result = await this.openAiService.analyzeImage(imageBase64, email, storedAccessToken);
      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('❌ Unexpected error in analyzeImage:', error);

      throw new InternalServerErrorException(
        'Something went wrong while processing the image.',
      );
    }
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
