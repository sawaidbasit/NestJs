import { Injectable } from '@nestjs/common';
import { ImageAnalysisService } from '../image-analysis/image-analysis.service';
import { PrismaService } from 'src/prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

@Injectable()
export class OpenAiService {
  private readonly API_URL = 'https://api.openai.com/v1/chat/completions';
  private readonly API_KEY = process.env.OPENAI_API_KEY;

  constructor(
    private imageAnalysisService: ImageAnalysisService,
    private prisma: PrismaService,
  ) {}

  async getAnalysisByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { imageAnalyses: true },
    });

    if (!user) {
      console.log('❌ User not found for email:', email);
      return { error: 'User not found!' };
    }

    if (user.imageAnalyses.length === 0) {
      console.log('ℹ️ No image analysis found for user:', email);
      return {
        message: 'No image analysis found. Please upload and analyze an image.',
      };
    }

    console.log('✅ Returning image analyses for user:', email);
    return user.imageAnalyses;
  }

  async analyzeImage(imageBase64: string, email: string): Promise<any> {
    if (!this.API_KEY) {
      throw new Error('OpenAI API key is missing! Set it in the .env file.');
    }

    const payload = {
      model: 'gpt-4-turbo-2024-04-09',
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant that analyzes images and detects materials used in them.
          Given an image, analyze the materials present and return a structured JSON object.

          **Response Format:**
          {
            "description": "Brief description of the image and materials present",
            "materials": [
              {
                "materialName": "Granite",
                "materialDescription": "Granite is a natural stone known for its durability and elegance.",
                "materialType": "Natural",
                "materialProperties": ["Hard", "Scratch-resistant", "Heat-resistant"],
                "materialOrigins": ["Brazil", "India", "China"],
                "usesOfMaterial": ["Countertops", "Flooring", "Sculptures"],
                "materialImage": "URL of the material image if available"
              }
            ]
          }

          **Instructions:**
          - Identify all materials present in the image.
          - Provide accurate material names, types, and descriptions.
          - Include relevant material properties, origins, and common uses.
          - Ensure the response is in **valid JSON format only**.`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze this image and provide structured JSON details about the materials used.',
            },
            {
              type: 'image_url',
              image_url: {
                url: imageBase64,
              },
            },
          ],
        },
      ],
      response_format: { type: 'json_object' },
    };

    try {
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error(`❌ OpenAI API request failed: ${response.statusText}`);
        throw new Error(`OpenAI API request failed: ${response.statusText}`);
      }

      if (
        !responseData.choices ||
        !responseData.choices[0] ||
        !responseData.choices[0].message ||
        !responseData.choices[0].message.content
      ) {
        throw new Error('Unexpected OpenAI response format.');
      }

      let parsedData;
      try {
        parsedData = JSON.parse(responseData.choices[0].message.content);
      } catch (error) {
        throw new Error('Invalid JSON format from OpenAI response.');
      }

      console.log('✅ Parsed OpenAI response:', parsedData);

      if (!parsedData.materials || !Array.isArray(parsedData.materials)) {
        return { error: 'No materials detected in the image.' };
      }

      // Find user
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return { error: 'User not found!' };
      }

      // Save ImageAnalysis
      const imageAnalysis = await this.prisma.imageAnalysis.create({
        data: {
          userId: user.id,
          imageUrl: imageBase64,
          description: parsedData.description || 'No description available',
        },
      });
      console.log('imageAnalysisId:', imageAnalysis.id); // Should print a valid string

      // Save Materials
      const materialPromises = parsedData.materials.map(
        async (material, index) => {
          console.log(`Processing material ${index + 1}:`, material);

          // Generate image if not available
          // Generate image if not available
          let materialImage = material.materialImage?.trim() || null;
          console.log(
            `🔍 Checking image for: ${material.materialName} | Existing Image: ${materialImage}`,
          );

          if (!materialImage) {
            console.log(
              `🚀 Generating new image for: ${material.materialName}...`,
            );
            materialImage = await this.generateMaterialImage(
              material.materialName,
              email,
            );
            console.log(`✅ Generated image URL: ${materialImage}`);
          }

          return this.prisma.material.create({
            data: {
              imageAnalysisId: imageAnalysis.id,
              materialName: material.materialName?.trim() || 'Unknown',
              materialType: material.materialType?.trim() || 'Unknown',
              materialProperties: Array.isArray(material.materialProperties)
                ? material.materialProperties
                : [],
              materialOrigins: Array.isArray(material.materialOrigins)
                ? material.materialOrigins
                : [],
              usesOfMaterial: Array.isArray(material.usesOfMaterial)
                ? material.usesOfMaterial
                : [],
              materialImage, // Set generated or provided image URL
            },
          });
        },
      );

      // Use Promise.allSettled() to capture both resolved & rejected promises
      const materialResults = await Promise.allSettled(materialPromises);

      // Logging errors if any material creation fails
      materialResults.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`❌ Material ${index + 1} failed:`, result.reason);
        }
      });

      return { message: 'Image analysis and materials saved successfully!' };
    } catch (error) {
      console.error('❌ Error while calling OpenAI API:', error);
      throw new Error('Error while calling OpenAI API.');
    }
  }

  async generateMaterialImage(
    materialName: string,
    email: string,
  ): Promise<string | null> {
    try {
      const appUrl = process.env.APP_URL;
      console.log(`🟢 Generating image for: ${materialName}`);

      const requestBody = {
        model: 'dall-e-3',
        prompt: `A high-resolution, seamless texture of ${materialName}. The entire image should be completely covered with the material, 
            without any borders, background, shadows, or extra elements. The texture should be evenly lit, photorealistic, 
            and perfectly tiled to blend smoothly for construction and interior design projects.`,
        n: 1,
        size: '1024x1024',
      };

      console.log(
        `📤 Sending request to OpenAI:`,
        JSON.stringify(requestBody, null, 2),
      );

      const dalleResponse = await fetch(
        'https://api.openai.com/v1/images/generations',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        },
      );

      console.log(`🔄 Waiting for OpenAI response...`);
      const dalleData = await dalleResponse.json();
      console.log(`📸 DALL·E Response:`, JSON.stringify(dalleData, null, 2));

      if (!dalleResponse.ok || !dalleData.data || dalleData.data.length === 0) {
        console.error(`❌ No image generated for ${materialName}`);
        return null;
      }

       // ✅ Find user to get `user.id`
       const user = await this.prisma.user.findUnique({ where: { email } });
       if (!user) {
           console.error(`❌ User not found for email: ${email}`);
           return null;
       }
       
      const imageUrl = dalleData.data[0].url;
      console.log(`✅ OpenAI Image URL: ${imageUrl}`);

      // ✅ Generate a Single Timestamp Before Calling saveImageToLocalServer
      const timestamp = Date.now();

      // 🔽 Download and save the image to your server with the same timestamp
      const imagePath = await this.saveImageToLocalServer(
        imageUrl,
        materialName,
        email,
        timestamp,
      );
      if (!imagePath) {
        console.error(`❌ Failed to save image locally`);
        return null;
      }

      // ✅ Use the same timestamp for database storage
     const newImageUrl = `${appUrl}/images/${user?.id}/${timestamp}_${materialName}.png`;
     console.log(`✅ Stored Image URL: ${newImageUrl}`);

      return newImageUrl;
    } catch (error) {
      console.error(
        `❌ Exception while generating image for ${materialName}:`,
        error,
      );
      return null;
    }
  }

  // 🔽 Helper function to download and save image locally
  async saveImageToLocalServer(
    imageUrl: string,
    materialName: string,
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

      // ✅ Use the provided timestamp
      const userDir = path.join(__dirname, `../../public/images/${user.id}`);
      const imagePath = path.join(userDir, `${timestamp}_${materialName}.png`);

      if (!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir, { recursive: true });
        console.log(`📁 Created missing directory: ${userDir}`);
      }

      console.log(`⬇️ Downloading image to: ${imagePath}`);

      const writer = fs.createWriteStream(imagePath);
      const response = await axios({
        url: imageUrl,
        method: 'GET',
        responseType: 'stream',
      });

      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          console.log(`✅ Image saved successfully: ${imagePath}`);
          resolve(imagePath);
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
}
