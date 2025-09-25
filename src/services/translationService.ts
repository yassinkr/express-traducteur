// services/translationService.ts
import { Translate } from '@google-cloud/translate/build/src/v2';

interface TranslateParams {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
}

interface TranslateResult {
  ok: boolean;
  translatedText?: string;
  error?: string;
  detectedLanguage?: string;
}

class TranslateService {
  private translate: Translate;

  constructor(projectId?: string, keyFilename?: string, apiKey?: string) {
    // Initialize Google Cloud Translate client
    const options: any = {};
    
    if (projectId) {
      options.projectId = projectId;
    }
    
    if (keyFilename) {
      options.keyFilename = keyFilename;
    } else if (apiKey) {
      options.key = apiKey;
    }

    this.translate = new Translate(options);
  }

  public async translation(params: TranslateParams): Promise<TranslateResult> {
    try {
      const { text, sourceLanguage, targetLanguage } = params;

      // Validate language codes
      if (!this.isValidLanguageCode(sourceLanguage) || !this.isValidLanguageCode(targetLanguage)) {
        return {
          ok: false,
          error: 'Invalid language code. Please use ISO 639-1 language codes (e.g., en, fr, es, de)'
        };
      }

      // Auto-detect source language if set to 'auto'
      const source = sourceLanguage === 'auto' ? undefined : sourceLanguage;

      // Perform translation
      const [translation, metadata] = await this.translate.translate(text, {
        from: source,
        to: targetLanguage,
      });

      // Handle both single string and array responses
      const translatedText = Array.isArray(translation) ? translation[0] : translation;
      
      return {
        ok: true,
        translatedText,
        detectedLanguage: metadata?.data?.detectedSourceLanguage
      };

    } catch (error: any) {
      console.error('Google Translate API error:', error);
      
      // Handle specific Google Cloud errors
      if (error.code === 400) {
        return {
          ok: false,
          error: 'Invalid request parameters or unsupported language'
        };
      } else if (error.code === 403) {
        return {
          ok: false,
          error: 'Access denied. Check your API key or service account permissions'
        };
      } else if (error.code === 429) {
        return {
          ok: false,
          error: 'Rate limit exceeded. Please try again later'
        };
      } else if (error.code === 413) {
        return {
          ok: false,
          error: 'Text too long. Please try with shorter text'
        };
      }

      return {
        ok: false,
        error: error.message || 'Translation service unavailable'
      };
    }
  }

  // Get list of supported languages
  async getSupportedLanguages(): Promise<{ ok: boolean; languages?: any[]; error?: string }> {
    try {
      const [languages] = await this.translate.getLanguages();
      return {
        ok: true,
        languages
      };
    } catch (error: any) {
      console.error('Error fetching supported languages:', error);
      return {
        ok: false,
        error: 'Failed to fetch supported languages'
      };
    }
  }

  // Detect language of given text
  async detectLanguage(text: string): Promise<{ ok: boolean; detectedLanguage?: string; confidence?: number; error?: string }> {
    try {
      const [detections] = await this.translate.detect(text);
      const detection = Array.isArray(detections) ? detections[0] : detections;
      
      return {
        ok: true,
        detectedLanguage: detection.language,
        confidence: detection.confidence
      };
    } catch (error: any) {
      console.error('Language detection error:', error);
      return {
        ok: false,
        error: 'Failed to detect language'
      };
    }
  }

  private isValidLanguageCode(code: string): boolean {
    // Allow 'auto' for source language detection
    if (code === 'auto') return true;
    
    // Basic validation for ISO 639-1 codes (2 characters) or some extended codes
    return /^[a-z]{2,3}(-[A-Z]{2})?$/.test(code);
  }
}

export default TranslateService;