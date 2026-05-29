/**
 * Authentication middleware for server-side route protection
 */

import { createMiddlewareClient } from '@supabase/auth-helpers-remix';
import { Request, Response } from '@web/express';

export interface AuthRequest extends Request {
  auth?: {
    user: { id: string; email: string };
    roles: string[];
  };
}

/**
 * Middleware to verify JWT token and attach user/roles to request
 */
export async function authMiddleware(req: AuthRequest, res: Response, next: () => void) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      req.auth = undefined;
      return next();
    }

    const token = authHeader.slice(7);
    // Verify token with Supabase - would be called on the server
    // This is a placeholder for actual token verification
    req.auth = { user: { id: '', email: '' }, roles: [] };
    next();
  } catch (error) {
    req.auth = undefined;
    next();
  }
}

/**
 * Middleware to require authentication
 */
export async function requireAuth(req: AuthRequest, res: Response, next: () => void) {
  if (!req.auth?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

/**
 * Middleware to require specific roles
 */
export function requireRoles(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: () => void) => {
    if (!req.auth?.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const hasRole = req.auth.roles.some((role) => allowedRoles.includes(role));
    if (!hasRole) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    next();
  };
}

/**
 * Verify that user has admin or HR role
 */
export function isAdminOrHR(roles: string[]): boolean {
  return roles.includes('admin') || roles.includes('hr');
}

/**
 * Verify that user is admin only
 */
export function isAdmin(roles: string[]): boolean {
  return roles.includes('admin');
}

/**
 * Verify that user is applicant
 */
export function isApplicant(roles: string[]): boolean {
  return roles.includes('applicant');
}

/**
 * Rate limiting middleware
 */
interface RateLimitStore {
  [key: string]: { count: number; resetTime: number };
}

const rateLimitStore: RateLimitStore = {};

export function rateLimit(maxRequests: number = 100, windowMs: number = 60 * 1000) {
  return (req: AuthRequest, res: Response, next: () => void) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const userLimit = rateLimitStore[key];

    if (!userLimit) {
      rateLimitStore[key] = { count: 1, resetTime: now + windowMs };
      return next();
    }

    if (now > userLimit.resetTime) {
      rateLimitStore[key] = { count: 1, resetTime: now + windowMs };
      return next();
    }

    userLimit.count++;
    if (userLimit.count > maxRequests) {
      res.set('Retry-After', String(Math.ceil((userLimit.resetTime - now) / 1000)));
      return res.status(429).json({ error: 'Too many requests' });
    }

    next();
  };
}
