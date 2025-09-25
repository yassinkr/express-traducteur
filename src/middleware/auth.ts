import { Request, Response, NextFunction } from 'express';
import ActivationService from '../services/activationService';

interface AuthRequest extends Request {
  identifier?: string;
}

/**
 * Middleware to check if request has valid activation
 */
export function requireActivation(activationService: ActivationService) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const identifier = req.headers['x-identifier'] as string;
    
    if (!identifier) {
      return res.status(401).json({ 
        ok: false, 
        error: 'Missing identifier header' 
      });
    }

    if (!activationService.isActive(identifier)) {
      return res.status(401).json({ 
        ok: false, 
        error: 'Invalid or expired activation' 
      });
    }

    req.identifier = identifier;
    next();
  };
}