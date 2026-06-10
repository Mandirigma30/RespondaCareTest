-- ============================================================
-- SQL GRANTS AND PERMISSIONS PATCH FOR RESPONDACARE
-- Run this script in the Supabase SQL Editor (https://supabase.com)
-- ============================================================

-- Ensure schemas usage are granted
GRANT USAGE ON SCHEMA security TO authenticated, anon;
GRANT USAGE ON SCHEMA core TO authenticated, anon;
GRANT USAGE ON SCHEMA health TO authenticated;
GRANT USAGE ON SCHEMA emergency TO authenticated;

-- Grants for core.residents
GRANT SELECT, INSERT, UPDATE, DELETE ON core.residents TO authenticated;

-- Grants for health schema tables
GRANT SELECT, INSERT, UPDATE, DELETE ON health.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON health.allergy_flags TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON health.medications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON health.records TO authenticated;

-- Grants for security.users (allows name and status updates)
GRANT SELECT, INSERT, UPDATE, DELETE ON security.users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON security.roles TO authenticated;

-- Ensure sequences are granted so ID generation works (e.g. resident_id/flag_id/medication_id)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA core TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA health TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA security TO authenticated;

-- Confirm RLS is bypassed/allowed for authenticated users based on policies
ALTER TABLE core.residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE health.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE health.allergy_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE health.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE health.records ENABLE ROW LEVEL SECURITY;
ALTER TABLE security.users ENABLE ROW LEVEL SECURITY;
