import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import ActivationService from './services/activationService';
import createApiRoutes from './routes';
import TranslateService from './services/translationService';

// Load environment variables
dotenv.config();

class App {
  public app: express.Application;
  private activationService!: ActivationService;
  private translateService!: TranslateService;

  constructor() {
    this.app = express();
    this.initializeServices();
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
    this.startCleanupTasks();
  }

  private initializeServices(): void {
    const actKeySecret = process.env.ACT_KEY_SECRET;
    if (!actKeySecret) {
      throw new Error('ACT_KEY_SECRET environment variable is required');
    }

    // Google Cloud Translation configuration
    const googleProjectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const googleKeyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    const googleApiKey = process.env.GOOGLE_TRANSLATE_API_KEY;

    // Validate Google Cloud configuration
    if (!googleProjectId && !googleApiKey) {
      throw new Error('Either GOOGLE_CLOUD_PROJECT_ID (with service account) or GOOGLE_TRANSLATE_API_KEY must be provided');
    }

    this.activationService = new ActivationService(actKeySecret);
    this.translateService = new TranslateService(googleProjectId, googleKeyFilename, googleApiKey);
  }

  private initializeMiddleware(): void {
    // Enhanced request logging middleware (FIRST - before any other middleware)
    this.app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
      const timestamp = new Date().toISOString();
      const requestId = Math.random().toString(36).substring(2, 15);
      
      console.log('\n' + '='.repeat(60));
      console.log(`📥 [${timestamp}] [ID: ${requestId}]`);
      console.log(`${req.method} ${req.originalUrl}`);
      console.log(`🌐 From: ${req.ip || req.connection.remoteAddress}`);
      console.log(`📋 User-Agent: ${req.get('User-Agent') || 'Unknown'}`);
      console.log(`📦 Content-Type: ${req.get('Content-Type') || 'None'}`);
      
      // Store request ID for response logging
      (req as any).requestId = requestId;
      (req as any).startTime = Date.now();
      
      // Override res.json to log responses
      const originalJson = res.json;
      res.json = function(body?: any) {
        const duration = Date.now() - (req as any).startTime;
        console.log(`\n📤 [${timestamp}] [ID: ${requestId}] RESPONSE`);
        console.log(`Status: ${res.statusCode} | Duration: ${duration}ms`);
        console.log('Response Body:', JSON.stringify(body, null, 2));
        console.log('='.repeat(60));
        return originalJson.call(this, body);
      };
      
      next();
    });

    // Security middleware
    this.app.use(helmet());
    
    // CORS
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true
    }));

    // Rate limiting
    const rateLimitWindowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000');
    const rateLimitMaxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100');
    
    this.app.use(rateLimit({
      windowMs: rateLimitWindowMs,
      max: rateLimitMaxRequests,
      message: { ok: false, error: 'Too many requests, please try again later' },
      standardHeaders: true,
      legacyHeaders: false
    }));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Body logging middleware (AFTER body parsing)
    this.app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
      const requestId = (req as any).requestId;
      
      if (Object.keys(req.body).length > 0) {
        console.log(`📝 [ID: ${requestId}] Request Body:`, JSON.stringify(req.body, null, 2));
      }
      
      if (Object.keys(req.query).length > 0) {
        console.log(`🔍 [ID: ${requestId}] Query Params:`, JSON.stringify(req.query, null, 2));
      }
      
      if (Object.keys(req.params).length > 0) {
        console.log(`🎯 [ID: ${requestId}] Route Params:`, JSON.stringify(req.params, null, 2));
      }

      // Log important headers
      const importantHeaders = ['authorization', 'content-type', 'accept', 'x-api-key'];
      const headers: any = {};
      importantHeaders.forEach(header => {
        if (req.get(header)) {
          headers[header] = req.get(header);
        }
      });
      
      if (Object.keys(headers).length > 0) {
        console.log(`📋 [ID: ${requestId}] Headers:`, JSON.stringify(headers, null, 2));
      }
      
      next();
    });
  }

  private initializeRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req: express.Request, res: express.Response) => {
      const requestId = (req as any).requestId;
      console.log(`🏥 [ID: ${requestId}] Health check requested`);
      res.json({ 
        ok: true,
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        service: 'Traducteur Rapide API',
        version: '1.0.0'
      });
    });

    // API routes
    this.app.use('/api', createApiRoutes(this.activationService, this.translateService));

    // 404 handler
    this.app.use((req: express.Request, res: express.Response) => {
      const requestId = (req as any).requestId;
      console.log(`❓ [ID: ${requestId}] 404 - Route not found: ${req.method} ${req.originalUrl}`);
      res.status(404).json({
        ok: false,
        error: "Endpoint not found",
        requestedUrl: req.originalUrl,
        method: req.method,
        availableEndpoints: ['/health', '/api/activate', '/api/translate']
      });
    });
  }

  private initializeErrorHandling(): void {
    // Global error handler
    this.app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      const requestId = (req as any).requestId;
      console.error(`💥 [ID: ${requestId}] Unhandled error:`, err);
      console.error(`💥 [ID: ${requestId}] Error stack:`, err.stack);
      console.error(`💥 [ID: ${requestId}] Request details:`, {
        method: req.method,
        url: req.originalUrl,
        body: req.body,
        query: req.query,
        params: req.params
      });
      
      res.status(500).json({
        ok: false,
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
        requestId: requestId
      });
    });
  }

  private startCleanupTasks(): void {
    // Periodic cleanup task for expired activations
  }

  public listen(port: number): void {
    this.app.listen(port, () => {
      console.log('\n' + '🚀'.repeat(20));
      console.log(`🚀 Traducteur Rapide server running on port ${port}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📡 Health check: http://localhost:${port}/health`);
      console.log(`🔧 API activate: http://localhost:${port}/api/activate`);
      console.log(`🔧 API translate: http://localhost:${port}/api/translate`);
      console.log(`📝 Enhanced request logging is ENABLED`);
      console.log('🚀'.repeat(20) + '\n');
    });
  }
}

export default App;