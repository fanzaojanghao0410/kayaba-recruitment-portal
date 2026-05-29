-- Migration: Add foreign key constraints and soft delete support
-- Date: 2026-05-28
-- Purpose: Ensure data integrity and enable audit trails

-- Verify and enforce existing foreign keys
ALTER TABLE IF EXISTS applications
ADD CONSTRAINT fk_applications_job_id 
FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS applications
ADD CONSTRAINT fk_applications_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS user_profiles
ADD CONSTRAINT fk_user_profiles_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS user_roles
ADD CONSTRAINT fk_user_roles_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS educations
ADD CONSTRAINT fk_educations_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS experiences
ADD CONSTRAINT fk_experiences_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS applicant_skills
ADD CONSTRAINT fk_applicant_skills_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS application_timeline
ADD CONSTRAINT fk_timeline_application_id 
FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE;

-- Add soft delete support to jobs (for audit trail)
ALTER TABLE IF EXISTS jobs 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Add soft delete support to applications
ALTER TABLE IF EXISTS applications 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Create view to exclude soft-deleted records
CREATE OR REPLACE VIEW active_jobs AS
SELECT * FROM jobs WHERE deleted_at IS NULL;

CREATE OR REPLACE VIEW active_applications AS
SELECT * FROM applications WHERE deleted_at IS NULL;

-- Add audit columns to jobs
ALTER TABLE IF EXISTS jobs
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add RLS policies for soft deletes if not exists
DROP POLICY IF EXISTS "Soft deleted jobs are hidden" ON jobs;
CREATE POLICY "Soft deleted jobs are hidden" ON jobs
  FOR SELECT USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "Soft deleted applications are hidden" ON applications;
CREATE POLICY "Soft deleted applications are hidden" ON applications
  FOR SELECT USING (deleted_at IS NULL);

-- Create function to handle updated_at automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for jobs.updated_at
DROP TRIGGER IF EXISTS update_jobs_updated_at ON jobs;
CREATE TRIGGER update_jobs_updated_at
BEFORE UPDATE ON jobs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for applications.updated_at
DROP TRIGGER IF EXISTS update_applications_updated_at ON applications;
CREATE TRIGGER update_applications_updated_at
BEFORE UPDATE ON applications
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Function to safely soft-delete a job
CREATE OR REPLACE FUNCTION soft_delete_job(job_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE jobs SET deleted_at = NOW() WHERE id = job_id AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to get admin dashboard stats with proper counts
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS TABLE (
  total_jobs BIGINT,
  active_jobs BIGINT,
  total_applications BIGINT,
  applications_this_month BIGINT,
  applications_last_month BIGINT,
  pending_applications BIGINT,
  hired_this_month BIGINT,
  rejected_this_month BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM jobs WHERE deleted_at IS NULL)::BIGINT,
    (SELECT COUNT(*) FROM jobs WHERE status = 'published' AND deleted_at IS NULL)::BIGINT,
    (SELECT COUNT(*) FROM applications WHERE deleted_at IS NULL)::BIGINT,
    (SELECT COUNT(*) FROM applications 
     WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())
     AND deleted_at IS NULL)::BIGINT,
    (SELECT COUNT(*) FROM applications 
     WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW() - INTERVAL '1 month')
     AND deleted_at IS NULL)::BIGINT,
    (SELECT COUNT(*) FROM applications 
     WHERE status IN ('new', 'screening', 'shortlisted', 'interview_scheduled')
     AND deleted_at IS NULL)::BIGINT,
    (SELECT COUNT(*) FROM applications 
     WHERE status = 'hired' 
     AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())
     AND deleted_at IS NULL)::BIGINT,
    (SELECT COUNT(*) FROM applications 
     WHERE status = 'rejected' 
     AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())
     AND deleted_at IS NULL)::BIGINT;
END;
$$ LANGUAGE plpgsql;
