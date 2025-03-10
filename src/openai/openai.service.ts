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
      return { error: 'User not found!' };
    }
  
    if (user.imageAnalyses.length === 0) {
      return { message: 'No image analysis found. Please upload and analyze an image.' };
    }
  
    return user.imageAnalyses;
  }  

  async analyzeImage(imageBase64: string, email: string): Promise<any> {
    if (!this.API_KEY) {
      console.error('❌ OpenAI API key is missing! Set it in the .env file.');
      throw new Error('OpenAI API key is missing! Set it in the .env file.');
    }

    const payload = {
      model: 'gpt-4-turbo-2024-04-09',
      messages: [
        {
          role: 'system',
          content: `You are an AI that analyzes images to determine the material composition of objects, particularly natural materials such as ceramics, marble, granite, and other stones. Your task is to identify and extract key details from the image.
    
          Based on the image, analyze and provide the following structured information:
    
          - **Material Name**: Identify the primary material (e.g., Marble, Granite, Ceramic, Limestone, etc.).
          - **Type**: Classify the material as Natural (e.g., Igneous, Sedimentary, Metamorphic) or Man-made.
          - **Properties**: Describe key characteristics such as texture, durability, porosity, strength, and resistance.
          - **Origin**: Mention where this material is commonly found or manufactured.
          - **Uses**: List common applications (e.g., kitchen tiles, countertops, flooring, sculptures).
          - **Quality**: Assess the quality (e.g., Premium, Standard, Low).
          - **Notable Items**: Identify any additional objects in the image.
          - **Scene Description**: Provide a brief summary of the image content.
          - **Description**: A detailed explanation of the image, **highlighting the material's name, properties, origin, and composition**.
    
          🔹 **Always return a structured JSON response** in this format:
          {
            "materials": [
              {
                "materialName": "Granite",
                "type": "Natural (Igneous)",
                "properties": "Hard, scratch-resistant, heat-resistant",
                "origin": "Commonly found in Brazil, India, China",
                "uses": ["Kitchen countertops", "Flooring", "Monuments"],
                "quality": "Premium"
              }
            ],
            "notableItems": ["Sink", "Faucet"],
            "sceneDescription": "A modern kitchen with a granite countertop and a stainless steel sink.",
            "description": "This image features a **Granite** countertop, a premium natural material known for its durability and resistance to heat. The **granite surface has a deep black finish with white veins running through it**, commonly sourced from Brazil and India. The polished texture enhances its luxurious appeal. Additionally, the image includes a stainless steel sink and faucet, complementing the high-quality kitchen aesthetic."
          }`
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze this image and provide structured JSON details.',
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

      console.log("✅ OpenAI API Response:", JSON.stringify(responseData, null, 2));

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
        console.error("❌ Unexpected OpenAI response format:", responseData);
        throw new Error("Unexpected OpenAI response format.");
      }

      let parsedData;
      try {
        parsedData = JSON.parse(responseData.choices[0].message.content);
      } catch (error) {
        console.error("❌ Failed to parse OpenAI response:", error);
        throw new Error("Invalid JSON format from OpenAI response.");
      }

      console.log("✅ Parsed Data from OpenAI:", parsedData);

      if (!parsedData.materials || !Array.isArray(parsedData.materials)) {
        console.error("❌ No materials found in OpenAI response.");
        return { error: "No materials detected in the image." };
      }

      const savedData = await Promise.all(
        parsedData.materials.map(async (material) => {
          return this.imageAnalysisService.saveAnalysisResult({
            email: email,
            materialName: material.materialName || "Unknown",
            type: material.type || "Unknown",
            properties: material.properties || "No properties available",
            origin: material.origin || "Unknown",
            uses: material.uses || [],
            imageUrl: imageBase64,
            description: parsedData.description || "No description available",
          });
        })
      );

      console.log("✅ Saved Data in DB:", savedData);
      return savedData;

    } catch (error) {
      console.error("❌ Error while calling OpenAI API:", error);
      throw new Error("Error while calling OpenAI API.");
    }
  }
}
