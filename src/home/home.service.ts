import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HomeService {
  constructor(private prisma: PrismaService) {}

  async getRandomMaterials() {
    const allMaterials = await this.prisma.material.findMany(); 
    const shuffled = allMaterials.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  }
}
