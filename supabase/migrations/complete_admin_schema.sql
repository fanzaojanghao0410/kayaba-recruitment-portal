-- =====================================================
-- KAYABA RECRUITMENT PORTAL - COMPLETE ADMIN SCHEMA
-- =====================================================

-- Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================
-- 1. ENUMS
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'hr', 'applicant');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_status') THEN
    CREATE TYPE public.job_status AS ENUM ('draft', 'published', 'closed', 'archived');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'employment_type') THEN
    CREATE TYPE public.employment_type AS ENUM ('full_time', 'part_time', 'contract', 'internship', 'freelance');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'application_status') THEN
    CREATE TYPE public.application_status AS ENUM (
      'new', 'screening', 'shortlisted', 'interview_scheduled', 
      'interview_completed', 'reference_check', 'offered', 'hired', 'rejected', 'withdrawn'
    );
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'education_level') THEN
    CREATE TYPE public.education_level AS ENUM (
      'sma', 'd1', 'd2', 'd3', 's1', 's2', 's3'
    );
  END IF;
END $$;

-- =====================================================
-- 2. CORE FUNCTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.has_role(
  _user_id UUID,
  _role public.app_role
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- =====================================================
-- 3. USER ROLES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'hr'::public.app_role)
);

CREATE POLICY "Admins manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE TRIGGER trg_user_roles_updated
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 4. PROFILES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  department TEXT,
  position TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'hr'::public.app_role)
);

CREATE POLICY "Users insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE TRIGGER trg_profiles_updated
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 5. NEW USER HANDLER
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'applicant'::public.app_role);
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 6. JOBS TABLE (LOWONGAN KERJA)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  location TEXT NOT NULL,
  employment_type public.employment_type NOT NULL DEFAULT 'full_time',
  
  -- Detail Pekerjaan
  description TEXT NOT NULL,
  requirements TEXT[] DEFAULT '{}',
  responsibilities TEXT[] DEFAULT '{}',
  qualifications TEXT[] DEFAULT '{}',
  skills_required TEXT[] DEFAULT '{}',
  benefits TEXT[] DEFAULT '{}',
  
  -- Kriteria
  min_education public.education_level,
  min_experience_years INTEGER DEFAULT 0,
  max_salary INTEGER,
  min_salary INTEGER,
  salary_currency TEXT DEFAULT 'IDR',
  
  -- Status
  status public.job_status NOT NULL DEFAULT 'draft',
  is_featured BOOLEAN DEFAULT false,
  
  -- Kuota & Deadline
  quota INTEGER,
  deadline DATE,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  published_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Jobs public read"
ON public.jobs
FOR SELECT
TO anon, authenticated
USING (
  status = 'published'
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'hr'::public.app_role)
);

CREATE POLICY "Jobs admin manage"
ON public.jobs
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'hr'::public.app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'hr'::public.app_role)
);

CREATE TRIGGER trg_jobs_updated
BEFORE UPDATE ON public.jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 7. APPLICANTS TABLE (DATA DIRI PELAMAR)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.applicants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Data Pribadi
  nik TEXT,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  gender TEXT CHECK (gender IN ('L', 'P')),
  birth_date DATE,
  birth_place TEXT,
  nationality TEXT DEFAULT 'WNI',
  religion TEXT,
  marital_status TEXT,
  
  -- Fisik
  height_cm INTEGER,
  weight_kg INTEGER,
  blood_type TEXT,
  
  -- Alamat
  address_ktp TEXT,
  address_domicile TEXT,
  city TEXT,
  province TEXT,
  postal_code TEXT,
  
  -- Online Presence
  linkedin_url TEXT,
  portfolio_url TEXT,
  website_url TEXT,
  
  -- Dokumen
  photo_url TEXT,
  cv_url TEXT,
  ktp_url TEXT,
  
  -- Summary
  summary TEXT,
  expected_salary INTEGER,
  available_start DATE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Applicant own row"
ON public.applicants
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'hr'::public.app_role)
);

CREATE POLICY "Applicant insert own"
ON public.applicants
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Applicant update own"
ON public.applicants
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE TRIGGER trg_applicants_updated
BEFORE UPDATE ON public.applicants
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 8. EDUCATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.educations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id UUID NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
  
  institution TEXT NOT NULL,
  degree public.education_level NOT NULL,
  major TEXT,
  gpa NUMERIC(3,2),
  start_year INTEGER,
  end_year INTEGER,
  is_graduated BOOLEAN DEFAULT true,
  
  description TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.educations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Educations view"
ON public.educations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.applicants a 
    WHERE a.id = educations.applicant_id 
    AND (a.user_id = auth.uid()
      OR public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.has_role(auth.uid(), 'hr'::public.app_role))
  )
);

CREATE POLICY "Educations insert own"
ON public.educations
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.applicants a 
    WHERE a.id = educations.applicant_id AND a.user_id = auth.uid()
  )
);

CREATE TRIGGER trg_educations_updated
BEFORE UPDATE ON public.educations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 9. EXPERIENCES TABLE (PENGALAMAN KERJA)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id UUID NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
  
  company_name TEXT NOT NULL,
  position TEXT NOT NULL,
  department TEXT,
  employment_type public.employment_type,
  
  start_date DATE NOT NULL,
  end_date DATE,
  is_current BOOLEAN DEFAULT false,
  
  location TEXT,
  salary INTEGER,
  
  description TEXT,
  achievements TEXT[],
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Experiences view"
ON public.experiences
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.applicants a 
    WHERE a.id = experiences.applicant_id 
    AND (a.user_id = auth.uid()
      OR public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.has_role(auth.uid(), 'hr'::public.app_role))
  )
);

CREATE TRIGGER trg_experiences_updated
BEFORE UPDATE ON public.experiences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 10. SKILLS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id UUID NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
  
  skill_name TEXT NOT NULL,
  proficiency_level INTEGER CHECK (proficiency_level BETWEEN 1 AND 5),
  category TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Skills view"
ON public.skills
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.applicants a 
    WHERE a.id = skills.applicant_id 
    AND (a.user_id = auth.uid()
      OR public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.has_role(auth.uid(), 'hr'::public.app_role))
  )
);

-- =====================================================
-- 11. APPLICATIONS TABLE (LAMARAN)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  applicant_id UUID NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  
  -- Status & Pipeline
  status public.application_status NOT NULL DEFAULT 'new',
  stage INTEGER DEFAULT 1,
  
  -- Screening Score
  screening_score INTEGER,
  screening_notes TEXT,
  
  -- Interview
  interview_date TIMESTAMPTZ,
  interview_type TEXT,
  interview_location TEXT,
  interview_link TEXT,
  interviewers TEXT[],
  interview_score INTEGER,
  interview_notes TEXT,
  
  -- Offer
  offered_salary INTEGER,
  offer_sent_at TIMESTAMPTZ,
  offer_expires_at TIMESTAMPTZ,
  offer_accepted BOOLEAN,
  
  -- HR Internal
  hr_notes TEXT,
  internal_rating INTEGER CHECK (internal_rating BETWEEN 1 AND 5),
  tags TEXT[],
  
  -- Rejection
  rejection_reason TEXT,
  rejected_at TIMESTAMPTZ,
  rejected_by UUID REFERENCES auth.users(id),
  
  -- Assigned To
  assigned_hr_id UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(applicant_id, job_id)
);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Applications view"
ON public.applications
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.applicants a 
    WHERE a.id = applications.applicant_id 
    AND (a.user_id = auth.uid()
      OR public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.has_role(auth.uid(), 'hr'::public.app_role))
  )
  OR assigned_hr_id = auth.uid()
);

CREATE POLICY "Applications insert own"
ON public.applications
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.applicants a 
    WHERE a.id = applications.applicant_id AND a.user_id = auth.uid()
  )
);

CREATE POLICY "Applications HR update"
ON public.applications
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'hr'::public.app_role)
  OR assigned_hr_id = auth.uid()
);

CREATE TRIGGER trg_applications_updated
BEFORE UPDATE ON public.applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 12. APPLICATION TIMELINE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.application_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  
  status public.application_status NOT NULL,
  stage INTEGER,
  
  title TEXT NOT NULL,
  description TEXT,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.application_timeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Timeline view"
ON public.application_timeline
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.applications app
    JOIN public.applicants a ON a.id = app.applicant_id
    WHERE app.id = application_timeline.application_id
    AND (a.user_id = auth.uid()
      OR public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.has_role(auth.uid(), 'hr'::public.app_role))
  )
);

CREATE POLICY "Timeline insert HR"
ON public.application_timeline
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'hr'::public.app_role)
);

-- =====================================================
-- 13. HR NOTES / INTERNAL COMMENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.hr_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  
  note_type TEXT DEFAULT 'general',
  content TEXT NOT NULL,
  
  is_private BOOLEAN DEFAULT true,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.hr_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR notes view"
ON public.hr_notes
FOR SELECT
TO authenticated
USING (
  (public.has_role(auth.uid(), 'admin'::public.app_role)
   OR public.has_role(auth.uid(), 'hr'::public.app_role))
);

CREATE POLICY "HR notes insert"
ON public.hr_notes
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'hr'::public.app_role)
);

CREATE TRIGGER trg_hr_notes_updated
BEFORE UPDATE ON public.hr_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 14. ACTIVITY LOG
-- =====================================================

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Activity logs view"
ON public.activity_logs
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'hr'::public.app_role)
);

-- =====================================================
-- 15. STORAGE BUCKETS
-- =====================================================

INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('applicant-documents', 'Applicant Documents', false),
  ('company-assets', 'Company Assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY IF NOT EXISTS "Applicant upload own docs" 
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'applicant-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY IF NOT EXISTS "Applicant read own docs" 
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'applicant-documents' 
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'hr'::public.app_role)
  )
);

-- =====================================================
-- 16. INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON public.applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_applicant_id ON public.applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON public.applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_assigned_hr ON public.applications(assigned_hr_id);

CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_department ON public.jobs(department);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON public.jobs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_applicants_user_id ON public.applicants(user_id);
CREATE INDEX IF NOT EXISTS idx_timeline_application ON public.application_timeline(application_id);

CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);

-- =====================================================
-- DONE
-- =====================================================

