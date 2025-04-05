import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

@Injectable()
export class TipsService {
  constructor(
    private prisma: PrismaService,
    private httpService: HttpService,
  ) {}

  private openAiKey = process.env.OPENAI_API_KEY;

  async getPersonalizedTips(userEmail: string): Promise<any[]> {
    const topCategories = await this.getTopCategoriesForUser(userEmail);
    const tips: any[] = [];

    const topCategory = topCategories[0]; 

    const firstTip = await this.generateTip(topCategory, 1);
    const secondTip = await this.generateTip(topCategory, 2);

    const materials = await this.getMaterialsForCategory(topCategory);

    const firstTipImageUrl = await this.generateImage(topCategory);
    const savedImagePath1 = await this.saveImageToLocalServer(
      firstTipImageUrl,
      topCategory,
      userEmail,
      Date.now(),
    );

    const secondTipImageUrl = await this.generateImage(topCategory);
    const savedImagePath2 = await this.saveImageToLocalServer(
      secondTipImageUrl,
      topCategory,
      userEmail,
      Date.now(),
    );

    tips.push({
      category: topCategory,
      imageUrl: savedImagePath1,
      tip: firstTip,
      materials,
    });

    tips.push({
      category: topCategory,
      imageUrl: savedImagePath2,
      tip: secondTip,
      materials,
    });

    return tips;
  }

  private async saveImageToLocalServer(
    imageUrl: string,
    category: string,
    email: string,
    timestamp: number,
  ): Promise<string | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        console.error(`❌ User not found for email: ${email}`);
        return null;
      }

      const userDir = path.join(__dirname, `../../public/images/`);
      const imagePath = path.join(userDir, `${timestamp}_${category}.png`);

      if (!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir, { recursive: true });
      }

      const writer = fs.createWriteStream(imagePath);
      const response = await axios({
        url: imageUrl,
        method: 'GET',
        responseType: 'stream',
      });

      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          resolve(`/images/${timestamp}_${category}.png`);
        });
        writer.on('error', (err) => {
          console.error(`❌ Error saving image:`, err);
          reject(null);
        });
      });
    } catch (error) {
      console.error(`❌ Failed to download and save image:`, error);
      return null;
    }
  }

  private async getTopCategoriesForUser(userEmail: string): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { email: userEmail },
      include: {
        imageAnalyses: {
          include: {
            materials: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const categories = user.imageAnalyses
      .map((analysis) => analysis.category) 
      .filter((category): category is string => category !== null); 
    return categories.length > 0 ? categories : ['kitchen', 'living room'];
  }

  private async getMaterialsForCategory(category: string): Promise<any[]> {
    const materials = await this.prisma.material.findMany({
      where: { category },
    });


    return materials.map((material) => ({
      materialName: material.materialName,
      materialType: material.materialType,
      category: material.category,
      materialProperties: material.materialProperties,
      materialOrigins: material.materialOrigins,
      usesOfMaterial: material.usesOfMaterial,
      materialImage: material.materialImage,
      description: material.description,
    }));
  }

  private async generateTip(
    category: string,
    tipNumber: number,
  ): Promise<{ title: string; description: string }> {

    const normalizedCategory = category.trim().toLowerCase();

    if (normalizedCategory === 'kitchen') {
      if (tipNumber === 1) {
        return {
          title: 'How to style your kitchen to your personality',
          description:
            'Transform your kitchen into a functional and stylish space that reflects your unique style. Use bold colors, patterns, and personalized decor to make it feel truly yours.',
        };
      } else if (tipNumber === 2) {
        return {
          title: 'Maximize kitchen space with smart storage solutions',
          description:
            'Optimize your kitchen’s layout with smart storage options like pull-out cabinets, vertical shelves, and multi-functional furniture to keep everything organized and within reach.',
        };
      }
    }

    return {
      title: `Tip for ${category}`,
      description: `Keep your ${category} clean and functional.`,
    };
  }

  private async generateImage(category: string): Promise<string> {
    const prompt = `A modern, aesthetic interior design image of a ${category} space`;

    const response = await this.httpService.post(
      'https://api.openai.com/v1/images/generations',
      {
        prompt,
        n: 1,
        size: '1024x1024',
      },
      {
        headers: {
          Authorization: `Bearer ${this.openAiKey}`,
          'Content-Type': 'application/json',
        },
      },
    );

    return (await lastValueFrom(response)).data.data[0].url || '';
  }
}
