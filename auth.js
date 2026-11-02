/**
 * Ethiopost Marketing Command Center
 * Native Cryptography & Zero-Dependency Authentication Engine
 * Pure Node.js built-in node:crypto
 */

import crypto from 'node:crypto';

// Secret key for HMAC token signing (configurable via environment variable)
const AUTH_SECRET = process.env.AUTH_SECRET || 'ethiopost-command-center-hmac-sha256-secret-key-2026';

/**
 * Hash password using scrypt with unique salt
 * @param {string} password 
 * @param {string} [salt]
 * @returns {{ hash: string, salt: string }}
 */
export function hashPassword(password, salt = null) {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, actualSalt, 64).toString('hex');
  return { hash, salt: actualSalt };
}

/**
 * Verify password against stored hash and salt (timing-safe)
 * @param {string} password 
 * @param {string} hash 
 * @param {string} salt 
 * @returns {boolean}
 */
export function verifyPassword(password, hash, salt) {
  if (!password || !hash || !salt) return false;
  try {
    const testHash = crypto.scryptSync(password, salt, 64).toString('hex');
    const a = Buffer.from(testHash, 'hex');
    const b = Buffer.from(hash, 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch (err) {
    return false;
  }
}

/**
 * Generate stateless HMAC-SHA256 signed JWT token
 * Valid for 7 days
 * @param {object} user 
 * @param {number} [expiresInMs]
 * @returns {string}
 */
export function generateToken(user, expiresInMs = 7 * 24 * 3600 * 1000) {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const payload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department || 'Marketing & Digital Communications',
    avatar: user.avatar || 'EP',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor((Date.now() + expiresInMs) / 1000)
  };

  const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(`${headerB64}.${payloadB64}`)
    .digest('base64url');

  return `${headerB64}.${payloadB64}.${signature}`;
}

/**
 * Verify and decode HMAC-SHA256 token
 * @param {string} token 
 * @returns {object|null} Decoded payload or null if invalid/expired
 */
export function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [headerB64, payloadB64, signature] = parts;

  try {
    // Verify signature with timing-safe comparison
    const expectedSignature = crypto
      .createHmac('sha256', AUTH_SECRET)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64url');

    const sigA = Buffer.from(signature);
    const sigB = Buffer.from(expectedSignature);

    if (sigA.length !== sigB.length || !crypto.timingSafeEqual(sigA, sigB)) {
      return null;
    }

    // Decode and verify expiration
    const payloadJson = Buffer.from(payloadB64, 'base64url').toString('utf8');
    const payload = JSON.parse(payloadJson);

    const nowSeconds = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < nowSeconds) {
      return null; // Expired
    }

    return payload;
  } catch (err) {
    return null;
  }
}
