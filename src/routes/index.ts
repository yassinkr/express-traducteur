// routes/index.ts
import { Router, Request, Response } from 'express';
import ActivationService from '../services/activationService';
import TranslateService from '../services/translationService';

interface ActivateRequest {
  key: string;
}

interface ActivationResponse {
  success: boolean;
  userId?: string;
  message?: string;
  expiresAt?: string;
}

function createApiRoutes(activationService: ActivationService, translateService: TranslateService): Router {
  const router = Router();

  // Activation endpoint
  router.post('/activate', (req: Request, res: Response) => {
    const requestId = (req as any).requestId || 'unknown';
    
    console.log(`\n🔐 [ID: ${requestId}] === PROCESSING ACTIVATION ===`);
    
    try {
      const { key }: ActivateRequest = req.body;
      
      console.log(`🔑 [ID: ${requestId}] Extracted key from body:`, key ? `${key.substring(0, 4)}...${key.substring(key.length - 4)}` : 'null');
      console.log(`📊 [ID: ${requestId}] Key type:`, typeof key);
      console.log(`📏 [ID: ${requestId}] Key length:`, key ? key.length : 'N/A');
      
      if (!key) {
        console.log(`❌ [ID: ${requestId}] Missing activation key`);
        const errorResponse: ActivationResponse = { 
          success: false,
          message: 'Missing activation key' 
        };
        return res.status(400).json(errorResponse);
      }

      if (typeof key !== 'string') {
        console.log(`❌ [ID: ${requestId}] Invalid key type:`, typeof key);
        const errorResponse: ActivationResponse = { 
          success: false,
          message: 'Activation key must be a string' 
        };
        return res.status(400).json(errorResponse);
      }

      const trimmedKey = key.trim();
      if (!trimmedKey) {
        console.log(`❌ [ID: ${requestId}] Empty key after trimming`);
        const errorResponse: ActivationResponse = { 
          success: false,
          message: 'Activation key cannot be empty' 
        };
        return res.status(400).json(errorResponse);
      }

      console.log(`🔄 [ID: ${requestId}] Calling activation service with trimmed key...`);
      const result = activationService.activate(trimmedKey);
      console.log(`📋 [ID: ${requestId}] Activation service result:`, result);
      
      if (result.ok) {
        console.log(`✅ [ID: ${requestId}] Activation successful`);
        
        // Transform server response to match client expectations
        const successResponse: ActivationResponse = {
          success: true,
          userId: result.identifier || `user-${Date.now()}`,
          expiresAt: result.expiry || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          message: 'Activation successful'
        };
        
        console.log(`🎉 [ID: ${requestId}] Sending success response:`, successResponse);
        res.json(successResponse);
      } else {
        console.log(`❌ [ID: ${requestId}] Activation failed:`, result.reason);
        
        const failureResponse: ActivationResponse = {
          success: false,
          message: result.reason || 'Activation failed'
        };
        
        console.log(`🚫 [ID: ${requestId}] Sending failure response:`, failureResponse);
        res.status(400).json(failureResponse);
      }
    } catch (error) {
      console.error(`💥 [ID: ${requestId}] Activation error:`, error);
      console.error(`💥 [ID: ${requestId}] Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
      
      const errorResponse: ActivationResponse = { 
        success: false,
        message: 'Internal server error' 
      };
      
      console.log(`🚨 [ID: ${requestId}] Sending internal error response:`, errorResponse);
      res.status(500).json(errorResponse);
    }
    
    console.log(`🏁 [ID: ${requestId}] === ACTIVATION PROCESSING COMPLETE ===\n`);
  });

  // Translation endpoint
  router.post('/translate', async (req: Request, res: Response) => {
    const requestId = (req as any).requestId || 'unknown';
    console.log(`\n🌍 [ID: ${requestId}] === PROCESSING TRANSLATION ===`);
    
    try {
      const { text, targetLanguage, sourceLanguage } = req.body;
      
      console.log(`📝 [ID: ${requestId}] Translation request:`, {
        text: text ? `${text.substring(0, 50)}...` : 'null',
        targetLanguage,
        sourceLanguage
      });

      // Add your translation logic here
      const result = await translateService.translation({
        text,
        targetLanguage,
        sourceLanguage
      });

      console.log(`✅ [ID: ${requestId}] Translation successful`);
      res.json({
        success: true,
        translatedText: result.translatedText,
        detectedLanguage: result.detectedLanguage
      });

    } catch (error) {
      console.error(`💥 [ID: ${requestId}] Translation error:`, error);
      res.status(500).json({
        success: false,
        message: 'Translation failed'
      });
    }
    
    console.log(`🏁 [ID: ${requestId}] === TRANSLATION PROCESSING COMPLETE ===\n`);
  });

  return router;
}

export default createApiRoutes;
