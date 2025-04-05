// src/tips/tips.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { TipsService } from './tips.service';

@Controller('tips')
export class TipsController {
  constructor(private readonly tipsService: TipsService) {}

  @Get('personalized')
  async getPersonalizedTips(@Query('userEmail') userEmail: string) {
    return await this.tipsService.getPersonalizedTips(userEmail);
  }
}
