import { Router, Request, Response } from 'express';
import TranslateService from '../services/translationService';
import ActivationService from '../services/activationService';
import { requireActivation } from '../middleware/auth';

interface AuthRequest extends Request {
  identifier?: string;
}

interface TranslateRequest {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
}

interface DetectLanguageRequest {
  text: string;
}

function createTranslateRouter(
  translateService: TranslateService,
  activationService: ActivationService
): Router {
  const router = Router();

  // Translation endpoint
  router.post(
    '/translate',
    requireActivation(activationService),
    async (req: AuthRequest, res: Response) => {
      try {
        const { text, sourceLanguage, targetLanguage }: TranslateRequest = req.body;

        // Validate input
        if (!text || !sourceLanguage || !targetLanguage) {
          return res.status(400).json({
            ok: false,
            error: 'Missing required fields: text, sourceLanguage, targetLanguage'
          });
        }

        if (typeof text !== 'string' || text.trim().length === 0) {
          return res.status(400).json({
            ok: false,
            error: 'Text must be a non-empty string'
          });
        }

        if (typeof sourceLanguage !== 'string' || typeof targetLanguage !== 'string') {
          return res.status(400).json({
            ok: false,
            error: 'Source and target must be valid language codes'
          });
        }

        // Check text length (Google Translate has limits)
        if (text.length > 5000) {
          return res.status(400).json({
            ok: false,
            error: 'Text is too long. Maximum length is 5000 characters'
          });
        }

        // Perform translation
        const result = await translateService.translation({ text, sourceLanguage, targetLanguage });
        
        if (result.ok) {
          res.json({
            ok: true,
            translatedText: result.translatedText,
            detectedLanguage: result.detectedLanguage
          });
        } else {
          // Determine appropriate status code based on error
          let statusCode = 502; // Bad Gateway (service error)
          if (result.error?.includes('Invalid') || result.error?.includes('unsupported')) {
            statusCode = 400; // Bad Request
          } else if (result.error?.includes('Access denied') || result.error?.includes('permissions')) {
            statusCode = 403; // Forbidden
          } else if (result.error?.includes('Rate limit')) {
            statusCode = 429; // Too Many Requests
          }

          res.status(statusCode).json({
            ok: false,
            error: result.error
          });
        }
      } catch (error) {
        console.error('Translation endpoint error:', error);
        res.status(500).json({
          ok: false,
          error: 'Internal server error'
        });
      }
    }
  );

  // Language detection endpoint
  router.post(
    '/detect',
    requireActivation(activationService),
    async (req: AuthRequest, res: Response) => {
      try {
        const { text }: DetectLanguageRequest = req.body;

        if (!text || typeof text !== 'string' || text.trim().length === 0) {
          return res.status(400).json({
            ok: false,
            error: 'Text is required and must be a non-empty string'
          });
        }

        const result = await translateService.detectLanguage(text);
        
        if (result.ok) {
          res.json({
            ok: true,
            detectedLanguage: result.detectedLanguage,
            confidence: result.confidence
          });
        } else {
          res.status(502).json({
            ok: false,
            error: result.error
          });
        }
      } catch (error) {
        console.error('Language detection endpoint error:', error);
        res.status(500).json({
          ok: false,
          error: 'Internal server error'
        });
      }
    }
  );

  // Supported languages endpoint
  router.get(
    '/languages',
    requireActivation(activationService),
    async (req: AuthRequest, res: Response) => {
      try {
        const result = await translateService.getSupportedLanguages();
        
        if (result.ok) {
          res.json({
            ok: true,
            languages: result.languages
          });
        } else {
          res.status(502).json({
            ok: false,
            error: result.error
          });
        }
      } catch (error) {
        console.error('Supported languages endpoint error:', error);
        res.status(500).json({
          ok: false,
          error: 'Internal server error'
        });
      }
    }
  );

  return router;
}

export default createTranslateRouter;