-- ============================================================
-- Supabase Auth Seeding & Trigger Binding for RespondaCare
-- Run this in your Supabase SQL Editor to make demo accounts work
-- ============================================================

-- 1. Bind the handle_new_user trigger to Supabase's auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION security.handle_new_user();

-- 2. Seed the demo users into auth.users (all passwords are: password123)
-- This will automatically sync into security.users via the trigger above
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role,
  created_at,
  updated_at
) VALUES
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000000',
    'admin@respondacare.ph',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "System Admin", "role": "admin"}',
    'authenticated',
    'authenticated',
    now(),
    now()
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    '00000000-0000-0000-0000-000000000000',
    'bhw@respondacare.ph',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Barangay Health Worker", "role": "bhw"}',
    'authenticated',
    'authenticated',
    now(),
    now()
  ),
  (
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'resident@respondacare.ph',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Juan Dela Cruz", "role": "resident"}',
    'authenticated',
    'authenticated',
    now(),
    now()
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000000',
    'responder@respondacare.ph',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "First Responder", "role": "first_responder"}',
    'authenticated',
    'authenticated',
    now(),
    now()
  )
ON CONFLICT (id) DO NOTHING;
