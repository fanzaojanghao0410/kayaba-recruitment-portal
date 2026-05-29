/**
 * Application Constants
 */

// Role constants
export const ROLES = {
  ADMIN: 'admin',
  HR: 'hr',
  APPLICANT: 'applicant',
} as const;

export type RoleType = typeof ROLES[keyof typeof ROLES];

// Storage keys
export const STORAGE_KEYS = {
  DRAFT_FORM: 'kyb_register_draft_v1',
  AUTH_TOKEN: 'kyb_auth_token',
  USER_PREFERENCES: 'kyb_user_prefs',
} as const;

// Application statuses
export const APPLICATION_STATUS = {
  NEW: 'new',
  SCREENING: 'screening',
  SHORTLISTED: 'shortlisted',
  INTERVIEW_SCHEDULED: 'interview_scheduled',
  INTERVIEW_COMPLETED: 'interview_completed',
  OFFERED: 'offered',
  HIRED: 'hired',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn',
} as const;

export type ApplicationStatusType = typeof APPLICATION_STATUS[keyof typeof APPLICATION_STATUS];

// Job status
export const JOB_STATUS = {
  OPEN: 'open',
  CLOSED: 'closed',
  DRAFT: 'draft',
  PUBLISHED: 'published',
  EXPIRED: 'expired',
} as const;

// Validation constraints
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 12,
  PASSWORD_REQUIRE_UPPERCASE: true,
  PASSWORD_REQUIRE_NUMBERS: true,
  PASSWORD_REQUIRE_SPECIAL: true,
  EMAIL_MAX_LENGTH: 255,
  PHONE_MIN_LENGTH: 9,
  PHONE_MAX_LENGTH: 15,
  NIK_LENGTH: 16,
  FILE_MAX_SIZE: 5 * 1024 * 1024, // 5MB
  FILE_ACCEPTED_TYPES: ['application/pdf', 'image/jpeg', 'image/png'],
} as const;

// Request timeout
export const REQUEST_TIMEOUT_MS = 15000; // 15 seconds

// Query cache times (in milliseconds)
export const CACHE_TIMES = {
  JOBS_LIST: 5 * 60 * 1000, // 5 minutes
  APPLICANT_DETAILS: 2 * 60 * 1000, // 2 minutes
  DASHBOARD_STATS: 3 * 60 * 1000, // 3 minutes
  USER_PROFILE: 10 * 60 * 1000, // 10 minutes
} as const;

// Phone number regex for Indonesia
export const PHONE_REGEX = /^(\+62|0)[0-9]{9,12}$/;

// Email regex (simplified)
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// API error messages
export const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Email atau password salah',
  NETWORK_ERROR: 'Terjadi kesalahan jaringan. Silakan coba lagi.',
  SERVER_ERROR: 'Terjadi kesalahan server. Silakan hubungi administrator.',
  UNAUTHORIZED: 'Anda tidak memiliki akses ke halaman ini.',
  FORBIDDEN: 'Anda tidak memiliki izin untuk melakukan aksi ini.',
  NOT_FOUND: 'Data yang dicari tidak ditemukan.',
  VALIDATION_ERROR: 'Data yang Anda masukkan tidak valid.',
  FILE_TOO_LARGE: 'Ukuran file terlalu besar. Maksimal 5MB.',
  INVALID_FILE_TYPE: 'Tipe file tidak didukung.',
  UPLOAD_ERROR: 'Gagal mengunggah file. Silakan coba lagi.',
  TIMEOUT: 'Permintaan timeout. Silakan coba lagi.',
} as const;

// Navigation paths
export const ROUTES = {
  HOME: '/',
  ABOUT: '/about',
  CONTACT: '/contact',
  LOGIN: '/login',
  ADMIN_LOGIN: '/admin-login',
  REGISTER: '/register',
  JOBS: '/jobs',
  JOB_DETAIL: (jobId: string) => `/jobs/${jobId}`,
  PROFILE: '/profile',
  ADMIN: '/admin',
  ADMIN_DASHBOARD: '/admin',
  ADMIN_JOBS: '/admin/jobs',
  ADMIN_APPLICANTS: '/admin/applicants',
} as const;

// Default pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 100,
} as const;
