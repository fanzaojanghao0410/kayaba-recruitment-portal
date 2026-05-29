-- =====================================================
-- KAYABA RECRUITMENT PORTAL - DUMMY DATA
-- =====================================================

-- =====================================================
-- 1. DUMMY JOBS (LOWONGAN KERJA)
-- =====================================================

INSERT INTO public.jobs (
  title, department, location, employment_type,
  description, requirements, responsibilities, qualifications, skills_required, benefits,
  min_education, min_experience_years, max_salary, min_salary, salary_currency,
  status, is_featured, quota, deadline,
  created_at, updated_at
) VALUES
(
  'Production Engineer - Shock Absorber',
  'Engineering',
  'Cibitung, Jawa Barat',
  'full_time',
  'Bertanggung jawab atas optimasi lini produksi shock absorber untuk kendaraan roda dua dan roda empat. Melakukan analisis proses produksi, trouble shooting, dan continuous improvement.',
  ARRAY['S1 Teknik Mesin/Industri', 'IPK minimal 3.00', 'Menguasai AutoCAD/SolidWorks', 'Fresh graduate dipersilakan'],
  ARRAY['Optimasi proses produksi', 'Trouble shooting mesin', 'Quality control', 'Continuous improvement'],
  ARRAY['Paham manufacturing process', 'Analisis data produksi', 'Problem solving'],
  ARRAY['Lean Manufacturing', 'Six Sigma', 'AutoCAD', 'SolidWorks', 'Excel', 'Minitab'],
  ARRAY['Asuransi kesehatan', 'Bonus kinerja', 'THR', 'Cuti tahunan 12 hari', 'Pelatihan teknis'],
  's1', 0, 15000000, 8000000, 'IDR',
  'published', true, 5, '2026-06-30',
  now() - interval '30 days', now()
),
(
  'Quality Control Inspector',
  'Quality Assurance',
  'Cibitung, Jawa Barat',
  'full_time',
  'Melakukan inspeksi kualitas produk sesuai standar KYB Global. Memastikan produk yang keluar dari lini produksi memenuhi standar kualitas yang ditetapkan.',
  ARRAY['Minimal D3 Teknik', 'Pengalaman QC manufaktur 1-2 tahun', 'Teliti dan detail oriented'],
  ARRAY['Inspeksi produk', 'Dokumentasi hasil inspeksi', 'Report defect', 'Koordinasi dengan produksi'],
  ARRAY['Mampu membaca drawing teknik', 'Paham standar quality', 'Komunikasi yang baik'],
  ARRAY['QC Tools', 'SPC', 'Microsoft Office', 'Drawing Reading', 'Measuring Tools'],
  ARRAY['BPJS Kesehatan & Ketenagakerjaan', 'Tunjangan transport', 'Makan siang gratis'],
  'd3', 1, 10000000, 6000000, 'IDR',
  'published', false, 3, '2026-06-15',
  now() - interval '20 days', now()
),
(
  'HR Recruitment Officer',
  'Human Resources',
  'Cibitung, Jawa Barat',
  'full_time',
  'Mengelola proses rekrutmen end-to-end dari sourcing kandidat hingga onboarding. Bertanggung jawab untuk memastikan perusahaan mendapatkan talent terbaik.',
  ARRAY['S1 Psikologi/HR/Management', 'Pengalaman recruitment 2 tahun', 'Komunikatif dan interpersonal skill kuat'],
  ARRAY['Sourcing kandidat', 'Screening & interview', 'Coordination dengan hiring manager', 'Onboarding'],
  ARRAY['Paham proses recruitment', 'Interview skill', 'Assessment tools'],
  ARRAY['Recruitment', 'Interview', 'HRIS', 'Microsoft Office', 'Communication'],
  ARRAY['Bonus rekrutmen', 'Asuransi swasta', 'Flexible working hour'],
  's1', 2, 12000000, 8000000, 'IDR',
  'published', true, 2, '2026-05-30',
  now() - interval '15 days', now()
),
(
  'Maintenance Technician',
  'Maintenance',
  'Cibitung, Jawa Barat',
  'full_time',
  'Melakukan perawatan dan perbaikan mesin produksi secara preventif dan korektif. Memastikan mesin beroperasi optimal dengan minimal downtime.',
  ARRAY['SMK Teknik Mesin/Elektro', 'Paham sistem hidraulik & pneumatik', 'Siap kerja shift'],
  ARRAY['Preventive maintenance', 'Repair mesin', 'Trouble shooting', 'Dokumentasi maintenance'],
  ARRAY['Mekanik dasar', 'Listrik dasar', 'Problem solving'],
  ARRAY['Mechanical', 'Electrical', 'PLC', 'Hidraulik', 'Pneumatik'],
  ARRAY['Tunjangan shift', 'Lembur', 'Pelatihan teknis'],
  'sma', 0, 8000000, 5000000, 'IDR',
  'published', false, 4, '2026-06-20',
  now() - interval '10 days', now()
),
(
  'R&D Engineer - Product Development',
  'Research & Development',
  'Cibitung, Jawa Barat',
  'full_time',
  'Riset dan pengembangan produk shock absorber generasi baru. Melakukan testing, analisis, dan inovasi produk untuk meningkatkan performa dan daya saing.',
  ARRAY['S1/S2 Teknik Mesin/Otomotif', 'IPK minimal 3.25', 'Passion di R&D dan inovasi'],
  ARRAY['Product research', 'Prototype development', 'Testing & validation', 'Technical documentation'],
  ARRAY['Analisis teknikal', 'Creative thinking', 'Project management'],
  ARRAY['R&D', 'CAD/CAM', 'Simulation', 'Testing', 'Innovation'],
  ARRAY['Research allowance', 'Conference attendance', 'Publication incentive'],
  's1', 0, 18000000, 12000000, 'IDR',
  'published', true, 3, '2026-07-15',
  now() - interval '5 days', now()
),
(
  'Supply Chain Analyst',
  'Supply Chain',
  'Cibitung, Jawa Barat',
  'full_time',
  'Analisis dan optimasi supply chain. Mengelola inventory, forecasting demand, dan mengoptimasi proses procurement untuk efisiensi biaya.',
  ARRAY['S1 Teknik Industri/Logistik/Management', 'Mahir Excel dan SQL', 'Analitis dan detail oriented'],
  ARRAY['Demand forecasting', 'Inventory management', 'Data analysis', 'Vendor management'],
  ARRAY['Analisis data', 'Statistik', 'Problem solving'],
  ARRAY['Supply Chain', 'Excel', 'SQL', 'ERP', 'Forecasting', 'Analytics'],
  ARRAY['Performance bonus', 'Training certification'],
  's1', 1, 14000000, 9000000, 'IDR',
  'draft', false, 2, '2026-07-30',
  now(), now()
),
(
  'Marketing Specialist',
  'Marketing',
  'Jakarta Selatan',
  'full_time',
  'Mengembangkan strategi marketing untuk produk aftermarket KYB. Melakukan market research, campaign planning, dan digital marketing.',
  ARRAY['S1 Marketing/Business', 'Pengalaman marketing 2 tahun', 'Kreatif dan inovatif'],
  ARRAY['Market research', 'Campaign planning', 'Digital marketing', 'Brand management'],
  ARRAY['Marketing strategy', 'Content creation', 'Data analysis'],
  ARRAY['Marketing', 'Digital Marketing', 'SEO/SEM', 'Social Media', 'Analytics'],
  ARRAY['Marketing budget', 'Travel allowance'],
  's1', 2, 13000000, 8500000, 'IDR',
  'closed', false, 1, '2026-04-30',
  now() - interval '60 days', now()
);

-- =====================================================
-- 2. DUMMY APPLICANTS
-- =====================================================

-- Note: Applicants linked to auth.users, will be created when users sign up
-- For dummy data, we'll reference by placeholder

-- =====================================================
-- 3. DUMMY APPLICATIONS
-- =====================================================

-- Applications will reference actual applicants after they apply

-- =====================================================
-- 4. DUMMY ACTIVITY LOGS
-- =====================================================

INSERT INTO public.activity_logs (action, entity_type, entity_id, details, created_at)
VALUES
('job_created', 'jobs', (SELECT id FROM public.jobs LIMIT 1 OFFSET 0), '{"title": "Production Engineer"}'::jsonb, now() - interval '30 days'),
('job_published', 'jobs', (SELECT id FROM public.jobs LIMIT 1 OFFSET 0), '{"title": "Production Engineer"}'::jsonb, now() - interval '29 days'),
('job_created', 'jobs', (SELECT id FROM public.jobs LIMIT 1 OFFSET 1), '{"title": "Quality Control Inspector"}'::jsonb, now() - interval '20 days'),
('job_published', 'jobs', (SELECT id FROM public.jobs LIMIT 1 OFFSET 1), '{"title": "Quality Control Inspector"}'::jsonb, now() - interval '19 days'),
('job_created', 'jobs', (SELECT id FROM public.jobs LIMIT 1 OFFSET 2), '{"title": "HR Recruitment Officer"}'::jsonb, now() - interval '15 days'),
('job_published', 'jobs', (SELECT id FROM public.jobs LIMIT 1 OFFSET 2), '{"title": "HR Recruitment Officer"}'::jsonb, now() - interval '14 days'),
('job_created', 'jobs', (SELECT id FROM public.jobs LIMIT 1 OFFSET 5), '{"title": "Supply Chain Analyst"}'::jsonb, now()),
('job_closed', 'jobs', (SELECT id FROM public.jobs LIMIT 1 OFFSET 6), '{"title": "Marketing Specialist", "reason": "Position filled"}'::jsonb, now() - interval '5 days');

-- =====================================================
-- DONE
-- =====================================================
