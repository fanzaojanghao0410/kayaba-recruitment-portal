-- =====================================================
-- PT KAYABA INDONESIA - CORPORATE RECRUITMENT REFRESH
-- =====================================================
-- This migration standardizes the recruitment portal schema around:
-- 1. public career pages reading only published jobs,
-- 2. applicant-centric applications,
-- 3. HR pipeline states and audit timeline,
-- 4. professional seed data aligned with KYB Indonesia.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_status') THEN
    CREATE TYPE public.job_status AS ENUM ('draft', 'published', 'closed', 'archived');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'employment_type') THEN
    CREATE TYPE public.employment_type AS ENUM ('full_time', 'part_time', 'contract', 'internship', 'freelance');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'education_level') THEN
    CREATE TYPE public.education_level AS ENUM ('sma', 'd1', 'd2', 'd3', 's1', 's2', 's3');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'application_status') THEN
    CREATE TYPE public.application_status AS ENUM (
      'new',
      'screening',
      'shortlisted',
      'interview_scheduled',
      'interview_completed',
      'reference_check',
      'offered',
      'hired',
      'rejected',
      'withdrawn'
    );
  END IF;
END $$;

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

CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT 'Cibitung, Bekasi',
  employment_type public.employment_type NOT NULL DEFAULT 'full_time',
  description TEXT NOT NULL,
  requirements TEXT[] NOT NULL DEFAULT '{}',
  responsibilities TEXT[] NOT NULL DEFAULT '{}',
  qualifications TEXT[] NOT NULL DEFAULT '{}',
  skills_required TEXT[] NOT NULL DEFAULT '{}',
  benefits TEXT[] NOT NULL DEFAULT '{}',
  min_education public.education_level,
  min_experience_years INTEGER NOT NULL DEFAULT 0 CHECK (min_experience_years >= 0),
  min_salary INTEGER CHECK (min_salary IS NULL OR min_salary >= 0),
  max_salary INTEGER CHECK (max_salary IS NULL OR max_salary >= 0),
  salary_currency TEXT NOT NULL DEFAULT 'IDR',
  quota INTEGER CHECK (quota IS NULL OR quota > 0),
  deadline DATE,
  status public.job_status NOT NULL DEFAULT 'draft',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  published_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT jobs_salary_range CHECK (
    min_salary IS NULL OR max_salary IS NULL OR min_salary <= max_salary
  )
);

CREATE TABLE IF NOT EXISTS public.applicants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nik TEXT,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  gender TEXT CHECK (gender IS NULL OR gender IN ('L', 'P')),
  birth_date DATE,
  birth_place TEXT,
  nationality TEXT DEFAULT 'WNI',
  address_ktp TEXT,
  address_domicile TEXT,
  city TEXT,
  province TEXT,
  postal_code TEXT,
  linkedin_url TEXT,
  portfolio_url TEXT,
  photo_url TEXT,
  cv_url TEXT,
  summary TEXT,
  expected_salary INTEGER CHECK (expected_salary IS NULL OR expected_salary >= 0),
  available_start DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id UUID NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  status public.application_status NOT NULL DEFAULT 'new',
  stage INTEGER NOT NULL DEFAULT 1 CHECK (stage BETWEEN 1 AND 9),
  screening_score INTEGER CHECK (screening_score IS NULL OR screening_score BETWEEN 0 AND 100),
  screening_notes TEXT,
  interview_date TIMESTAMPTZ,
  interview_type TEXT,
  interview_location TEXT,
  interview_link TEXT,
  interview_score INTEGER CHECK (interview_score IS NULL OR interview_score BETWEEN 0 AND 100),
  hr_notes TEXT,
  internal_rating INTEGER CHECK (internal_rating IS NULL OR internal_rating BETWEEN 1 AND 5),
  tags TEXT[] DEFAULT '{}',
  assigned_hr_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(applicant_id, job_id)
);

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

CREATE TABLE IF NOT EXISTS public.hr_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  note_type TEXT NOT NULL DEFAULT 'general',
  content TEXT NOT NULL,
  is_private BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_jobs_updated ON public.jobs;
CREATE TRIGGER trg_jobs_updated
BEFORE UPDATE ON public.jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_applicants_updated ON public.applicants;
CREATE TRIGGER trg_applicants_updated
BEFORE UPDATE ON public.applicants
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_applications_updated ON public.applications;
CREATE TRIGGER trg_applications_updated
BEFORE UPDATE ON public.applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_hr_notes_updated ON public.hr_notes;
CREATE TRIGGER trg_hr_notes_updated
BEFORE UPDATE ON public.hr_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Jobs public read" ON public.jobs;
CREATE POLICY "Jobs public read"
ON public.jobs
FOR SELECT
TO anon, authenticated
USING (
  status = 'published'
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'hr'::public.app_role)
);

DROP POLICY IF EXISTS "Jobs HR manage" ON public.jobs;
CREATE POLICY "Jobs HR manage"
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

DROP POLICY IF EXISTS "Applicants owner and HR read" ON public.applicants;
CREATE POLICY "Applicants owner and HR read"
ON public.applicants
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'hr'::public.app_role)
);

DROP POLICY IF EXISTS "Applicants owner insert" ON public.applicants;
CREATE POLICY "Applicants owner insert"
ON public.applicants
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Applicants owner update" ON public.applicants;
CREATE POLICY "Applicants owner update"
ON public.applicants
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Applications owner and HR read" ON public.applications;
CREATE POLICY "Applications owner and HR read"
ON public.applications
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.applicants a
    WHERE a.id = applications.applicant_id
    AND (
      a.user_id = auth.uid()
      OR public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.has_role(auth.uid(), 'hr'::public.app_role)
    )
  )
);

DROP POLICY IF EXISTS "Applications owner insert" ON public.applications;
CREATE POLICY "Applications owner insert"
ON public.applications
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.applicants a
    WHERE a.id = applications.applicant_id
    AND a.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Applications HR update" ON public.applications;
CREATE POLICY "Applications HR update"
ON public.applications
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'hr'::public.app_role)
);

DROP POLICY IF EXISTS "Timeline owner and HR read" ON public.application_timeline;
CREATE POLICY "Timeline owner and HR read"
ON public.application_timeline
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.applications app
    JOIN public.applicants a ON a.id = app.applicant_id
    WHERE app.id = application_timeline.application_id
    AND (
      a.user_id = auth.uid()
      OR public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.has_role(auth.uid(), 'hr'::public.app_role)
    )
  )
);

DROP POLICY IF EXISTS "Timeline applicant or HR insert" ON public.application_timeline;
CREATE POLICY "Timeline applicant or HR insert"
ON public.application_timeline
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'hr'::public.app_role)
  OR EXISTS (
    SELECT 1
    FROM public.applications app
    JOIN public.applicants a ON a.id = app.applicant_id
    WHERE app.id = application_timeline.application_id
    AND a.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "HR notes HR only" ON public.hr_notes;
CREATE POLICY "HR notes HR only"
ON public.hr_notes
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

CREATE INDEX IF NOT EXISTS idx_jobs_status_featured_created
ON public.jobs(status, is_featured DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_jobs_department
ON public.jobs(department);

CREATE INDEX IF NOT EXISTS idx_applicants_user_id
ON public.applicants(user_id);

CREATE INDEX IF NOT EXISTS idx_applications_job_status
ON public.applications(job_id, status);

CREATE INDEX IF NOT EXISTS idx_applications_applicant_id
ON public.applications(applicant_id);

CREATE INDEX IF NOT EXISTS idx_application_timeline_application
ON public.application_timeline(application_id, created_at DESC);

UPDATE public.jobs
SET status = 'published'
WHERE status::text = 'open';

INSERT INTO public.jobs (
  title,
  department,
  location,
  employment_type,
  description,
  requirements,
  responsibilities,
  qualifications,
  skills_required,
  benefits,
  min_education,
  min_experience_years,
  min_salary,
  max_salary,
  status,
  is_featured,
  quota,
  deadline,
  published_at
) VALUES
(
  'Production Engineer - Shock Absorber Line',
  'Engineering',
  'Cibitung, Bekasi',
  'full_time',
  'Mengoptimalkan proses produksi shock absorber melalui analisis line performance, perbaikan proses, dan koordinasi lintas fungsi dengan produksi, maintenance, dan quality.',
  ARRAY['S1 Teknik Mesin, Teknik Industri, atau Teknik Otomotif', 'Memahami manufacturing process, line balancing, dan problem solving', 'Mampu membaca drawing teknik dan mengolah data produksi'],
  ARRAY['Menganalisis performa lini produksi', 'Menjalankan improvement untuk menurunkan defect dan downtime', 'Menyusun standard kerja dan laporan engineering'],
  ARRAY['Fresh graduate dipersilakan melamar', 'Memiliki minat kuat pada manufaktur otomotif'],
  ARRAY['Lean Manufacturing', 'Root Cause Analysis', 'AutoCAD atau SolidWorks', 'Microsoft Excel'],
  ARRAY['BPJS dan benefit perusahaan', 'Pelatihan teknis manufaktur', 'Kesempatan pengembangan karier'],
  's1',
  0,
  8000000,
  15000000,
  'published',
  true,
  5,
  CURRENT_DATE + 30,
  now()
),
(
  'Quality Control Inspector',
  'Quality Assurance',
  'Cibitung, Bekasi',
  'full_time',
  'Melakukan inspeksi kualitas produk, dokumentasi hasil pemeriksaan, dan koordinasi tindakan korektif untuk memastikan produk memenuhi standar KYB.',
  ARRAY['Minimal D3 Teknik Mesin, Elektro, atau Industri', 'Teliti dan memahami alat ukur dasar', 'Siap bekerja dengan target kualitas dan ritme produksi'],
  ARRAY['Melakukan incoming, in-process, dan final inspection', 'Mencatat temuan defect secara akurat', 'Berkoordinasi dengan produksi untuk containment action'],
  ARRAY['Pengalaman QC manufaktur menjadi nilai tambah'],
  ARRAY['Measuring Tools', 'QC Seven Tools', 'Drawing Reading', 'SPC'],
  ARRAY['Tunjangan dan fasilitas sesuai kebijakan perusahaan', 'Lingkungan kerja manufaktur profesional'],
  'd3',
  1,
  6000000,
  10000000,
  'published',
  true,
  3,
  CURRENT_DATE + 21,
  now()
),
(
  'Maintenance Technician',
  'Maintenance',
  'Cibitung, Bekasi',
  'full_time',
  'Menjalankan preventive dan corrective maintenance untuk mendukung kestabilan mesin produksi dan meminimalkan downtime.',
  ARRAY['SMK/D3 Teknik Mesin, Mekatronika, atau Elektro', 'Memahami dasar mekanik, elektrik, hidrolik, atau pneumatik', 'Bersedia bekerja shift'],
  ARRAY['Melakukan perawatan mesin sesuai jadwal', 'Menangani troubleshooting mesin produksi', 'Mendokumentasikan aktivitas maintenance'],
  ARRAY['Memahami keselamatan kerja area produksi'],
  ARRAY['Mechanical Maintenance', 'Electrical Basic', 'Hydraulic', 'Pneumatic'],
  ARRAY['Tunjangan shift', 'Pelatihan teknis', 'Fasilitas kesehatan'],
  'sma',
  0,
  5000000,
  8500000,
  'published',
  false,
  4,
  CURRENT_DATE + 28,
  now()
)
ON CONFLICT DO NOTHING;
