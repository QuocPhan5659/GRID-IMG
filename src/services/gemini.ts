import { GoogleGenAI } from "@google/genai";
import { CollageConfig } from "../types";

const MODEL_NAME = "gemini-3.1-flash-image-preview";

export async function checkApiKey(): Promise<boolean> {
  if (window.aistudio && window.aistudio.hasSelectedApiKey) {
    return await window.aistudio.hasSelectedApiKey();
  }
  return !!process.env.GEMINI_API_KEY;
}

export async function promptApiKeySelection(): Promise<void> {
  if (window.aistudio && window.aistudio.openSelectKey) {
    await window.aistudio.openSelectKey();
  }
}

export async function testApiKey(apiKey: string): Promise<boolean> {
  try {
    const ai = new GoogleGenAI({ apiKey });
    // Use a standard text model to test general API access
    await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "hi",
      config: { maxOutputTokens: 1 }
    });
    return true;
  } catch (error) {
    console.error("API Key test failed:", error);
    return false;
  }
}

export async function generateCollage(config: CollageConfig, onFallback?: (model: string) => void): Promise<string> {
  let apiKeyToUse = config.userApiKey || process.env.GEMINI_API_KEY;
  let currentModel = config.model || "gemini-2.5-flash-image";

  const isProModel = currentModel.includes("pro");
  
  if (!apiKeyToUse && isProModel) {
    // Fallback to platform selection if no key at all
    const hasKey = await checkApiKey();
    if (!hasKey) {
      await promptApiKeySelection();
      const hasKeyAfterPrompt = await checkApiKey();
      if (!hasKeyAfterPrompt) {
        throw new Error("Please enter your API Key or select a project to use the Pro model.");
      }
    }
    apiKeyToUse = process.env.GEMINI_API_KEY;
  }

  // If still no key (shouldn't happen for free models as env key is always there), throw error
  if (!apiKeyToUse) {
    throw new Error("API Key is required. Please enter your key in settings.");
  }

  const attemptGeneration = async (model: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: apiKeyToUse });
    const parts: any[] = [];

    const images = config.images || [];

    // Add all images
    for (let i = 0; i < images.length; i++) {
      const file = images[i];
      const base64Data = await fileToBase64(file);
      parts.push({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    }

    // Add logo if provided
    if (config.logo) {
      const logoBase64 = await fileToBase64(config.logo);
      parts.push({
        inlineData: {
          data: logoBase64,
          mimeType: config.logo.type,
        },
      });
    }

    // Construct the prompt based on background and user intent
    const bgDescription = {
      "gray-black": "a sophisticated dark gray-black background",
      "brown-black": "a rich brown-black (espresso) background",
      "white": "a clean, minimalist white background"
    }[config.background];

    const layoutDescription = {
      grid: "a clean, balanced grid layout",
      masonry: "a dynamic masonry-style layout with varying sizes",
      cinematic: "a dramatic cinematic layout with wide framing",
      minimal: "a minimalist layout with generous whitespace"
    }[config.layoutStyle || "grid"];

    const qualityDescription = config.outputQuality === "high" 
      ? "Ensure the highest possible resolution and sharpest details for each image." 
      : "Standard professional quality.";

    const collagePrompt = `You are a professional layout designer. Create a single combined image (collage) by arranging the provided ${images.length} images.

    STRICT REQUIREMENTS:
    1. **Exact Count**: You MUST include all ${images.length} uploaded images in the layout. Do not omit any image.
    2. **NO CROPPING**: Each image MUST be fully visible from corner to corner. Do not crop, zoom, or cut any part of the original images. The entire original frame of each image must be preserved.
    3. **Preserve Details**: Do not alter, modify, or change the details, colors, or content of the original images. Each image should be represented as faithfully as possible to its original state.
    4. **Layout Style**: Use ${layoutDescription}. Arrange the images in a way that maximizes their visibility without overlapping or cutting them.
    5. **Hero Image**: The image at index ${config.heroImageIndex !== undefined ? config.heroImageIndex : 0} is the "Hero" image. Position it as the central or most prominent element in the arrangement.
    6. **Background**: Place all images on ${bgDescription}.
    7. **Branding**: ${config.logo ? "The last image provided is a logo. Place it discreetly in a corner for branding." : "No logo provided."}
    8. **Title**: ${config.title ? `Include the title "${config.title}" using clean, professional typography that does not overlap the images.` : "No title."}
    9. **Quality**: ${qualityDescription}

    The final output must look like a high-end professional photo arrangement where the focus is on the clean layout of the original source materials.`;

    parts.push({ text: collagePrompt });

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: parts,
      },
      config: {
        imageConfig: {
          imageSize: "1K",
          aspectRatio: "1:1",
        },
      },
    });

    for (const candidate of response.candidates || []) {
      for (const part of candidate.content.parts || []) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }

    throw new Error("No image generated in response.");
  };

  try {
    return await attemptGeneration(currentModel);
  } catch (error: any) {
    console.error("Collage generation error:", error);
    
    const errorMessage = error.message || "";
    const errorString = typeof error === 'object' ? JSON.stringify(error) : String(error);
    
    // Robust error detection
    const isQuotaError = 
      errorMessage.includes("RESOURCE_EXHAUSTED") || 
      errorString.includes("RESOURCE_EXHAUSTED") || 
      errorString.includes("429") ||
      error?.status === 429 ||
      error?.code === 429;

    const isPermissionError = 
      errorMessage.includes("PERMISSION_DENIED") || 
      errorString.includes("PERMISSION_DENIED") || 
      errorString.includes("403") ||
      error?.status === 403 ||
      error?.code === 403;

    if ((isQuotaError || isPermissionError) && currentModel !== "gemini-2.5-flash-image") {
      const fallbackModel = "gemini-2.5-flash-image";
      console.log(`Attempting automatic fallback to ${fallbackModel} due to ${isQuotaError ? 'quota' : 'permission'} error.`);
      
      // If it was a quota error, wait a tiny bit before retrying fallback
      if (isQuotaError) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      if (onFallback) onFallback(fallbackModel);
      
      try {
        return await attemptGeneration(fallbackModel);
      } catch (fallbackError: any) {
        console.error("Fallback generation failed:", fallbackError);
        
        // If fallback fails, update the error flags to reflect the NEW error
        const fallbackErrorMessage = fallbackError.message || "";
        const fallbackErrorString = typeof fallbackError === 'object' ? JSON.stringify(fallbackError) : String(fallbackError);
        
        const isFallbackQuota = 
          fallbackErrorMessage.includes("RESOURCE_EXHAUSTED") || 
          fallbackErrorString.includes("RESOURCE_EXHAUSTED") || 
          fallbackErrorString.includes("429") ||
          fallbackError?.status === 429 ||
          fallbackError?.code === 429;

        const isFallbackPermission = 
          fallbackErrorMessage.includes("PERMISSION_DENIED") || 
          fallbackErrorString.includes("PERMISSION_DENIED") || 
          fallbackErrorString.includes("403") ||
          fallbackError?.status === 403 ||
          fallbackError?.code === 403;
        
        if (isFallbackQuota) {
          throw new Error("Quota Exceeded (429): Both primary and fallback models are currently at their limit. This is common for free-tier keys. Please wait 60 seconds for the quota to reset and try again.");
        }
        
        if (isFallbackPermission) {
          throw new Error("Permission Denied (403): Your API Key does not have permission for the fallback model either. Please ensure the 'Generative Language API' is enabled in your Google Cloud project.");
        }
        
        throw fallbackError;
      }
    }

    if (errorMessage.includes("Requested entity was not found")) {
      await promptApiKeySelection();
      throw new Error("API Key was invalid or model not found. Please try again.");
    }

    if (isPermissionError) {
      throw new Error("Permission Denied (403): Your API Key does not have permission to access this model. Please ensure the 'Generative Language API' is enabled in your Google Cloud project and your key is valid.");
    }

    if (isQuotaError) {
      throw new Error("Quota Exceeded (429): You have exceeded your current quota. Please check your plan and billing details at https://aistudio.google.com/app/plan_and_billing.");
    }

    throw error;
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
