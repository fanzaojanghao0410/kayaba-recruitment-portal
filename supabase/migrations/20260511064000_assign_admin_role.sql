-- Assign admin role to existing admin user
-- Run this after creating the user in Supabase Dashboard

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
  ELSE
    RAISE NOTICE 'Admin user not found. Please create admin@kayaba.co.id in Supabase Dashboard first.';
  END IF;
END $$;
