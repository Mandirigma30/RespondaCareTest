-- ============================================================
--  RespondaCare — Migration: emergency.contacts (v2 canonical)
--  Date: 2026-06-11
--  SAFE TO RE-RUN (idempotent).
--
--  Creates the emergency.contacts table with AES-256-GCM
--  encrypted name + phone columns, enables RLS, and creates
--  the four ownership policies.
-- ============================================================

-- Ensure the authenticated role can use the schema
GRANT USAGE ON SCHEMA emergency TO authenticated;

-- ── Table ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS emergency.contacts (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resident_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    encrypted_name   TEXT NOT NULL,      -- AES-256-GCM encrypted, base64 encoded
    relationship     TEXT,
    encrypted_phone  TEXT NOT NULL,      -- AES-256-GCM encrypted, base64 encoded
    created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── Row Level Security ────────────────────────────────────────────────────────
ALTER TABLE emergency.contacts ENABLE ROW LEVEL SECURITY;

-- SELECT: residents read only their own contacts
DROP POLICY IF EXISTS contacts_select_own ON emergency.contacts;
CREATE POLICY contacts_select_own ON emergency.contacts
  FOR SELECT
  USING (auth.uid() = resident_id);

-- INSERT: residents may only insert rows for themselves
DROP POLICY IF EXISTS contacts_insert_own ON emergency.contacts;
CREATE POLICY contacts_insert_own ON emergency.contacts
  FOR INSERT
  WITH CHECK (auth.uid() = resident_id);

-- UPDATE: residents may only update their own rows
DROP POLICY IF EXISTS contacts_update_own ON emergency.contacts;
CREATE POLICY contacts_update_own ON emergency.contacts
  FOR UPDATE
  USING (auth.uid() = resident_id)
  WITH CHECK (auth.uid() = resident_id);

-- DELETE: residents may only delete their own rows
DROP POLICY IF EXISTS contacts_delete_own ON emergency.contacts;
CREATE POLICY contacts_delete_own ON emergency.contacts
  FOR DELETE
  USING (auth.uid() = resident_id);

-- Grant DML to authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON emergency.contacts TO authenticated;

-- ── health.profiles UNIQUE constraint (required for upsert onConflict) ─────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'health_profiles_resident_id_unique'
      AND conrelid = 'health.profiles'::regclass
  ) THEN
    ALTER TABLE health.profiles
      ADD CONSTRAINT health_profiles_resident_id_unique
      UNIQUE (resident_id);
  END IF;
END;
$$;

-- ============================================================
-- END OF MIGRATION
-- ============================================================
