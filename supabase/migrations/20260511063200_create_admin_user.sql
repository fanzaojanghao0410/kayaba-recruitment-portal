-- Create admin user using Supabase Auth
-- This migration creates an admin user with email: admin@kayaba.co.id
-- The password needs to be set via Supabase Dashboard or Auth API
-- This migration only creates the role assignment

DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- First, try to get existing user by email
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@kayaba.co.id';
  
  -- If user doesn't exist, we'll create a placeholder
  -- The actual password should be set via Supabase Dashboard
  IF admin_user_id IS NULL THEN
    INSERT INTO auth.users (
      email,
      encrypted_password,
      email_confirmed_at,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      'admin@kayaba.co.id',
      '', -- Empty password - needs to be set via Dashboard
      now(),
      '{"full_name": "Admin Kayaba"}',
      now(),
      now()
    )
    RETURNING id INTO admin_user_id;
  END IF;
  
  -- Assign admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (admin_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RAISE NOTICE 'Admin user ID: %. Please set password via Supabase Dashboard', admin_user_id;
END $$;
