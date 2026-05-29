-- Fix Admin Role - Update existing user to admin
-- Run this in Supabase Dashboard SQL Editor

-- Update role dari 'applicant' menjadi 'admin' untuk user admin@kayaba.co.id
UPDATE public.user_roles
SET role = 'admin'::public.app_role
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'admin@kayaba.co.id'
);

-- Atau jika belum ada role sama sekali, insert admin role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE email = 'admin@kayaba.co.id'
ON CONFLICT (user_id, role) DO NOTHING;

-- Verify
SELECT 
  u.email,
  ur.role
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = 'admin@kayaba.co.id';
