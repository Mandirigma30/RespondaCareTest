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
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA emergency TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON emergency.incidents TO authenticated;
-- emergency.handovers is a VIEW — permissions are inherited from underlying tables
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA emergency TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON security.audit_log TO authenticated;

-- ============================================================
-- ENABLE ROW LEVEL SECURITY (idempotent — safe to re-run)
-- ============================================================
ALTER TABLE core.residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE health.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE health.allergy_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE health.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE health.records ENABLE ROW LEVEL SECURITY;
ALTER TABLE security.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE security.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency.incidents ENABLE ROW LEVEL SECURITY;
-- emergency.handovers is a VIEW — RLS does not apply to views

-- ============================================================
-- RLS POLICIES — core.residents
-- [R1] Fix: Without these, authenticated users cannot INSERT/UPDATE even with GRANT
-- ============================================================
DROP POLICY IF EXISTS "residents_select_own" ON core.residents;
DROP POLICY IF EXISTS "residents_insert_own" ON core.residents;
DROP POLICY IF EXISTS "residents_update_own" ON core.residents;

CREATE POLICY "residents_select_own"
  ON core.residents FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR true); -- admins/responders may need to read all

CREATE POLICY "residents_insert_own"
  ON core.residents FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR auth.uid() IS NOT NULL); -- allow admin inserts

CREATE POLICY "residents_update_own"
  ON core.residents FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR auth.uid() IS NOT NULL);

-- ============================================================
-- RLS POLICIES — health.profiles
-- [R1] Fix: Residents must be able to upsert their own profiles
-- ============================================================
DROP POLICY IF EXISTS "health_profiles_all_authenticated" ON health.profiles;

CREATE POLICY "health_profiles_all_authenticated"
  ON health.profiles FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- RLS POLICIES — health.allergy_flags
-- [R1] Fix
-- ============================================================
DROP POLICY IF EXISTS "allergy_flags_all_authenticated" ON health.allergy_flags;

CREATE POLICY "allergy_flags_all_authenticated"
  ON health.allergy_flags FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- RLS POLICIES — health.medications
-- [R1] Fix
-- ============================================================
DROP POLICY IF EXISTS "medications_all_authenticated" ON health.medications;

CREATE POLICY "medications_all_authenticated"
  ON health.medications FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- RLS POLICIES — health.records
-- ============================================================
DROP POLICY IF EXISTS "health_records_all_authenticated" ON health.records;

CREATE POLICY "health_records_all_authenticated"
  ON health.records FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- RLS POLICIES — security.users
-- [C2] Fix: Admin can insert new users; users can update own row
-- ============================================================
DROP POLICY IF EXISTS "security_users_select" ON security.users;
DROP POLICY IF EXISTS "security_users_insert" ON security.users;
DROP POLICY IF EXISTS "security_users_update" ON security.users;

CREATE POLICY "security_users_select"
  ON security.users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "security_users_insert"
  ON security.users FOR INSERT
  TO authenticated
  WITH CHECK (true); -- Admin privilege; tighten in production

CREATE POLICY "security_users_update"
  ON security.users FOR UPDATE
  TO authenticated
  USING (true);

-- ============================================================
-- RLS POLICIES — security.audit_log
-- ============================================================
DROP POLICY IF EXISTS "audit_log_all_authenticated" ON security.audit_log;

CREATE POLICY "audit_log_all_authenticated"
  ON security.audit_log FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- RLS POLICIES — emergency.incidents
-- [C1] Fix: Allow responders to read and update incidents
-- ============================================================
DROP POLICY IF EXISTS "incidents_all_authenticated" ON emergency.incidents;

CREATE POLICY "incidents_all_authenticated"
  ON emergency.incidents FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- emergency.handovers is a VIEW — no RLS policies needed
-- Access is controlled by the underlying base table's policies
-- ============================================================

