import { Router, Request, Response } from 'express';
import ActivationService from '../services/activationService';

interface ActivateRequest {
  key: string;
}

function createActivateRouter(activationService: ActivationService): Router {
  const router = Router();

  router.post('/activate', (req: Request, res: Response) => {
    try {
      const { key }: ActivateRequest = req.body;

      if (!key) {
        return res.status(400).json({ 
          ok: false, 
          reason: 'Missing activation key' 
        });
      }

      const result = activationService.activate(key);
      
      if (result.ok) {
        res.json({
          ok: true,
          identifier: result.identifier,
          plan: result.plan,
          expiry: result.expiry
        });
      } else {
        res.status(400).json({
          ok: false,
          reason: result.reason
        });
      }
    } catch (error) {
      console.error('Activation error:', error);
      res.status(500).json({ 
        ok: false, 
        reason: 'Internal server error' 
      });
    }
  });

  return router;
}

export default createActivateRouter;