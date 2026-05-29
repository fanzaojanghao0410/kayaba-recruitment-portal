/**
 * Error handling utilities
 */

import { ERROR_MESSAGES } from '@/constants';

/**
 * Application-level error class
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: string = 'UNKNOWN_ERROR',
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Map Supabase errors to user-friendly messages
 */
export const mapSupabaseError = (error: unknown): { message: string; code: string } => {
  if (!error) {
    return { message: ERROR_MESSAGES.SERVER_ERROR, code: 'UNKNOWN_ERROR' };
  }

  const err = error as any;
  const message = err.message || err.toString();

  // Auth errors
  if (message.includes('Invalid login credentials')) {
    return { message: ERROR_MESSAGES.INVALID_CREDENTIALS, code: 'INVALID_CREDENTIALS' };
  }

  if (message.includes('User already registered')) {
    return { message: 'Email sudah terdaftar', code: 'USER_EXISTS' };
  }

  if (message.includes('Email not confirmed')) {
    return { message: 'Email belum dikonfirmasi', code: 'EMAIL_NOT_CONFIRMED' };
  }

  if (message.includes('Password')) {
    return { message: 'Password tidak valid', code: 'INVALID_PASSWORD' };
  }

  if (message.includes('Unauthorized')) {
    return { message: ERROR_MESSAGES.UNAUTHORIZED, code: 'UNAUTHORIZED' };
  }

  if (message.includes('Forbidden')) {
    return { message: ERROR_MESSAGES.FORBIDDEN, code: 'FORBIDDEN' };
  }

  if (message.includes('not found')) {
    return { message: ERROR_MESSAGES.NOT_FOUND, code: 'NOT_FOUND' };
  }

  // Network errors
  if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
    return { message: ERROR_MESSAGES.NETWORK_ERROR, code: 'NETWORK_ERROR' };
  }

  if (message.includes('timeout')) {
    return { message: ERROR_MESSAGES.TIMEOUT, code: 'TIMEOUT' };
  }

  // File errors
  if (message.includes('file too large')) {
    return { message: ERROR_MESSAGES.FILE_TOO_LARGE, code: 'FILE_TOO_LARGE' };
  }

  if (message.includes('invalid file')) {
    return { message: ERROR_MESSAGES.INVALID_FILE_TYPE, code: 'INVALID_FILE_TYPE' };
  }

  // Default
  return { message: ERROR_MESSAGES.SERVER_ERROR, code: 'SERVER_ERROR' };
};

/**
 * Wrap promise with timeout
 */
export const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new AppError(ERROR_MESSAGES.TIMEOUT, 'TIMEOUT', 408)), timeoutMs)
    ),
  ]);
};

/**
 * Retry async function with exponential backoff
 */
export const retryAsync = async <T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  initialDelayMs: number = 1000
): Promise<T> => {
  let lastError: any;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxAttempts) {
        const delayMs = initialDelayMs * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError;
};

/**
 * Safe JSON parse with error handling
 */
export const safeJsonParse = <T = unknown>(
  json: string,
  fallback: T | null = null
): T | null => {
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    console.error('Failed to parse JSON:', error);
    return fallback;
  }
};

/**
 * Safe JSON stringify with error handling
 */
export const safeJsonStringify = (data: unknown, fallback: string = '{}'): string => {
  try {
    return JSON.stringify(data);
  } catch (error) {
    console.error('Failed to stringify JSON:', error);
    return fallback;
  }
};

/**
 * Create a structured error log
 */
export const createErrorLog = (
  error: unknown,
  context: Record<string, unknown> = {}
) => {
  const timestamp = new Date().toISOString();
  const errorObj = error instanceof Error ? error : new Error(String(error));

  return {
    timestamp,
    message: errorObj.message,
    stack: errorObj.stack,
    context,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
  };
};

/**
 * Sanitize error message for display (remove sensitive info)
 */
export const sanitizeErrorMessage = (message: string): string => {
  return message
    .replace(/\b[\w\.-]+@[\w\.-]+\.\w+\b/g, '[email]') // Remove emails
    .replace(/\d{16}/g, '[HIDDEN]') // Remove NIK
    .replace(/\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g, '[HIDDEN]'); // Remove card numbers
};

/**
 * Check if error is retryable
 */
export const isRetryableError = (error: unknown): boolean => {
  if (!(error instanceof AppError)) return false;

  const retryableErrors = ['NETWORK_ERROR', 'TIMEOUT', 'TEMPORARILY_UNAVAILABLE'];
  return retryableErrors.includes(error.code);
};
