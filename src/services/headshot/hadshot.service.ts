import { config } from "@/config";
import { AppError } from "@/util/errors";
import { logger } from "@/util/logger";
import Replicate from "replicate";

export const HEADSHOT_STYLES = {
  professional: {
    name: "Professional",
    description: "Clean, corporate headshot with neutral background",
    prompt:
      "professional corporate headshot, business attire, neutral background, studio lighting, high quality, sharp focus",
    key: "professional",
  },
  casual: {
    name: "Casual",
    description: "Relaxed, friendly headshot with soft lighting",
    prompt:
      "casual portrait, friendly smile, soft natural lighting, outdoor background, high quality",
    key: "casual",
  },
  creative: {
    name: "Creative",
    description: "Artistic headshot with creative elements",
    prompt:
      "creative artistic portrait, unique styling, colorful background, dramatic lighting, high quality",
    key: "creative",
  },
  executive: {
    name: "Executive",
    description: "High-end executive portrait",
    prompt:
      "executive portrait, formal attire, office background, professional lighting, high quality, confident pose",
    key: "executive",
  },
  linkedin: {
    name: "LinkedIn",
    description: "Perfect for LinkedIn profiles",
    key: "linkedin",
    prompt:
      "linkedin profile photo, professional appearance, clean background, natural smile, business professional",
  },
} as const;

export type HeadshotStyle = keyof typeof HEADSHOT_STYLES;

export interface GenerateHeadshotParams {
  imageUrl: string;
  style: HeadshotStyle;
  prompt?: string; // Optional custom prompt to override default style prompt
}

export interface GenerateHeadshotResult {
  imageUrl: string;
  style: HeadshotStyle;
}

export class HeadshotService {
  // replicate client constructor

  private client: Replicate;

  constructor() {
    this.client = new Replicate({
      auth: config.replicate.apiKey,
    });
  }

  getAvailableStyles = (): Array<{
    key: HeadshotStyle;
    name: string;
    description: string;
  }> => {
    return (Object.keys(HEADSHOT_STYLES) as HeadshotStyle[]).map((key) => ({
      key,
      name: HEADSHOT_STYLES[key].name,
      description: HEADSHOT_STYLES[key].description,
    }));
  };

  async generateHeadshot(
    params: GenerateHeadshotParams
  ): Promise<GenerateHeadshotResult> {
    try {
      const { imageUrl, style, prompt } = params;

      const styleConfig = HEADSHOT_STYLES[style];

      // use custom prompt if provided otherwise use style prompt

      const promptToUse = prompt?.trim() || styleConfig.prompt;

      logger.info(
        `Generating headshot for style ${style} with prompt ${prompt}`
      );

      const startTime = Date.now();

      // replicate service

      // prepare the payload for replicate

      const inputParams = {
        prompt: promptToUse,
        image_input: [imageUrl],
        resolution: "1K",
        aspect_ratio: "1:1",
        output_format: "png",
        safety_filter_level: "block_only_high",
      };

      logger.info(`Prepared input parameters for replicate`, inputParams);

      // call the replicate service

      const output = await this.client.run("google/nano-banana-pro", {
        input: inputParams,
      });

      const generatedTime = Date.now() - startTime;
      logger.info(`Replicate service call completed in ${generatedTime}ms`);
      const generatedImageUrl = (output as any).url();

      if(!generatedImageUrl) {
        throw new AppError("Failed to generate headshot", 500, "FAILED_TO_GENERATE_HEADSHOT");
      }

      logger.info(`Generated headshot image url: ${generatedImageUrl}`);

      return {
        imageUrl: generatedImageUrl,
        style,
      };


    } catch (error : any) {
        const errorPrompt = params.prompt?.trim() || HEADSHOT_STYLES[params.style].prompt;
        logger.error('Failed to generate headshot with Replicate:', {
          error: error?.message || error,
          errorCode: error?.code,
          errorType: error?.type,
          style: params.style,
          imageUrl: params.imageUrl,
          prompt: typeof errorPrompt === 'string' ? errorPrompt.substring(0, 100) : 'N/A',
        });
        
        // Provide more helpful error messages
        if (error?.message?.includes('invalid') || error?.code === 'E006') {
          throw new Error(`Invalid input parameters for Replicate API. Please check image URL is accessible and parameters are correct. Original error: ${error.message}`);
        }
        
        throw new Error(`Failed to generate ${params.style} headshot: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
  }
}

export const headshotService = new HeadshotService();
