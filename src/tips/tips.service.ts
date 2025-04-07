import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class TipsService {
  constructor(
    private prisma: PrismaService,
    private httpService: HttpService,
  ) {}

  private openAiKey = process.env.OPENAI_API_KEY;
  private isCronJobRunning = false;

  @Cron('0 0 * * *')
  async refreshDailyTips() {
    if (this.isCronJobRunning) {
      console.log('❌ Cron job is already running, skipping...');
      return;
    }

    this.isCronJobRunning = true;
    try {
      console.log('🕒 Running daily tips update job...');

      const users = await this.prisma.user.findMany();
      console.log(`Found ${users.length} users to process.`);

      for (const user of users) {
        const userEmail = user.email;
        console.log(`Processing tips for user: ${userEmail}`);

        const topCategories = await this.getTopCategoriesForUser(userEmail);

        if (topCategories.length === 0) {
          console.log(`No categories found for user ${userEmail}, skipping...`);
          continue;
        }

        const topCategory = topCategories[0];
        console.log(`Top category for user ${userEmail}: ${topCategory}`);

        // Debugging: Log existing tips for the category before deleting
        const existingTipsBeforeDelete = await this.prisma.tip.findMany({
          where: {
            userEmail,
            category: topCategory,
          },
        });
        console.log(
          `Existing tips for category ${topCategory}:`,
          existingTipsBeforeDelete,
        );

        // Delete existing tips for this category and user
        console.log(
          `Deleting existing tips for category ${topCategory} of user ${userEmail}`,
        );
        const deletedTips = await this.prisma.tip.deleteMany({
          where: {
            userEmail,
            category: topCategory,
          },
        });

        console.log(
          `Deleted ${deletedTips.count} existing tips for category ${topCategory}`,
        );

        try {
          // Generate new tips for the user
          console.log(
            `✨ Generating new tips for ${userEmail} - ${topCategory}`,
          );
          const firstTip = await this.generateTip(topCategory, 1);
          const secondTip = await this.generateTip(topCategory, 2);

          const firstImageUrl = await this.generateImage(topCategory);
          const secondImageUrl = await this.generateImage(topCategory);

          const timestamp1 = Date.now();
          const savedImagePath1 = await this.saveImageToLocalServer(
            firstImageUrl,
            topCategory,
            userEmail,
            timestamp1,
          );

          const timestamp2 = timestamp1 + 1;
          const savedImagePath2 = await this.saveImageToLocalServer(
            secondImageUrl,
            topCategory,
            userEmail,
            timestamp2,
          );

          // Save the new tips and replace old ones
          console.log(`Saving new tips for ${userEmail} - ${topCategory}`);
          await this.prisma.tip.create({
            data: {
              title: firstTip.title,
              description: firstTip.description,
              image: savedImagePath1 ?? '',
              category: topCategory,
              userEmail,
            },
          });

          await this.prisma.tip.create({
            data: {
              title: secondTip.title,
              description: secondTip.description,
              image: savedImagePath2 ?? '',
              category: topCategory,
              userEmail,
            },
          });

          console.log(`✅ Updated tips for ${userEmail} - ${topCategory}`);
        } catch (err) {
          console.error(`❌ Failed to update tips for ${userEmail}:`, err);
        }
      }
    } catch (err) {
      console.error('❌ Error during Cron job execution:', err);
    } finally {
      this.isCronJobRunning = false;
    }
  }

  async getPersonalizedTips(userEmail: string): Promise<any[]> {
    const topCategories = await this.getTopCategoriesForUser(userEmail);

    if (topCategories.length === 0) {
      throw new NotFoundException(
        'No analyzed categories found for this user.',
      );
    }

    const topCategory = topCategories[0];

    // Check if tips for the category exist
    const existingTips = await this.prisma.tip.findMany({
      where: {
        userEmail,
        category: topCategory,
      },
      take: 2,
      orderBy: {
        createdAt: 'asc',
      },
    });

    // If no tips found, create and save tips for the user
    if (existingTips.length === 0) {
      const newTips = await this.createAndSaveTipsForUser(
        userEmail,
        topCategory,
      );
      return newTips;
    }

    // If tips are found, return them
    const materials = await this.getMaterialsForCategory(topCategory);

    const tips = existingTips.map((tip) => ({
      category: topCategory,
      imageUrl: tip.image,
      tip: {
        title: tip.title,
        description: tip.description,
      },
      materials,
    }));

    return tips;
  }

  private async createAndSaveTipsForUser(
    userEmail: string,
    topCategory: string,
  ): Promise<any[]> {
    try {
      // Generate two tips for the top category
      const firstTip = await this.generateTip(topCategory, 1);
      const secondTip = await this.generateTip(topCategory, 2);

      // Generate images for each tip
      const firstImageUrl = await this.generateImage(topCategory);
      const secondImageUrl = await this.generateImage(topCategory);

      const timestamp1 = Date.now();
      const savedImagePath1 = await this.saveImageToLocalServer(
        firstImageUrl,
        topCategory,
        userEmail,
        timestamp1,
      );

      const timestamp2 = timestamp1 + 1;
      const savedImagePath2 = await this.saveImageToLocalServer(
        secondImageUrl,
        topCategory,
        userEmail,
        timestamp2,
      );

      // Save the tips to the database
      await this.prisma.tip.create({
        data: {
          title: firstTip.title,
          description: firstTip.description,
          image: savedImagePath1 ?? '',
          category: topCategory,
          userEmail,
        },
      });

      await this.prisma.tip.create({
        data: {
          title: secondTip.title,
          description: secondTip.description,
          image: savedImagePath2 ?? '',
          category: topCategory,
          userEmail,
        },
      });

      // Return the newly created tips with materials
      const materials = await this.getMaterialsForCategory(topCategory);
      const newTips = [
        {
          category: topCategory,
          imageUrl: savedImagePath1 ?? '',
          tip: firstTip,
          materials,
        },
        {
          category: topCategory,
          imageUrl: savedImagePath2 ?? '',
          tip: secondTip,
          materials,
        },
      ];

      return newTips;
    } catch (err) {
      console.error(`❌ Failed to create tips for ${userEmail}:`, err);
      return [];
    }
  }

  private async saveImageToLocalServer(
    imageUrl: string,
    category: string,
    email: string,
    timestamp: number,
  ): Promise<string | null> {
    try {
      const user = await this.prisma.user.findUnique({ where: { email } });
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
          const baseUrl = process.env.APP_BASE_URL ?? 'http://localhost:3000';
          resolve(`${baseUrl}/images/${timestamp}_${category}.png`);
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

    const categoryCounts: Record<string, number> = {};

    // Count the frequency of each category
    for (const analysis of user.imageAnalyses) {
      const category = analysis.category;
      if (category) {
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      }
    }

    // Sort categories by frequency in descending order
    const sortedCategories = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1]) // Sort by frequency (highest first)
      .map(([category]) => category);

    // Return the sorted categories
    return sortedCategories;
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
    const prompt = `
      You are an expert in interior design. Suggest a unique and practical tip specifically for enhancing a "${category}" in a modern home.

      Make sure the tip is highly relevant to the category "${category}" and not something that would fit any generic room.

      Provide:
      - A catchy, specific title (max 10 words, without quotation marks)
      - A helpful description (2-3 sentences)

      Format:
      Title: <your title here>
      Description: <your description here>
      `;

    const response = await this.httpService.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful interior design assistant.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.8,
      },
      {
        headers: {
          Authorization: `Bearer ${this.openAiKey}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const result = (await lastValueFrom(response)).data.choices[0].message
      .content;

    const titleMatch = result.match(/Title:\s*(.*)/i);
    const descMatch = result.match(/Description:\s*([\s\S]*)/i);

    return {
      title: titleMatch?.[1]?.trim() ?? `Interior Tip for ${category}`,
      description:
        descMatch?.[1]?.trim() ?? `Here's a tip for your ${category} space.`,
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
