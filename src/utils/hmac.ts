import crypto from 'crypto';

export interface ActivationPayload {
  identifier: string;
  expiry: string;
  plan: string;
  nonce: string;
}

export interface VerificationResult {
  valid: boolean;
  payload?: ActivationPayload;
  reason?: string;
}

/**
 * Base64URL encode function
 */
function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Base64URL decode function
 */
function base64UrlDecode(str: string): string {
  // Add padding if needed
  const padding = '='.repeat((4 - (str.length % 4)) % 4);
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/') + padding;
  return Buffer.from(base64, 'base64').toString('utf-8');
}

/**
 * Generate HMAC-SHA256 signature
 */
function generateSignature(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Create an activation key with HMAC signature
 */
export function createActivationKey(
  identifier: string,
  expiry: string,
  plan: string,
  nonce: string,
  secret: string
): string {
  const payload = `${identifier}|${expiry}|${plan}|${nonce}`;
  const signature = generateSignature(payload, secret);
  const fullKey = `${payload}.${signature}`;
  return base64UrlEncode(fullKey);
}

/**
 * Verify activation key and extract payload
 */
export function verifyActivationKey(key: string, secret: string): VerificationResult {
  try {
    const decoded = base64UrlDecode(key);
    const parts = decoded.split('|');
    console.log('Decoded key parts:', parts);

    if (parts.length !== 4) {
      return { valid: false, reason: 'Invalid payload format' };
    }

    const [identifier, expiry, plan, nonceAndSig] = parts;

    // Split nonce and signature
    const lastParts = nonceAndSig.split('.');
    if (lastParts.length !== 2) {
      return { valid: false, reason: 'Invalid nonce/signature format' };
    }

    const [nonce, signature] = lastParts;

    // Recreate payload exactly like generator
    const payload = `${identifier}|${expiry}|${plan}|${nonce}`;
    console.log('Recreated payload for signature verification:', payload);
    console.log('Secret used for signature verification:', secret);
    const expectedSignature = generateSignature(payload, secret);
console.log('Expected signature:', expectedSignature);
console.log('Provided signature:', signature);
    if (signature !== expectedSignature) {
      return { valid: false, reason: 'Invalid signature' };
    }

    // Validate expiry
    const expiryDate = new Date(expiry);
    if (isNaN(expiryDate.getTime())) {
      return { valid: false, reason: 'Invalid expiry date format' };
    }

    if (expiryDate <= new Date()) {
      return { valid: false, reason: 'Key has expired' };
    }

    return {
      valid: true,
      payload: { identifier, expiry, plan, nonce }
    };
  } catch (error) {
    return { valid: false, reason: 'Key decoding failed' };
  }
}
