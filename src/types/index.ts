/**
 * Application type definitions
 */

import { RoleType, ApplicationStatusType } from '@/constants';

/**
 * User types
 */
export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at?: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  gender: 'male' | 'female';
  birth_date: string;
  phone: string;
  nik: string;
  photo_url?: string;
  address_domicile: string;
  city: string;
  summary?: string;
  expected_salary?: number;
  linkedin_url?: string;
  portfolio_url?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Role and permissions
 */
export interface UserRole {
  id: string;
  user_id: string;
  role: RoleType;
  created_at: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
}

/**
 * Job and application types
 */
export interface Job {
  id: string;
  title: string;
  description: string;
  department: string;
  location: string;
  salary_min?: number;
  salary_max?: number;
  requirements: string;
  benefits?: string;
  status: 'open' | 'closed' | 'draft' | 'published' | 'expired';
  posted_by: string;
  applications_count?: number;
  created_at: string;
  updated_at: string;
  closed_at?: string;
}

export interface Application {
  id: string;
  job_id: string;
  user_id: string;
  status: ApplicationStatusType;
  screening_score?: number;
  interview_date?: string;
  interview_score?: number;
  hr_notes?: string;
  internal_rating?: number;
  created_at: string;
  updated_at: string;
  job?: Job;
  applicant?: UserProfile;
  educations?: Education[];
  experiences?: Experience[];
  skills?: ApplicantSkill[];
  timeline?: ApplicationTimeline[];
}

export interface Education {
  id: string;
  user_id: string;
  institution: string;
  degree: string;
  major: string;
  gpa: number;
  start_year: number;
  end_year: number;
  created_at: string;
}

export interface Experience {
  id: string;
  user_id: string;
  company_name: string;
  position: string;
  start_date: string;
  end_date?: string;
  is_current: boolean;
  description: string;
  created_at: string;
}

export interface ApplicantSkill {
  id: string;
  user_id: string;
  skill_name: string;
  proficiency_level: number; // 1-5
  created_at: string;
}

export interface ApplicationTimeline {
  id: string;
  application_id: string;
  status: ApplicationStatusType;
  title: string;
  description?: string;
  created_at: string;
  created_by?: string;
}

/**
 * Authentication types
 */
export interface AuthContext {
  user: User | null;
  session: any | null;
  roles: RoleType[];
  loading: boolean;
  signOut: () => Promise<void>;
  hasRole: (role: RoleType) => boolean;
}

/**
 * API Response types
 */
export interface ApiResponse<T> {
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  metadata?: {
    total?: number;
    page?: number;
    pageSize?: number;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Dashboard stats
 */
export interface DashboardStats {
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  applicationsThisMonth: number;
  applicationsLastMonth: number;
  totalApplicants: number;
  hiredThisMonth: number;
  rejectedThisMonth: number;
  pendingReview: number;
}

/**
 * Filter options
 */
export interface JobFilters {
  status?: string;
  department?: string;
  searchQuery?: string;
  page?: number;
  pageSize?: number;
}

export interface ApplicationFilters {
  status?: ApplicationStatusType;
  jobId?: string;
  searchQuery?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'date' | 'status' | 'score';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Form types
 */
export interface RegistrationFormData {
  email: string;
  password: string;
  passwordConfirm: string;
  nik: string;
  full_name: string;
  gender: 'male' | 'female';
  birth_date: string;
  phone: string;
  address_domicile: string;
  city: string;
  photo?: File;
  cv?: File;
  ijazah?: File;
  transcript?: File;
}

export interface LoginFormData {
  email: string;
  password: string;
}

/**
 * Notification types
 */
export interface Notification {
  id: string;
  user_id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}
