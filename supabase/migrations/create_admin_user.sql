-- Create Admin User Script
-- Run this AFTER running full_setup.sql in Supabase Dashboard

-- Step 1: Create admin user in auth.users
-- This creates a placeholder user - you need to set the password via Supabase Dashboard
INSERT INTO auth.users (
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  'admin@kayaba.co.id',
  '', -- Empty password - set via Dashboard
  now(),
  '{"full_name": "Admin Kayaba"}',
  now(),
  now()
) ON CONFLICT (email) DO NOTHING;

-- Step 2: Assign admin role
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@kayaba.co.id';
  
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Admin role assigned to user ID: %', admin_user_id;
  END IF;
END $$;
