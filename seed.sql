-- ============================================================
--  RespondaCare — Complete Database Schema (Idempotent)
--  Version: 1.0.1
--  Compliance: RA 10173 (Philippine Data Privacy Act)
--  Author: RespondaCare Engineering Team
-- ============================================================
-- Run this file in your Supabase SQL editor to provision the
-- full 4-schema database structure with RLS, triggers, and RPCs.
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- SCHEMA CREATION
-- ──────────────────────────────────────────────────────────────

CREATE SCHEMA IF NOT EXISTS security;
CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS health;
CREATE SCHEMA IF NOT EXISTS emergency;

-- ──────────────────────────────────────────────────────────────
-- EXTENSIONS
-- ──────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- SCHEMA: security
-- Handles authentication, RBAC, consent logs, audit trail
-- ============================================================

-- ── security.roles ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS security.roles (
    role_id   INTEGER PRIMARY KEY,
    role_name TEXT NOT NULL UNIQUE CHECK (role_name IN ('admin', 'bhw', 'responder', 'patient', 'dispatcher'))
);

INSERT INTO security.roles (role_id, role_name) OVERRIDING SYSTEM VALUE VALUES
  (1, 'admin'),
  (2, 'bhw'),
  (3, 'patient'),
  (4, 'responder'),
  (5, 'dispatcher')
ON CONFLICT (role_id) DO UPDATE SET role_name = EXCLUDED.role_name;

-- ── security.users ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS security.users (
    user_id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_uid       UUID UNIQUE,                       -- matches auth.users.id
    role_id        INTEGER REFERENCES security.roles(role_id),
    barangay_id    INTEGER,
    full_name      TEXT,
    email          TEXT UNIQUE NOT NULL,
    phone          TEXT,
    is_active      BOOLEAN DEFAULT TRUE,
    totp_secret    TEXT,                              -- TOTP secret (server-encrypted)
    password_hash  TEXT,                              -- credentials fallback
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    updated_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE security.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_self_read ON security.users;
CREATE POLICY users_self_read ON security.users
  FOR SELECT USING (auth.uid() = auth_uid);

DROP POLICY IF EXISTS users_admin_all ON security.users;
CREATE POLICY users_admin_all ON security.users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM security.users u
      WHERE u.auth_uid = auth.uid() AND u.role_id IN (1, 2)
    )
  );

-- ── security.consent_log ────────────────────────────────────
CREATE TABLE IF NOT EXISTS security.consent_log (
    consent_id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES security.users(user_id) ON DELETE CASCADE,
    consent_version TEXT NOT NULL DEFAULT '1.0',
    purpose         TEXT NOT NULL,
    granted_at      TIMESTAMPTZ DEFAULT NOW(),
    revoked_at      TIMESTAMPTZ,
    ip_address      TEXT,
    user_agent      TEXT
);

ALTER TABLE security.consent_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS consent_self ON security.consent_log;
CREATE POLICY consent_self ON security.consent_log
  FOR SELECT USING (
    user_id IN (
      SELECT user_id FROM security.users WHERE auth_uid = auth.uid()
    )
  );

-- ── security.audit_log ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS security.audit_log (
    log_id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id      UUID REFERENCES security.users(user_id),
    action        TEXT NOT NULL,
    target_table  TEXT,
    target_id     UUID,
    details       JSONB,
    ip_address    TEXT,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE security.audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS audit_admin_read ON security.audit_log;
CREATE POLICY audit_admin_read ON security.audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM security.users u
      WHERE u.auth_uid = auth.uid() AND u.role_id IN (1, 2)
    )
  );

-- Audit trigger function
CREATE OR REPLACE FUNCTION security.log_audit()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO security.audit_log (action, target_table, target_id, details)
  VALUES (
    TG_OP,
    TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME,
    COALESCE(NEW.user_id, OLD.user_id, TG_TABLE_NAME::text || '-id-placeholder'::text),
    row_to_json(COALESCE(NEW, OLD))::jsonb
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- ── security.shift_keys ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS security.shift_keys (
    key_id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key_hash       TEXT NOT NULL,              -- bcrypt hash of the key
    valid_date     DATE NOT NULL DEFAULT CURRENT_DATE,
    created_by     UUID REFERENCES security.users(user_id),
    is_active      BOOLEAN DEFAULT TRUE,
    created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE security.shift_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS shift_keys_admin ON security.shift_keys;
CREATE POLICY shift_keys_admin ON security.shift_keys
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM security.users u
      WHERE u.auth_uid = auth.uid() AND u.role_id IN (1, 2)
    )
  );

-- ============================================================
-- SCHEMA: core
-- Barangay, resident profiles, and BHW assignments
-- ============================================================

-- ── core.barangays ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS core.barangays (
    barangay_id    INTEGER PRIMARY KEY,
    barangay_name  TEXT NOT NULL,
    city           TEXT NOT NULL DEFAULT 'Pasay City',
    province       TEXT NOT NULL DEFAULT 'Metro Manila',
    region         TEXT NOT NULL DEFAULT 'NCR',
    coordinates    POINT,
    created_at     TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO core.barangays (barangay_id, barangay_name) OVERRIDING SYSTEM VALUE VALUES
  (1, 'Barangay 45'),
  (2, 'Barangay 46'),
  (3, 'San Lorenzo'),
  (4, 'Plainview')
ON CONFLICT (barangay_id) DO UPDATE SET barangay_name = EXCLUDED.barangay_name;

-- ── core.residents ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS core.residents (
    resident_id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id           UUID REFERENCES security.users(user_id) ON DELETE SET NULL,
    barangay_id       INTEGER REFERENCES core.barangays(barangay_id),
    address           TEXT,
    date_of_birth     DATE,
    gender            TEXT,
    contact_number    TEXT,
    household_type    TEXT,
    mobility_status   TEXT,
    next_of_kin_name  TEXT,
    next_of_kin_relationship TEXT,
    next_of_kin_contact_number TEXT,
    consent_given     BOOLEAN DEFAULT FALSE,
    enrolled_by       UUID REFERENCES security.users(user_id),
    encrypted_payload TEXT,                    -- AES-256-GCM encrypted backup payload
    is_anonymized     BOOLEAN DEFAULT FALSE,
    consent_granted   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE core.residents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS residents_self ON core.residents;
CREATE POLICY residents_self ON core.residents
  FOR SELECT USING (
    user_id IN (SELECT user_id FROM security.users WHERE auth_uid = auth.uid())
  );

DROP POLICY IF EXISTS residents_bhw_all ON core.residents;
CREATE POLICY residents_bhw_all ON core.residents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM security.users u
      WHERE u.auth_uid = auth.uid() AND u.role_id IN (1, 2, 4)
    )
  );

-- Audit trigger on residents
DROP TRIGGER IF EXISTS residents_audit ON core.residents;
CREATE TRIGGER residents_audit
  AFTER INSERT OR UPDATE OR DELETE ON core.residents
  FOR EACH ROW EXECUTE FUNCTION security.log_audit();

-- ── core.bhw_assignments ────────────────────────────────────
CREATE TABLE IF NOT EXISTS core.bhw_assignments (
    assignment_id  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bhw_user_id    UUID REFERENCES security.users(user_id),
    barangay_id    INTEGER REFERENCES core.barangays(barangay_id),
    assigned_at    TIMESTAMPTZ DEFAULT NOW(),
    is_active      BOOLEAN DEFAULT TRUE
);

ALTER TABLE core.bhw_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS bhw_assignments_admin ON core.bhw_assignments;
CREATE POLICY bhw_assignments_admin ON core.bhw_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM security.users u
      WHERE u.auth_uid = auth.uid() AND u.role_id = 1
    )
  );

-- ── core.educational_materials ──────────────────────────────
CREATE TABLE IF NOT EXISTS core.educational_materials (
    material_id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title         TEXT NOT NULL,
    category      TEXT NOT NULL,
    content       TEXT NOT NULL,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE core.educational_materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS materials_select_all ON core.educational_materials;
CREATE POLICY materials_select_all ON core.educational_materials FOR SELECT TO PUBLIC USING (true);

-- ============================================================
-- SCHEMA: health
-- Encrypted health records, conditions, allergy flags
-- ============================================================

-- ── health.profiles ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS health.profiles (
    profile_id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resident_id        UUID REFERENCES core.residents(resident_id) ON DELETE CASCADE,
    blood_type         TEXT,
    signs_symptoms     TEXT,
    allergies          TEXT,
    medications        TEXT,
    past_medical_hx    TEXT,
    last_intake        TEXT,
    events_leading     TEXT,
    updated_by         UUID,
    updated_at         TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE health.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS health_profiles_all ON health.profiles;
CREATE POLICY health_profiles_all ON health.profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM security.users u
      WHERE u.auth_uid = auth.uid() AND u.role_id IN (1, 2, 4)
    )
  );

DROP POLICY IF EXISTS health_profiles_self ON health.profiles;
CREATE POLICY health_profiles_self ON health.profiles
  FOR SELECT USING (
    resident_id IN (
      SELECT r.resident_id FROM core.residents r
      JOIN security.users u ON r.user_id = u.user_id
      WHERE u.auth_uid = auth.uid()
    )
  );

-- ── health.records ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS health.records (
    record_id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resident_id        UUID REFERENCES core.residents(resident_id) ON DELETE CASCADE,
    encrypted_vitals   TEXT NOT NULL,           -- AES-256-GCM encrypted vitals JSONB
    record_type        TEXT NOT NULL DEFAULT 'initial' CHECK (record_type IN ('initial','follow_up','emergency','updated')),
    recorded_by        UUID REFERENCES security.users(user_id),
    source_incident_id UUID,
    created_at         TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE health.records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS health_records_responder ON health.records;
CREATE POLICY health_records_responder ON health.records
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM security.users u
      WHERE u.auth_uid = auth.uid() AND u.role_id IN (1, 2, 4)
    )
  );

DROP POLICY IF EXISTS health_records_self ON health.records;
CREATE POLICY health_records_self ON health.records
  FOR SELECT USING (
    resident_id IN (
      SELECT r.resident_id FROM core.residents r
      JOIN security.users u ON r.user_id = u.user_id
      WHERE u.auth_uid = auth.uid()
    )
  );

-- Audit trigger on health records
DROP TRIGGER IF EXISTS health_records_audit ON health.records;
CREATE TRIGGER health_records_audit
  AFTER INSERT OR UPDATE OR DELETE ON health.records
  FOR EACH ROW EXECUTE FUNCTION security.log_audit();

-- ── health.allergy_flags ────────────────────────────────────
CREATE TABLE IF NOT EXISTS health.allergy_flags (
    flag_id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resident_id    UUID REFERENCES core.residents(resident_id) ON DELETE CASCADE,
    allergen_name  TEXT NOT NULL,
    severity       TEXT NOT NULL DEFAULT 'moderate' CHECK (severity IN ('mild','moderate','severe','life_threatening')),
    flagged_by     UUID REFERENCES security.users(user_id),
    flagged_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE health.allergy_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS allergy_flags_medical ON health.allergy_flags;
CREATE POLICY allergy_flags_medical ON health.allergy_flags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM security.users u
      WHERE u.auth_uid = auth.uid() AND u.role_id IN (1, 2, 4)
    )
  );

-- ── health.medications ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS health.medications (
    medication_id  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resident_id    UUID REFERENCES core.residents(resident_id) ON DELETE CASCADE,
    drug_name      TEXT NOT NULL,
    dosage         TEXT,
    frequency      TEXT,
    prescribed_by  TEXT,
    is_active      BOOLEAN DEFAULT TRUE,
    created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE health.medications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS medications_medical ON health.medications;
CREATE POLICY medications_medical ON health.medications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM security.users u
      WHERE u.auth_uid = auth.uid() AND u.role_id IN (1, 2, 4)
    )
  );

-- ============================================================
-- SCHEMA: emergency
-- Incident reports, dispatch, UIR / handover records
-- ============================================================

-- ── emergency.incidents ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS emergency.incidents (
    incident_id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reported_by      UUID REFERENCES security.users(user_id),
    assigned_to      UUID REFERENCES security.users(user_id),
    resident_id      UUID REFERENCES core.residents(resident_id),
    status           TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active','Dispatched','On-Scene','Resolved','Cancelled')),
    latitude         DOUBLE PRECISION,
    longitude        DOUBLE PRECISION,
    address          TEXT,
    barangay_id      INTEGER REFERENCES core.barangays(barangay_id),
    nature_of_call   TEXT,
    severity_score   INTEGER CHECK (severity_score BETWEEN 1 AND 5),
    incident_date    DATE DEFAULT CURRENT_DATE,
    dispatch_time    TIMESTAMPTZ,
    arrival_time     TIMESTAMPTZ,
    clear_time       TIMESTAMPTZ,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE emergency.incidents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS incidents_responder_all ON emergency.incidents;
CREATE POLICY incidents_responder_all ON emergency.incidents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM security.users u
      WHERE u.auth_uid = auth.uid() AND u.role_id IN (1, 2, 4, 5)
    )
  );

DROP POLICY IF EXISTS incidents_patient_own ON emergency.incidents;
CREATE POLICY incidents_patient_own ON emergency.incidents
  FOR SELECT USING (
    reported_by IN (SELECT user_id FROM security.users WHERE auth_uid = auth.uid())
  );

-- Audit trigger
DROP TRIGGER IF EXISTS incidents_audit ON emergency.incidents;
CREATE TRIGGER incidents_audit
  AFTER INSERT OR UPDATE OR DELETE ON emergency.incidents
  FOR EACH ROW EXECUTE FUNCTION security.log_audit();

-- ── emergency.handovers (UIR) ───────────────────────────────
CREATE TABLE IF NOT EXISTS emergency.handovers (
    handover_id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id          UUID REFERENCES emergency.incidents(incident_id) ON DELETE CASCADE,
    responder_id         UUID REFERENCES security.users(user_id),
    patient_name         TEXT,                  -- Duplicate for quick reference (non-PHI)
    encrypted_vitals     TEXT,                  -- AES-256-GCM encrypted UIR vitals
    receiving_hospital   TEXT,
    receiving_provider   TEXT,
    transport_mode       TEXT DEFAULT 'Ambulance',
    departure_time       TIMESTAMPTZ,
    arrival_at_facility  TIMESTAMPTZ,
    gcs_total            INTEGER,
    severity_score       INTEGER,
    response_outcome     TEXT,
    turnover_notes       TEXT,
    pdf_generated        BOOLEAN DEFAULT FALSE,
    created_at           TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE emergency.handovers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS handovers_medical ON emergency.handovers;
CREATE POLICY handovers_medical ON emergency.handovers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM security.users u
      WHERE u.auth_uid = auth.uid() AND u.role_id IN (1, 2, 4)
    )
  );

-- ── emergency.offline_queue ─────────────────────────────────
-- Fallback table for syncing reports queued during offline mode.
CREATE TABLE IF NOT EXISTS emergency.offline_queue (
    queue_id    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID REFERENCES security.users(user_id),
    target_schema TEXT NOT NULL,
    target_table  TEXT NOT NULL,
    payload     JSONB NOT NULL,
    queued_at   TIMESTAMPTZ DEFAULT NOW(),
    synced_at   TIMESTAMPTZ,
    is_synced   BOOLEAN DEFAULT FALSE
);

ALTER TABLE emergency.offline_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS offline_queue_self ON emergency.offline_queue;
CREATE POLICY offline_queue_self ON emergency.offline_queue
  FOR ALL USING (
    user_id IN (SELECT user_id FROM security.users WHERE auth_uid = auth.uid())
  );

-- ============================================================
-- RPCs (Remote Procedure Calls)
-- ============================================================

-- ── RPC: anonymize_resident (RA 10173 Right to Erasure) ─────
CREATE OR REPLACE FUNCTION anonymize_resident(p_user_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_resident_id UUID;
BEGIN
  -- Validate caller is the owner or an admin
  IF NOT EXISTS (
    SELECT 1 FROM security.users u
    WHERE u.user_id = p_user_id
    AND (
      u.auth_uid = auth.uid()
      OR EXISTS (
        SELECT 1 FROM security.users a
        WHERE a.auth_uid = auth.uid() AND a.role_id = 1
      )
    )
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Cannot anonymize another user''s data.';
  END IF;

  -- Get resident ID
  SELECT resident_id INTO v_resident_id
  FROM core.residents WHERE user_id = p_user_id LIMIT 1;

  IF v_resident_id IS NOT NULL THEN
    -- Overwrite encrypted payload with placeholder
    UPDATE core.residents
    SET
      encrypted_payload = '[ANONYMIZED PER RA 10173 REQUEST]',
      nok_name          = '[REDACTED]',
      nok_relationship  = '[REDACTED]',
      nok_contact       = '[REDACTED]',
      is_anonymized     = TRUE,
      updated_at        = NOW()
    WHERE resident_id = v_resident_id;

    -- Delete linked health records
    DELETE FROM health.records      WHERE resident_id = v_resident_id;
    DELETE FROM health.allergy_flags WHERE resident_id = v_resident_id;
    DELETE FROM health.medications  WHERE resident_id = v_resident_id;
    DELETE FROM health.profiles     WHERE resident_id = v_resident_id;
  END IF;

  -- Anonymize the user account
  UPDATE security.users
  SET
    full_name  = '[ANONYMIZED]',
    email      = 'anon-' || p_user_id || '@deleted.respondacare.ph',
    phone      = NULL,
    is_active  = FALSE,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Log the erasure in audit trail
  INSERT INTO security.audit_log (action, target_table, target_id, details)
  VALUES (
    'ANONYMIZE',
    'core.residents + security.users',
    p_user_id,
    jsonb_build_object(
      'reason', 'RA 10173 Right to Erasure Request',
      'timestamp', NOW()
    )
  );
END;
$$;

-- ── RPC: get_incident_summary (admin dashboard stats) ───────
CREATE OR REPLACE FUNCTION get_incident_summary(p_barangay_id INTEGER DEFAULT NULL)
RETURNS TABLE (
  total_incidents  BIGINT,
  active_incidents BIGINT,
  resolved_today   BIGINT,
  avg_severity     NUMERIC
) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    COUNT(*)                                                          AS total_incidents,
    COUNT(*) FILTER (WHERE status = 'Active')                        AS active_incidents,
    COUNT(*) FILTER (WHERE status = 'Resolved' AND incident_date = CURRENT_DATE) AS resolved_today,
    ROUND(AVG(severity_score), 1)                                    AS avg_severity
  FROM emergency.incidents
  WHERE (p_barangay_id IS NULL OR barangay_id = p_barangay_id);
$$;

-- ── RPC: verify_shift_key ────────────────────────────────────
CREATE OR REPLACE FUNCTION verify_shift_key(p_key TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM security.shift_keys
    WHERE valid_date = CURRENT_DATE
    AND is_active = TRUE
    AND key_hash = crypt(p_key, key_hash)
  );
END;
$$;

-- ── Trigger Trigger Function: security.handle_new_user() ─────
CREATE OR REPLACE FUNCTION security.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO security.users (user_id, auth_uid, full_name, email, role_id, password_hash, is_active)
  VALUES (
    NEW.id,
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    CASE 
      WHEN NEW.raw_user_meta_data->>'role' = 'responder' THEN 4
      WHEN NEW.raw_user_meta_data->>'role' = 'bhw' THEN 2
      WHEN NEW.raw_user_meta_data->>'role' = 'admin' THEN 1
      ELSE 3
    END,
    '[SUPABASE_AUTH]',
    TRUE
  )
  ON CONFLICT (email) DO UPDATE
  SET auth_uid = EXCLUDED.auth_uid,
      user_id = EXCLUDED.user_id;
  RETURN NEW;
END;
$$;

-- ============================================================
-- SEED DATA (Demo / Testing)
-- ============================================================

-- Seed Shift Keys (Rotating Key verification)
-- Key: 'RESP-ABCD-1234-EFGH'
INSERT INTO security.shift_keys (key_hash, valid_date, is_active) VALUES
  (crypt('RESP-ABCD-1234-EFGH', gen_salt('bf')), CURRENT_DATE, TRUE)
ON CONFLICT DO NOTHING;

-- Seed System Users
INSERT INTO security.users (user_id, email, full_name, role_id, password_hash) VALUES
  ('00000000-0000-0000-0000-000000000000', 'admin@respondacare.ph', 'System Admin', 1, 'admin123'),
  ('33333333-3333-3333-3333-333333333333', 'bhw@respondacare.ph', 'Barangay Health Worker', 2, 'bhw123'),
  ('11111111-1111-1111-1111-111111111111', 'resident@respondacare.ph', 'Juan Dela Cruz', 3, 'resident123'),
  ('22222222-2222-2222-2222-222222222222', 'responder@respondacare.ph', 'First Responder', 4, 'responder123')
ON CONFLICT (email) DO NOTHING;

-- Seed core.residents
INSERT INTO core.residents (resident_id, user_id, barangay_id, address, date_of_birth, gender, contact_number, nok_name, nok_relationship, nok_contact, consent_given, consent_granted) VALUES
  ('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 1, 'Zone 3, Barangay 45, Pasay City', '1990-01-01', 'Male', '09171234567', 'Maria Dela Cruz', 'Spouse', '09187654321', TRUE, TRUE)
ON CONFLICT DO NOTHING;

-- Seed health.profiles
INSERT INTO health.profiles (profile_id, resident_id, blood_type, signs_symptoms, allergies, medications, past_medical_hx, last_intake, events_leading, updated_by) VALUES
  ('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'O+', 'Chronic cough, seasonal allergies', 'Shellfish, Penicillin', 'Loratadine 10mg once daily', 'Mild asthma diagnosed in childhood', 'Rice and chicken breast at 12:30 PM', 'Dusty environment triggered mild wheezing', '33333333-3333-3333-3333-333333333333')
ON CONFLICT DO NOTHING;

-- Seed First-Aid Hub content
INSERT INTO core.educational_materials (title, category, content) VALUES
  ('Cardiopulmonary Resuscitation (CPR)', 'Cardiac', '### CPR Guide\n1. Check scene safety.\n2. Tap and shout to check for response.\n3. Call 911.\n4. Perform 30 chest compressions at 100-120 bpm.\n5. Give 2 rescue breaths.\n6. Repeat until medical help arrives.'),
  ('Difficulty Breathing (Asthma)', 'Pulmonary', '### Asthma Action Steps\n1. Help the patient sit upright.\n2. Loosen tight clothing.\n3. Assist with rescue inhaler.\n4. Stay calm and keep the patient relaxed.\n5. Call emergency dispatches if conditions worsen.'),
  ('Severe Bleeding Control', 'Trauma', '### Bleeding Guide\n1. Apply direct pressure to the wound with a clean cloth.\n2. Elevate the injured limb above heart level if possible.\n3. Wrap tightly with a sterile bandage.\n4. Do not remove original dressing if soaked; add more layers on top.')
ON CONFLICT DO NOTHING;

-- ============================================================
-- GRANTS
-- ============================================================

GRANT USAGE ON SCHEMA security  TO authenticated, anon;
GRANT USAGE ON SCHEMA core       TO authenticated, anon;
GRANT USAGE ON SCHEMA health     TO authenticated;
GRANT USAGE ON SCHEMA emergency  TO authenticated;

GRANT SELECT, INSERT, UPDATE ON security.audit_log     TO authenticated;
GRANT SELECT, INSERT ON emergency.incidents             TO authenticated;
GRANT SELECT, INSERT ON emergency.offline_queue         TO authenticated;
GRANT SELECT ON core.barangays                          TO authenticated, anon;
GRANT SELECT ON security.roles                          TO authenticated;

-- ============================================================
-- END OF RespondaCare Schema
-- ============================================================
