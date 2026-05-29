/**
 * Validation utility functions
 */

import { z } from 'zod';
import { VALIDATION, PHONE_REGEX, EMAIL_REGEX } from '@/constants';

/**
 * Validate password strength
 */
export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < VALIDATION.PASSWORD_MIN_LENGTH) {
    errors.push(`Password minimal ${VALIDATION.PASSWORD_MIN_LENGTH} karakter`);
  }

  if (VALIDATION.PASSWORD_REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push('Password harus mengandung huruf besar');
  }

  if (VALIDATION.PASSWORD_REQUIRE_NUMBERS && !/\d/.test(password)) {
    errors.push('Password harus mengandung angka');
  }

  if (VALIDATION.PASSWORD_REQUIRE_SPECIAL && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password harus mengandung karakter spesial (!@#$%^&*)');
  }

  return { valid: errors.length === 0, errors };
};

/**
 * Validate phone number (Indonesia format)
 */
export const validatePhone = (phone: string): boolean => {
  return PHONE_REGEX.test(phone.trim());
};

/**
 * Validate NIK (Indonesian ID number)
 * Currently only checks format, not checksum
 */
export const validateNIK = (nik: string): boolean => {
  return /^\d{16}$/.test(nik.trim());
};

/**
 * Validate email
 */
export const validateEmail = (email: string): boolean => {
  return EMAIL_REGEX.test(email.trim());
};

/**
 * Validate date format and logical validity
 */
export const validateDate = (dateString: string): boolean => {
  try {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  } catch {
    return false;
  }
};

/**
 * Validate birth date (not in future, reasonable age)
 */
export const validateBirthDate = (dateString: string): { valid: boolean; error?: string } => {
  if (!validateDate(dateString)) {
    return { valid: false, error: 'Format tanggal tidak valid' };
  }

  const birthDate = new Date(dateString);
  const today = new Date();

  if (birthDate > today) {
    return { valid: false, error: 'Tanggal lahir tidak boleh di masa depan' };
  }

  const age = today.getFullYear() - birthDate.getFullYear();
  if (age < 18) {
    return { valid: false, error: 'Usia minimal 18 tahun' };
  }

  if (age > 100) {
    return { valid: false, error: 'Tanggal lahir tidak valid' };
  }

  return { valid: true };
};

/**
 * Validate file type by MIME type
 */
export const validateFileType = (file: File, acceptedTypes: string[]): boolean => {
  return acceptedTypes.includes(file.type) || 
         acceptedTypes.includes(`.${file.name.split('.').pop()?.toLowerCase()}`);
};

/**
 * Validate file size
 */
export const validateFileSize = (file: File, maxSizeBytes: number = VALIDATION.FILE_MAX_SIZE): boolean => {
  return file.size <= maxSizeBytes;
};

/**
 * Validate URL format
 */
export const validateURL = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate GPA score (0-4.0)
 */
export const validateGPA = (gpa: number): boolean => {
  return gpa >= 0 && gpa <= 4.0;
};

/**
 * Zod schema for registration form
 */
export const registrationSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(12, 'Password minimal 12 karakter'),
  nik: z.string().regex(/^\d{16}$/, 'NIK harus 16 digit'),
  full_name: z.string().min(3, 'Nama minimal 3 karakter'),
  gender: z.enum(['male', 'female']),
  birth_date: z.string().refine((date) => validateBirthDate(date).valid, {
    message: validateBirthDate(new Date().toISOString()).error || 'Tanggal lahir tidak valid',
  }),
  phone: z.string().refine(validatePhone, 'Nomor WhatsApp tidak valid'),
  address_domicile: z.string().min(5, 'Alamat minimal 5 karakter'),
  city: z.string().min(3, 'Kota minimal 3 karakter'),
});

/**
 * Zod schema for login
 */
export const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
});

/**
 * Parse and validate stored form data
 */
export const parseStoredFormData = (jsonString: string): unknown => {
  try {
    return JSON.parse(jsonString);
  } catch {
    return null;
  }
};
