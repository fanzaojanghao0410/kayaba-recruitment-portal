-- Migration: Add missing indexes for performance optimization
-- Date: 2026-05-28
-- Purpose: Add indexes on frequently queried columns to improve query performance

-- Index on applications.status (used in every dashboard query)
CREATE INDEX IF NOT EXISTS idx_applications_status 
ON applications(status);

-- Index on applications job_id + user_id (used in application lookup)
CREATE INDEX IF NOT EXISTS idx_applications_job_user 
ON applications(job_id, user_id);

-- Index on applications user_id (used to fetch user applications)
CREATE INDEX IF NOT EXISTS idx_applications_user_id 
ON applications(user_id);

-- Index on jobs.status (used in job listings)
CREATE INDEX IF NOT EXISTS idx_jobs_status 
ON jobs(status);

-- Index on jobs.posted_by (used to fetch admin's jobs)
CREATE INDEX IF NOT EXISTS idx_jobs_posted_by 
ON jobs(posted_by);

-- Index on user_roles.user_id (used in auth context)
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id 
ON user_roles(user_id);

-- Composite index for applications with created_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_applications_status_created 
ON applications(status, created_at DESC);

-- Index on applications.screening_score for sorting/filtering
CREATE INDEX IF NOT EXISTS idx_applications_screening_score 
ON applications(screening_score) 
WHERE screening_score IS NOT NULL;

-- Index on educations and experiences for user lookup
CREATE INDEX IF NOT EXISTS idx_educations_user_id 
ON educations(user_id);

CREATE INDEX IF NOT EXISTS idx_experiences_user_id 
ON experiences(user_id);

CREATE INDEX IF NOT EXISTS idx_applicant_skills_user_id 
ON applicant_skills(user_id);

-- Index for faster search queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_full_name 
ON user_profiles USING GIN(full_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_jobs_title 
ON jobs USING GIN(title gin_trgm_ops);

-- Add timeline index
CREATE INDEX IF NOT EXISTS idx_application_timeline_application_id 
ON application_timeline(application_id);
