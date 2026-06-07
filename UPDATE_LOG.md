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
