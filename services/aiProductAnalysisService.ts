import { Category } from '@/types/wardrobe';

export interface ProductAnalysisResult {
  name?: string;
  brand?: string;
  category?: Category;
  color?: string;
  estimatedPrice?: number;
  description?: string;
  success: boolean;
  error?: string;
}

export class AIProductAnalysisService {
  private static readonly AI_API_URL = 'https://toolkit.rork.com/text/llm/';
  private static readonly VALID_CATEGORIES: Category[] = [
    'shirts', 'pants', 'jackets', 'shoes', 'accessories', 'fragrances'
  ];

  static async analyzeImageForProduct(imageBase64: string): Promise<ProductAnalysisResult> {
    try {
      const response = await fetch(this.AI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `You are a fashion expert AI. Analyze the clothing/accessory item in the image and provide structured information. 
              
              Return ONLY a valid JSON object with these exact fields:
              {
                "name": "descriptive item name",
                "brand": "brand name if visible, otherwise 'Unknown'",
                "category": "one of: shirts, pants, jackets, shoes, accessories, fragrances",
                "color": "primary color",
                "estimatedPrice": number (USD),
                "description": "detailed description including style, material, features"
              }
              
              Be precise and only return the JSON object, no additional text.`
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Analyze this fashion item and provide detailed information in the specified JSON format.'
                },
                {
                  type: 'image',
                  image: imageBase64
                }
              ]
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      try {
        // Clean the response to extract JSON
        let jsonString = data.completion.trim();
        
        // Remove markdown code blocks if present
        jsonString = jsonString.replace(/```json\s*/, '').replace(/```\s*$/, '');
        
        const itemInfo = JSON.parse(jsonString);
        
        // Validate category
        if (itemInfo.category && !this.VALID_CATEGORIES.includes(itemInfo.category)) {
          itemInfo.category = 'accessories'; // Default fallback
        }
        
        return {
          name: itemInfo.name,
          brand: itemInfo.brand,
          category: itemInfo.category as Category,
          color: itemInfo.color,
          estimatedPrice: typeof itemInfo.estimatedPrice === 'number' ? itemInfo.estimatedPrice : parseFloat(itemInfo.estimatedPrice) || 0,
          description: itemInfo.description,
          success: true
        };
      } catch (parseError) {
        // If JSON parsing fails, return the raw response as description
        return {
          description: data.completion,
          success: true
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to analyze image'
      };
    }
  }

  static async analyzeWebsiteForProduct(url: string): Promise<ProductAnalysisResult> {
    try {
      const response = await fetch(this.AI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `You are a web scraping assistant specialized in fashion e-commerce. Extract product information from the given URL and return structured data.
              
              Return ONLY a valid JSON object with these exact fields:
              {
                "name": "product name",
                "brand": "brand name",
                "category": "one of: shirts, pants, jackets, shoes, accessories, fragrances",
                "color": "primary color",
                "price": number (USD),
                "description": "product description"
              }
              
              If you cannot access the URL directly, provide guidance on what information to look for on the product page. Be precise and only return the JSON object, no additional text.`
            },
            {
              role: 'user',
              content: `Please analyze this product URL and extract relevant information: ${url}`
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      try {
        // Clean the response to extract JSON
        let jsonString = data.completion.trim();
        
        // Remove markdown code blocks if present
        jsonString = jsonString.replace(/```json\s*/, '').replace(/```\s*$/, '');
        
        const productInfo = JSON.parse(jsonString);
        
        // Validate category
        if (productInfo.category && !this.VALID_CATEGORIES.includes(productInfo.category)) {
          productInfo.category = 'accessories'; // Default fallback
        }
        
        return {
          name: productInfo.name,
          brand: productInfo.brand,
          category: productInfo.category as Category,
          color: productInfo.color,
          estimatedPrice: typeof productInfo.price === 'number' ? productInfo.price : parseFloat(productInfo.price) || 0,
          description: productInfo.description,
          success: true
        };
      } catch (parseError) {
        // If JSON parsing fails, return the raw response as description
        return {
          description: data.completion,
          success: true
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to analyze website'
      };
    }
  }

  static async generateProductImage(description: string): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
    try {
      const response = await fetch('https://toolkit.rork.com/images/generate/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `Professional product photography of ${description}, clean white background, high quality, commercial style`,
          size: '512x512'
        })
      });

      if (!response.ok) {
        throw new Error(`Image generation failed: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        imageUrl: `data:${data.image.mimeType};base64,${data.image.base64Data}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate image'
      };
    }
  }
}