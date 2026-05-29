
-- Roles enum & user_roles table
CREATE TYPE public.app_role AS ENUM ('admin', 'hr', 'applicant');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'hr'));
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto create profile + applicant role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'applicant');
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Applicants (data diri sesuai KTP)
CREATE TABLE public.applicants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nik TEXT,
  full_name TEXT,
  gender TEXT,
  birth_city TEXT,
  birth_date DATE,
  height_cm INTEGER,
  weight_kg INTEGER,
  blood_type TEXT,
  religion TEXT,
  marital_status TEXT,
  marital_since DATE,
  nationality TEXT DEFAULT 'WNI',
  photo_path TEXT,
  cv_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Applicant own row" ON public.applicants FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr'));
CREATE POLICY "Applicant insert own" ON public.applicants FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Applicant update own" ON public.applicants FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER trg_applicants_updated BEFORE UPDATE ON public.applicants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Education
CREATE TABLE public.educations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level TEXT,
  certificate_number TEXT,
  institution TEXT,
  major TEXT,
  gpa NUMERIC(4,2),
  year_start INTEGER,
  year_end INTEGER,
  graduation_date DATE,
  ijazah_path TEXT,
  transcript_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.educations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Edu select" ON public.educations FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr'));
CREATE POLICY "Edu insert" ON public.educations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Edu update" ON public.educations FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Edu delete" ON public.educations FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER trg_educations_updated BEFORE UPDATE ON public.educations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Addresses
CREATE TABLE public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('ktp','domicile')),
  address_line TEXT,
  province TEXT,
  city TEXT,
  district TEXT,
  village TEXT,
  postal_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, type)
);
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Addr select" ON public.addresses FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr'));
CREATE POLICY "Addr insert" ON public.addresses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Addr update" ON public.addresses FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER trg_addresses_updated BEFORE UPDATE ON public.addresses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Jobs
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  location TEXT NOT NULL,
  employment_type TEXT NOT NULL,
  min_education TEXT,
  description TEXT,
  requirements TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed','coming_soon')),
  deadline DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Jobs public read" ON public.jobs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Jobs admin manage" ON public.jobs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr'));
CREATE TRIGGER trg_jobs_updated BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Applications
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','document_review','interview','offered','accepted','rejected')),
  hr_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, job_id)
);
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "App select" ON public.applications FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr'));
CREATE POLICY "App insert own" ON public.applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "App hr update" ON public.applications FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr'));
CREATE TRIGGER trg_applications_updated BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Application timeline
CREATE TABLE public.application_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);
ALTER TABLE public.application_timeline ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Timeline select" ON public.application_timeline FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr')
    OR EXISTS (SELECT 1 FROM public.applications a WHERE a.id = application_id AND a.user_id = auth.uid())
  );
CREATE POLICY "Timeline insert hr" ON public.application_timeline FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr'));

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('applicant-documents','applicant-documents', false);

CREATE POLICY "Applicant upload own docs" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'applicant-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Applicant read own docs" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'applicant-documents' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'hr')));
CREATE POLICY "Applicant update own docs" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'applicant-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Applicant delete own docs" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'applicant-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Seed jobs
INSERT INTO public.jobs (title, department, location, employment_type, min_education, description, requirements, status) VALUES
('Production Engineer','Engineering','Cibitung, Jawa Barat','Full-time','S1','Bertanggung jawab atas optimasi lini produksi shock absorber.','Lulusan Teknik Mesin/Industri, fresh graduate dipersilakan, IPK min 3.00.','open'),
('Quality Control Inspector','Quality','Cibitung, Jawa Barat','Full-time','D3','Melakukan inspeksi kualitas produk sesuai standar KYB Global.','Pengalaman QC manufaktur, teliti, mampu baca drawing.','open'),
('HR Recruitment Officer','Human Resources','Cibitung, Jawa Barat','Full-time','S1','Mengelola proses rekrutmen end-to-end.','Pengalaman recruitment 2 tahun, komunikatif.','open'),
('Maintenance Technician','Maintenance','Cibitung, Jawa Barat','Full-time','SMK','Melakukan perawatan mesin produksi.','Lulusan SMK Teknik, siap shift.','open'),
('Supply Chain Analyst','Supply Chain','Cibitung, Jawa Barat','Full-time','S1','Analisis dan optimasi supply chain.','S1 Teknik Industri/Logistik, mahir Excel/SQL.','coming_soon'),
('R&D Engineer','Research & Development','Cibitung, Jawa Barat','Full-time','S1','Riset pengembangan produk shock absorber generasi baru.','S1 Teknik Mesin, IPK min 3.25.','open');
