import { Injectable } from '@nestjs/common';
import { ImageAnalysisService } from '../image-analysis/image-analysis.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class OpenAiService {
  private readonly API_URL = 'https://api.openai.com/v1/chat/completions';
  private readonly API_KEY = process.env.OPENAI_API_KEY;

  constructor(
    private imageAnalysisService: ImageAnalysisService,
    private prisma: PrismaService
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
      return { message: 'No image analysis found. Please upload and analyze an image.' };
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
          - Ensure the response is in **valid JSON format only**.`
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
        throw new Error("Unexpected OpenAI response format.");
      }
  
      let parsedData;
      try {
        parsedData = JSON.parse(responseData.choices[0].message.content);
      } catch (error) {
        throw new Error("Invalid JSON format from OpenAI response.");
      }

      console.log('✅ Parsed OpenAI response:', parsedData);

      if (!parsedData.materials || !Array.isArray(parsedData.materials)) {
        return { error: "No materials detected in the image." };
      }

      // Find user
      const user = await this.prisma.user.findUnique({
        where: { email },
      });
  
      if (!user) {
        return { error: "User not found!" };
      }
  
      // Save ImageAnalysis
      const imageAnalysis = await this.prisma.imageAnalysis.create({
        data: {
          userId: user.id,
          imageUrl: imageBase64,
          description: parsedData.description || "No description available",
        },
      });
      console.log("imageAnalysisId:", imageAnalysis.id); // Should print a valid string

      // Save Materials
      const materialPromises = parsedData.materials.map((material, index) => {
        console.log(`Processing material ${index + 1}:`, material);

        // Log materialImage
        console.log(`materialImage for material ${index + 1}:`, material.materialImage);

        return this.prisma.material.create({
          data: {
            imageAnalysisId: imageAnalysis.id, // Linking material to image analysis
            materialName: material.materialName?.trim() || "Unknown", // Ensuring materialName is non-null
            materialType: material.materialType?.trim() || "Unknown", // Ensuring materialType is non-null
            materialProperties: Array.isArray(material.materialProperties) 
              ? material.materialProperties 
              : [], // Ensure it's an array
            materialOrigins: Array.isArray(material.materialOrigins) 
              ? material.materialOrigins 
              : [], // Ensure it's an array
            usesOfMaterial: Array.isArray(material.usesOfMaterial) 
              ? material.usesOfMaterial 
              : [], // Ensure usesOfMaterial is an array
            materialImage: material.materialImage?.trim() || null, // Handle null or empty image URL
          },
        });
      });

      // Use Promise.allSettled() to capture both resolved & rejected promises
      const materialResults = await Promise.allSettled(materialPromises);
    
      // Logging errors if any material creation fails
      materialResults.forEach((result, index) => {
        if (result.status === "rejected") {
          console.error(`❌ Material ${index + 1} failed:`, result.reason);
        }
      });

      return { message: "Image analysis and materials saved successfully!" };

    } catch (error) {
      console.error("❌ Error while calling OpenAI API:", error);
      throw new Error("Error while calling OpenAI API.");
    }
  }
}
