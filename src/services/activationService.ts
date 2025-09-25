import { verifyActivationKey, ActivationPayload } from '../utils/hmac';

interface ActivationSession {
  identifier: string;
  plan: string;
  expiry: string;
  activatedAt: Date;
}

class ActivationService {
  private activeSessions: Map<string, ActivationSession> = new Map();
  private secret: string;

  constructor(secret: string) {
    this.secret = secret;
  }

  /**
   * Activate a key and store session
   */
  activate(key: string): { ok: boolean; identifier?: string; plan?: string; expiry?: string; reason?: string } {
    const verification = verifyActivationKey(key, this.secret);
    
    if (!verification.valid || !verification.payload) {
      return { ok: false, reason: verification.reason };
    }

    const { identifier, plan, expiry } = verification.payload;
    
    // Store active session
    this.activeSessions.set(identifier, {
      identifier,
      plan,
      expiry,
      activatedAt: new Date()
    });

    return { ok: true, identifier, plan, expiry };
  }

  /**
   * Check if identifier has active session
   */
  isActive(identifier: string): boolean {
    const session = this.activeSessions.get(identifier);
    if (!session) return false;

    // Check if session is still valid
    const now = new Date();
    const expiryDate = new Date(session.expiry);
    
    if (expiryDate <= now) {
      this.activeSessions.delete(identifier);
      return false;
    }

    return true;
  }

  /**
   * Get session info
   */
  getSession(identifier: string): ActivationSession | null {
    return this.activeSessions.get(identifier) || null;
  }

  /**
   * Clean expired sessions
   */
  cleanExpiredSessions(): void {
    const now = new Date();
    for (const [identifier, session] of this.activeSessions.entries()) {
      const expiryDate = new Date(session.expiry);
      if (expiryDate <= now) {
        this.activeSessions.delete(identifier);
      }
    }
  }
}

export default ActivationService;