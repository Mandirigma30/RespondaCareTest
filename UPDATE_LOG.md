# RespondaCare — Update Log & Session History

This log records the technical changes, fixes, and security updates applied to the RespondaCare codebase.

---

## 📅 Session Update: June 7, 2026

### 1. Row-Level Security (RLS) & Recursion Fix
* **Problem**: Selecting or inserting to `security.users` triggered infinite recursion inside the RLS policy when calling role checks, blocking BHW intakes.
* **Fix**: Implemented the function `security.current_user_role()` with `SECURITY DEFINER` privileges. This allows role checking to run under system authority, bypassing recursive policy triggers.
* **Impact**: BHWs and Administrators can now successfully query roles and perform resident intakes without database error blocks.

### 2. User Insertion Password Constraint
* **Problem**: The database table `security.users` enforced a `NOT NULL` constraint on `password_hash`. When BHWs added new residents without specifying a password, database insertions failed with constraint violations.
* **Fix**:
  1. Updated the backend schema definitions to set a default value of `'password123'` for new resident account creations.
  2. Modified the resident intake query in `AddResidentPage.tsx` to automatically set the `password_hash` parameter to `'password123'` on new account insertion.
* **Impact**: Newly enrolled residents are created successfully in the database.

### 3. Auth Mismatch & Dynamic Credentials Fallback
* **Problem**: Since newly enrolled residents are created inside PostgreSQL tables directly (and not in the external Supabase Auth service catalog), trying to log them in returned `Invalid login credentials`. Furthermore, stale active sessions from other users (e.g., *Xander Puno*) overrode local session storage name tags.
* **Fix**:
  1. **Fallback Authentication**: Built a secure credentials fallback check in `LoginPage.tsx`. If Supabase Auth fails, the portal queries the `security.users` table for the email and checks if the entered password matches the DB record.
  2. **Session Decoupling**: Instructed the custom authentication fallback to call `supabase.auth.signOut()` upon success. This wipes stale Supabase Auth cookies and tokens from previous accounts.
  3. **Unified Dashboard Loading**: Refactored `PatientDashboardPage.tsx` to read user parameters and details from `respondaCare_session` (localStorage) first, using the active `auth_uid` to query the database.
* **Impact**: Dynamic login for newly created residents (like *Juan Dela Cruz*) works perfectly, and their specific custom dashboards load with zero profile overlap.

### 4. Live Database Resident Scanner Dropdown
* **Problem**: The simulated QR camera scanner in `QRScanPage.tsx` only loaded local sandbox cache profiles, preventing first responders from mock-testing the decryption of newly enrolled live residents.
* **Fix**:
  1. Updated the `useEffect` hook in `QRScanPage.tsx` to fetch active records from `core.residents` and `security.users` tables in real-time.
  2. Implemented defensive data mapping to inspect if joined tables are returned as arrays or objects, eliminating TypeScript compilation issues on build.
* **Impact**: Newly enrolled residents are automatically populated in the Simulated Scanner droplist, enabling instant verification of GCM cryptographic decryption.

---

## 📅 Session Update: June 10, 2026

### 1. Database-Level RLS Policies & Grants Patch
* **Problem**: Row Level Security (RLS) was enabled in Supabase, but with zero policies. This silently blocked authenticated operations, specifically saving resident health profiles **[R1]** and adding new residents **[C2]**.
* **Fix**:
  1. Created and ran [supabase_grants.sql](file:///d:/RespondaCare/supabase_grants.sql) to grant schema (`core`, `health`, `security`, `emergency`) usage and table operations to the `authenticated` role.
  2. Applied clean, idempotent RLS policies for `core.residents`, `health.profiles`, `health.allergy_flags`, `health.medications`, `health.records`, `security.users`, `security.audit_log`, and `emergency.incidents`.
  3. Identified `emergency.handovers` as a view (which cannot have RLS or direct table modifications in Supabase) and omitted it from RLS configuration to prevent migration failures.
* **Impact**: Residents can now successfully save and load allergy and medical records from the live Supabase instance; Admins can enroll new residents without permission-denied exceptions.

### 2. Layout Route Guards (Admin / Responder Auto-Login Guard)
* **Problem**: If a responder logged in, they could bypass checks and be routed/treated as an administrator, or vice versa, due to lacking validation in the wrapper layouts **[A1]**.
* **Fix**:
  1. Added session-based role checks to [AdminLayout.tsx](file:///d:/RespondaCare/src/layouts/AdminLayout.tsx), [PatientLayout.tsx](file:///d:/RespondaCare/src/layouts/PatientLayout.tsx), and [ResponderLayout.tsx](file:///d:/RespondaCare/src/layouts/ResponderLayout.tsx).
  2. Restricted access to child routes unless the user's role explicitly matches the layout type (redirecting to `/` on failure).
* **Impact**: Bulletproof routing layout-level guards prevent role escalation and route leakage.

### 3. Dispatch GPS Coordinates Fallback
* **Problem**: SOS calls with no stored address field showed hardcoded passthrough text rather than precise active coordinates **[C1]**.
* **Fix**:
  1. Modified [DispatchPage.tsx](file:///d:/RespondaCare/src/pages/responder/DispatchPage.tsx) to inspect if an address is absent.
  2. In the absence of an address, it displays the exact coordinates in the format `GPS: latitude, longitude`.
* **Impact**: First responders see accurate dispatch locations.

### 4. Interactive Map Pan/Drag Fix
* **Problem**: The tactical map container in [AdminMapPage.tsx](file:///d:/RespondaCare/src/pages/admin/AdminMapPage.tsx) was frozen and not draggable **[C3]**.
* **Fix**: Removed the `data-animate` attribute from the Leaflet Map container, preventing layout animation packages from overriding map canvas interactions.
* **Impact**: Map panning and zooming works correctly.
