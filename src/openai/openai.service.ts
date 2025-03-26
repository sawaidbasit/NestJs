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
          content: `You are an expert in material recognition for home construction, renovation, and interior design. 
    Your task is to analyze images and provide structured data about **all detected materials**, including primary and secondary materials.
    
    ### **Return JSON in this format:**
    {
      "materials": [
        {
          "name": "Material Name",
          "type": "Material Type",
          "category": "General Category",
          "description": "A short but precise description of the material.",
          "materialProperties": [
            "Property 1",
            "Property 2",
            "Property 3"
          ],
          "materialOrigins": [
            "Origin 1",
            "Origin 2"
          ],
          "usesOfMaterial": [
            "Usage 1",
            "Usage 2",
            "Usage 3"
          ]
        }
      ]
    }
    
    ### **Key Instructions:**
    - Identify **all visible materials**, including flooring, cabinetry, countertops, walls, backsplashes, appliances, fixtures, and accessories.
    - Assign a **Category** for each material. 
      - Example: If the material is "Granite" or "Marble", set **category** as "Stone".
      - Example: If the material is "Teak Wood" or "Oak Wood", set **category** as "Wood".
      - Example: If the material is "Stainless Steel" or "Iron", set **category** as "Metal".
      - Example: If the material is "Ceramic Tile" or "Porcelain", set **category** as "Tile".
    - Include even **small details** like plastic handles, glass doors, rubber seals, or metal trims.
    - Ensure **materialProperties** and **usesOfMaterial** contain at least three relevant entries.
    - Provide **concise but meaningful descriptions** of each material.
    - Do **not** group different materials together—each must be listed separately.`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze this image and detect all materials used in it. Provide structured JSON output with details including name, type, category, description, material properties, origins, and common uses.',
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

     // Ensure imageAnalysis is declared and assigned before use
const imageAnalysis = await this.prisma.imageAnalysis.create({
  data: {
    userId: user.id,
    imageUrl: imageBase64
  },
});

const materialPromises = parsedData.materials.map(async (material, index) => {

  const materialName = material?.name?.trim() || 'Unknown';
  const materialType = material?.type?.trim() || 'Unknown';
  const materialCategory = material?.category?.trim() || 'Other'; 
  const materialDescription = material?.description?.trim() || 'No description available'; 
  const materialProperties = Array.isArray(material?.materialProperties) && material.materialProperties.length > 0
    ? material.materialProperties
    : ["Unknown"]; 
  const materialOrigins = Array.isArray(material?.materialOrigins) 
    ? material.materialOrigins 
    : [material?.materialOrigins || 'Unknown'];

  const usesOfMaterial = Array.isArray(material?.usesOfMaterial) && material.usesOfMaterial.length > 0
    ? material.usesOfMaterial
    : ["General Construction"];

  let materialImage = material?.materialImage?.trim() || null;
  if (!materialImage) {
    materialImage = await this.generateMaterialImage(materialName, email, materialType);
  }

  return this.prisma.material.create({
    data: {
      imageAnalysisId: imageAnalysis.id,
      materialName,  
      materialType,
      category: materialCategory,
      description: materialDescription, 
      materialProperties,
      materialOrigins,
      usesOfMaterial,
      materialImage,
    },
  });
});



// Wait for all materials to be inserted
const materialResults = await Promise.allSettled(materialPromises);

materialResults.forEach((result, index) => {
  if (result.status === 'rejected') {
    console.error(`❌ Material ${index + 1} failed:`, result.reason);
  } else {
    console.log(`✅ Material ${index + 1} inserted successfully`);
  }
});

      
      return { message: 'Image analysis and materials saved successfully!',
        materials: materialResults.map(result => 
          result.status === 'fulfilled' ? result.value : null
        ).filter(material => material !== null)
       };
    } catch (error) {
      console.error('❌ Error while calling OpenAI API:', error);
      throw new Error('Error while calling OpenAI API.');
    }
  }

  async generateMaterialImage(
    materialName: string,
    email: string,
    materialType: string
  ): Promise<string | null> {
    try {
      const appUrl = process.env.APP_URL;

      const requestBody = {
        model: 'dall-e-3',
        // prompt: `A **completely flat, seamless, tileable texture sample** of '${materialName}' material.  
        // - 🚫 **No spheres, no cubes, no 3D objects, no perspective, no depth.**  
        // - 🎨 The material **fills the entire image edge-to-edge, with no empty space, no background, and no borders.**  
        // - 🔍 The texture is **high-resolution and photorealistic,** suitable for **architecture, 3D modeling, and material libraries.**  
        // - ☀️ **No shadows, no lighting effects, no reflections.** The texture should be evenly lit, as if **scanned from a real-world sample.**  
        // - 📏 **100% tileable and seamless**, allowing for smooth repetition in architectural and 3D design applications.  
        // - 🏗️ Example materials: 'wood veneer, marble slab, porcelain tile, granite countertop, concrete, laminate, or fabric.'`,
        // n: 1,
        // size: '1024x1024'
        "prompt": `create Hardwood ${materialName} ${materialType} material texture rectungular image no layers, single plain texture, looks real`,
        "n": 1,
        "quality": "hd",
        "size": "1024x1024"
    };

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

      const dalleData = await dalleResponse.json();

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

      const timestamp = Date.now();

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

     const newImageUrl = `${appUrl}/images/${timestamp}_${materialName}.png`;

      return newImageUrl;
    } catch (error) {
      console.error(
        `❌ Exception while generating image for ${materialName}:`,
        error,
      );
      return null;
    }
  }

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

      const userDir = path.join(__dirname, `../../public/images/`);
      const imagePath = path.join(userDir, `${timestamp}_${materialName}.png`);

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
