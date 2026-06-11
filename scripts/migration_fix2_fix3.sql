-- ============================================================
--  RespondaCare — Migration: FIX 2 + FIX 3
--  Date: 2026-06-11
--  Description:
--    FIX 2: Add emergency.contacts table for persistent encrypted
--            emergency contacts with per-resident RLS.
--    FIX 3: Verify health.profiles unique constraint exists for
--            the upsert onConflict: 'resident_id' to work.
-- ============================================================


-- ══════════════════════════════════════════════════════════════
-- FIX 2: emergency.contacts
-- ══════════════════════════════════════════════════════════════

-- GRANTS: ensure authenticated role has usage on emergency schema
-- (already granted in seed.sql, included here for idempotent migration safety)
GRANT USAGE ON SCHEMA emergency TO authenticated;

-- Create the contacts table
CREATE TABLE IF NOT EXISTS emergency.contacts (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resident_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    encrypted_name   TEXT NOT NULL,          -- AES-256-GCM encrypted resident name (PII)
    relationship     TEXT,
    encrypted_phone  TEXT NOT NULL,          -- AES-256-GCM encrypted phone number (PII)
    created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE emergency.contacts ENABLE ROW LEVEL SECURITY;

-- Residents can only SELECT their own contacts
DROP POLICY IF EXISTS contacts_own_select ON emergency.contacts;
CREATE POLICY contacts_own_select ON emergency.contacts
  FOR SELECT
  USING (auth.uid() = resident_id);

-- Residents can INSERT their own contacts
DROP POLICY IF EXISTS contacts_own_insert ON emergency.contacts;
CREATE POLICY contacts_own_insert ON emergency.contacts
  FOR INSERT
  WITH CHECK (auth.uid() = resident_id);

-- Residents can UPDATE their own contacts
DROP POLICY IF EXISTS contacts_own_update ON emergency.contacts;
CREATE POLICY contacts_own_update ON emergency.contacts
  FOR UPDATE
  USING (auth.uid() = resident_id)
  WITH CHECK (auth.uid() = resident_id);

-- Residents can DELETE their own contacts
DROP POLICY IF EXISTS contacts_own_delete ON emergency.contacts;
CREATE POLICY contacts_own_delete ON emergency.contacts
  FOR DELETE
  USING (auth.uid() = resident_id);

-- Admins/BHWs can read all contacts (for dispatch emergencies)
DROP POLICY IF EXISTS contacts_admin_read ON emergency.contacts;
CREATE POLICY contacts_admin_read ON emergency.contacts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM security.users u
      WHERE u.auth_uid = auth.uid() AND u.role_id IN (1, 2)
    )
  );

-- Grant table-level permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON emergency.contacts TO authenticated;


-- ══════════════════════════════════════════════════════════════
-- FIX 3: health.profiles — Unique Constraint Verification
-- ══════════════════════════════════════════════════════════════

-- The upsert in EnrollmentPage uses onConflict: 'resident_id'.
-- Supabase requires a UNIQUE constraint (not just a PK or FK)
-- on the conflict target column for upsert to resolve correctly.
-- The current seed.sql uses resident_id as an FK, not UNIQUE.
-- This migration adds the missing constraint idempotently.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'health_profiles_resident_id_unique'
      AND conrelid = 'health.profiles'::regclass
  ) THEN
    ALTER TABLE health.profiles
      ADD CONSTRAINT health_profiles_resident_id_unique
      UNIQUE (resident_id);
  END IF;
END;
$$;

-- ── Manual test SQL: verify upsert constraint resolves correctly ─────────────
-- Run this in the Supabase SQL editor to confirm the upsert works:
--
-- Step 1: Insert a test profile
-- INSERT INTO health.profiles
--   (resident_id, blood_type, allergies, medications, past_medical_hx)
-- VALUES
--   ('11111111-1111-1111-1111-111111111111', 'O+', 'Shellfish', 'Lisinopril 10mg', 'None')
-- ON CONFLICT (resident_id)
-- DO UPDATE SET
--   blood_type     = EXCLUDED.blood_type,
--   allergies      = EXCLUDED.allergies,
--   medications    = EXCLUDED.medications,
--   past_medical_hx = EXCLUDED.past_medical_hx,
--   updated_at     = NOW();
--
-- Step 2: Run again with different values — verify updated_at changes:
-- INSERT INTO health.profiles
--   (resident_id, blood_type, allergies, medications, past_medical_hx)
-- VALUES
--   ('11111111-1111-1111-1111-111111111111', 'A+', 'Penicillin', 'Metformin 500mg', 'Appendectomy 2019')
-- ON CONFLICT (resident_id)
-- DO UPDATE SET
--   blood_type     = EXCLUDED.blood_type,
--   allergies      = EXCLUDED.allergies,
--   medications    = EXCLUDED.medications,
--   past_medical_hx = EXCLUDED.past_medical_hx,
--   updated_at     = NOW();
--
-- Step 3: Confirm exactly 1 row exists for the resident
-- SELECT * FROM health.profiles WHERE resident_id = '11111111-1111-1111-1111-111111111111';
-- Expected: 1 row with blood_type = 'A+' and updated_at reflecting the second insert time.

-- ══════════════════════════════════════════════════════════════
-- END OF MIGRATION
-- ══════════════════════════════════════════════════════════════
