# RespondaCare — Project Overview
### Philippine Data Privacy Act (RA 10173) Compliant Healthcare Emergency Response PWA

---

## 📌 Project Name
**RespondaCare**

---

## 🎯 Objective
An offline-first mobile-friendly Progressive Web App (PWA) that enables First Responders, Dispatchers, Barangay Health Workers (BHWs), and Residents to:
1. **Securely Authenticate**: Using role-based password credentials with Multi-Factor Authentication (MFA) and daily rotating shift keys.
2. **Scan Offline QR Codes**: Decrypting patient **SAMPLE** medical history locally on-device without exposing unencrypted personal data to the database server (RA 10173 compliance).
   * **S** — Signs & Symptoms
   * **A** — Allergies
   * **M** — Medications
   * **P** — Pertinent Past Medical History
   * **L** — Last Oral Intake
   * **E** — Events Leading to Emergency
3. **Submit Clinical Reports**: Sending Unified Incident Reports (UIR) and Vital Signs to the Supabase backend (PostgreSQL schemas) with full offline queuing and background sync support.

---

## 🛠️ Technology Stack
| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend Core** | React 19 + TypeScript + Vite | Safe, high-performance web structure with modern hooks. |
| **Styling** | Custom Dark-Glow CSS System | Custom high-contrast Dark Mode styling designed for paramedics in low-light environments. |
| **Backend & Auth** | Supabase (PostgreSQL + Auth) | Cloud relational database with Row Level Security (RLS) policies. |
| **Offline Storage** | localStorage / IndexedDB | Caches active offline incident reports and synchronizes automatically on reconnection. |
| **Client-Side Crypto** | Web Crypto API (AES-256-GCM) | Derives keys from local barangay passphrases; encrypts details before database upload. |
| **Doc Generation** | jsPDF & jsPDF-AutoTable | Automatically exports signed clinical turnover reports. |
| **Animations** | GSAP (GreenSock) | Renders fluid state transitions and hold-down safety gestures. |

---

## 🗄️ Database & Security Architecture
The database is structured into **4 isolated PostgreSQL schemas** within Supabase to enforce Role-Based Access Control (RBAC) via Row-Level Security (RLS) rules:

* **`security`**: Gating authentication, users, roles, audit trails, and rotating shift key hashes.
* **`core`**: Barangay parameters, resident profiles, and client-side encrypted payload fields.
* **`health`**: Secure profiles and timelines of clinical treatments/records.
* **`emergency`**: Real-time dispatch coordinates, active incident alerts, and clinical turnovers.

### 🛡️ RA 10173 Security Controls
| Security Control | Implementation |
| :--- | :--- |
| **Authentication** | Supabase Auth (JWT) + custom MFA sandbox validation rules. |
| **Shift Authorization** | Daily rotating shift key hashed using Blowfish-based crypt salts. |
| **Data Encryption** | Client-side AES-256-GCM using Web Crypto API. Server never receives unencrypted PII. |
| **Key Derivation** | PBKDF2 with 100,000 iterations from local barangay keys. |
| **Audit Trails** | Immutable logs of data accesses written to `security.audit_log`. |

---

## 📱 Application Modules

### 1. First Responder Mobile Portal
* **Rotating Shift Gate**: Verifies active responder shift status via server-side RPC before granting access.
* **QR Camera Viewport**: Connects to the local device camera to read physical QR cards. Includes an offline simulation dropdown to mock scanning live residents.
* **SAMPLE Decryption**: Automatically parses and displays decrypted medical records in real-time.
* **Unified Incident Report (UIR)**: Calculates Glasgow Coma Scale (GCS) scores and vital signs, then generates hospital handover PDFs.

### 2. Admin & Dispatch Command Center
* **Real-time Map Integration**: Plots GPS coordinate indicators for active alerts via Leaflet maps.
* **Shift Rotation Console**: Rotating Daily Shift Keys for dispatch security.
* **System Audit Trails**: Live logs showing chronological actions, IP addresses, and database resources accessed.

### 3. Barangay Health Worker (BHW) Intake
* **Intake Forms**: Validated data entry for resident demographics and SAMPLE history.
* **Compliance Checks**: Enforces mandatory RA 10173 consent agreements before writing records.
* **Card Generator**: Encrypts the compiled payload and exports high-fidelity printable digital PDF cards containing secure QR codes.

### 4. Resident & Patient Dashboard
* **Panic SOS Button**: A 3-second hold gesture (preventing accidental triggers) that transmits active coordinates.
* **Personalized Health Guide**: Prioritizes educational articles depending on the resident's chronic conditions (e.g. diabetes tips for diabetic residents).
* **QR Health Card**: Generates a live client-side QR code of their encrypted medical record for paramedics.

---

## 📂 Directory Structure (Actual Workspace)
```
RespondaCare/
├── index.html
├── vite.config.ts
├── package.json
├── seed.sql                  # Main PostgreSQL schema and DB setup
├── supabase_auth_seed.sql     # Supabase Auth mock seed data
├── PROJECT_OVERVIEW.md        # This file
├── UPDATE_LOG.md              # AI session update log
├── DEVELOPER_GUIDE.md         # Detailed technical guide for groupmates
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── App.css
    ├── index.css
    ├── assets/
    ├── components/
    │   ├── MapView.tsx        # Leaflet GIS Mapping component
    │   ├── animations/
    │   ├── layout/
    │   │   ├── AdminSidebar.tsx
    │   │   ├── PatientSidebar.tsx
    │   │   ├── ResponderSidebar.tsx
    │   │   └── TopBar.tsx
    │   └── ui/
    │       ├── Badge.tsx
    │       ├── Button.tsx
    │       ├── DataTable.tsx
    │       ├── FormInput.tsx
    │       ├── IncidentCard.tsx
    │       ├── PageHeader.tsx
    │       └── StatCard.tsx
    ├── hooks/
    │   ├── useGeolocation.ts
    │   └── useOnlineStatus.ts
    ├── lib/
    │   ├── cryptoUtils.ts     # Client-side AES-256-GCM & PBKDF2 encryption helpers
    │   ├── pdfExport.ts       # jsPDF clinical handover generator
    │   └── supabase.ts        # Supabase config client
    └── pages/
        ├── GatewayPage.tsx    # Portal selector gateway page
        ├── LoginPage.tsx      # Multi-step authentication page
        ├── RegisterPage.tsx
        ├── RegisterResponderPage.tsx
        ├── admin/             # Admin/BHW pages
        │   ├── AddResidentPage.tsx
        │   ├── AdminDashboardPage.tsx
        │   ├── AdminMapPage.tsx
        │   ├── AuditLogPage.tsx
        │   ├── EnrollPage.tsx
        │   ├── HealthRecordsPage.tsx
        │   ├── ReportsPage.tsx
        │   ├── ResidentsPage.tsx
        │   └── SettingsPage.tsx
        ├── patient/           # Resident/Patient pages
        │   ├── EducationPage.tsx
        │   ├── EmergencyPage.tsx
        │   ├── EnrollmentPage.tsx
        │   ├── NotificationsPage.tsx
        │   └── PatientDashboardPage.tsx
        └── responder/         # Paramedic pages
            ├── DispatchPage.tsx
            ├── HistoryPage.tsx
            ├── QRScanPage.tsx
            └── TurnoverPage.tsx
```
