import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { db } from './db.ts';
import { User } from './types.ts';

const TOKEN_SECRET = process.env.TOKEN_SECRET || 'career_definer_secure_jwt_secret_2026_antigravity';

export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const generatedSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, generatedSalt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt: generatedSalt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const calculated = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(calculated), Buffer.from(hash));
}

export function createToken(userId: string, role: string): string {
  const payload = {
    userId,
    role,
    issuedAt: Date.now(),
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  };
  const json = JSON.stringify(payload);
  const base64Payload = Buffer.from(json).toString('base64url');
  const signature = crypto.createHmac('sha256', TOKEN_SECRET).update(base64Payload).digest('base64url');
  return `${base64Payload}.${signature}`;
}

export function verifyToken(token: string): { userId: string; role: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [base64Payload, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', TOKEN_SECRET).update(base64Payload).digest('base64url');
    if (signature !== expectedSig) return null;

    const payload = JSON.parse(Buffer.from(base64Payload, 'base64url').toString('utf8'));
    if (payload.expiresAt && Date.now() > payload.expiresAt) {
      return null;
    }
    return { userId: payload.userId, role: payload.role };
  } catch {
    return null;
  }
}

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'] || req.headers['x-auth-token'];
  let token: string | undefined;

  if (typeof authHeader === 'string') {
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7).trim();
    } else {
      token = authHeader.trim();
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication token required' });
  }

  const verified = verifyToken(token);
  if (!verified) {
    return res.status(401).json({ success: false, message: 'Invalid or expired authentication token' });
  }

  const user = db.findUserById(verified.userId);
  if (!user || !user.isActive) {
    return res.status(401).json({ success: false, message: 'Account not found or inactive' });
  }

  req.user = user;
  next();
}

export function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'] || req.headers['x-auth-token'];
  let token: string | undefined;

  if (typeof authHeader === 'string') {
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7).trim();
    } else {
      token = authHeader.trim();
    }
  }

  if (token) {
    const verified = verifyToken(token);
    if (verified) {
      const user = db.findUserById(verified.userId);
      if (user && user.isActive) {
        req.user = user;
      }
    }
  }
  next();
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Unauthorized access. Administrator privileges required.' });
  }
  next();
}

export function requireStudent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  next();
}
