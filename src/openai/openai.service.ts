import { Injectable } from '@nestjs/common';
import { ImageAnalysisService } from '../image-analysis/image-analysis.service';


@Injectable()
export class OpenAiService {
  private readonly API_URL = 'https://api.openai.com/v1/chat/completions';
  private readonly API_KEY = process.env.OPENAI_API_KEY;

  constructor(private imageAnalysisService: ImageAnalysisService) {}

  async analyzeImage(imageBase64: string): Promise<any> {
    if (!this.API_KEY) {
      console.error('❌ OpenAI API key is missing! Set it in the .env file.');
      throw new Error('OpenAI API key is missing! Set it in the .env file.');
    }
  
    const payload = {
      model: 'gpt-4-turbo-2024-04-09',
      messages: [
        {
          role: 'system',
          content: `You are an AI that analyzes images and extracts key details. 
                        Based on the image, identify:
                        - **Main Object** (e.g., Chair, Table, Laptop, Car, etc.)
                        - **Material Type** (if applicable, e.g., Wood, Metal, Glass)
                        - **Quality** (if applicable, e.g., Premium, Standard, Low)
                        - **Notable Items** (list objects found in the image)
                        - **Scene Description** (brief summary of what's happening)
                        
                        🔹 **Always return a valid JSON response** like this:
                        {
                        "mainObject": "Table",
                        "material": "Wood",
                        "quality": "Premium",
                        "notableItems": ["Laptop", "Coffee Mug", "Book"],
                        "sceneDescription": "A workspace with a laptop and a coffee mug on a wooden table."
                        }`,
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
      response_format: 'json',
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
  
      // ✅ Debugging: Log response status
      console.log('🔹 Response Status:', response.status);
  
      const responseData = await response.json();
  
      // ✅ Debugging: Log response data
      console.log(
        '🔹 OpenAI API Response:',
        JSON.stringify(responseData, null, 2),
      );
  
      if (!response.ok) {
        console.error(`❌ OpenAI API request failed: ${response.statusText}`);
        throw new Error(`OpenAI API request failed: ${response.statusText}`);
      }
  
      // ✅ Save API response in the database
      const savedData = await this.imageAnalysisService.saveAnalysisResult(responseData);
  
      // ✅ Debugging: Log saved database entry
      console.log('✅ Data Saved in Database:', savedData);
  
      return savedData;
    } catch (error) {
      console.error('❌ Error while calling OpenAI API:', error);
      throw new Error('Error while calling OpenAI API.');
    }
  }
  
}
