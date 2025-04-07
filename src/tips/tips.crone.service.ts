import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TipsService } from './tips.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TipsCronService {
  constructor(
    private tipsService: TipsService,
    private prisma: PrismaService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyTipsGeneration() {
    const users = await this.prisma.user.findMany();

    for (const user of users) {
      const tips = await this.tipsService.getPersonalizedTips(user.email);
      console.log(`✅ Saved tips for ${user.email}`);
    }
  }
}
