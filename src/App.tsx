import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

// Layouts
import AdminLayout from './layouts/AdminLayout'
import ResponderLayout from './layouts/ResponderLayout'
import PatientLayout from './layouts/PatientLayout'

// Public Pages (Static or Lazy)
const GatewayPage = lazy(() => import('./pages/GatewayPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const RegisterResponderPage = lazy(() => import('./pages/RegisterResponderPage'))

// Admin Pages (Lazy)
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'))
const ResidentsPage = lazy(() => import('./pages/admin/ResidentsPage'))
const AddResidentPage = lazy(() => import('./pages/admin/AddResidentPage'))
const AdminMapPage = lazy(() => import('./pages/admin/AdminMapPage'))
const HealthRecordsPage = lazy(() => import('./pages/admin/HealthRecordsPage'))
const ReportsPage = lazy(() => import('./pages/admin/ReportsPage'))
const AuditLogPage = lazy(() => import('./pages/admin/AuditLogPage'))
const SettingsPage = lazy(() => import('./pages/admin/SettingsPage'))
const EnrollPage = lazy(() => import('./pages/admin/EnrollPage'))

// Responder Pages (Lazy)
const DispatchPage = lazy(() => import('./pages/responder/DispatchPage'))
const HistoryPage = lazy(() => import('./pages/responder/HistoryPage'))
const QRScanPage = lazy(() => import('./pages/responder/QRScanPage'))
const TurnoverPage = lazy(() => import('./pages/responder/TurnoverPage'))

// Patient Pages (Lazy)
const PatientDashboardPage = lazy(() => import('./pages/patient/PatientDashboardPage'))
const EmergencyPage = lazy(() => import('./pages/patient/EmergencyPage'))
const EducationPage = lazy(() => import('./pages/patient/EducationPage'))
const EnrollmentPage = lazy(() => import('./pages/patient/EnrollmentPage'))
const PatientNotificationsPage = lazy(() => import('./pages/patient/NotificationsPage'))
const PatientHealthRecordsPage = lazy(() => import('./pages/patient/PatientHealthRecordsPage'))

const PageLoader = () => (
  <div className="min-h-screen bg-[#0c0f16] text-white flex flex-col items-center justify-center font-mono">
    <div className="w-10 h-10 border-2 border-t-transparent border-red-500 rounded-full animate-spin mb-4" />
    <div className="text-xs text-gray-500 uppercase tracking-widest animate-pulse">RespondaCare Loading...</div>
  </div>
)

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<GatewayPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/register/responder" element={<RegisterResponderPage />} />

        {/* Admin */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="residents" element={<ResidentsPage />} />
          <Route path="residents/new" element={<AddResidentPage />} />
          <Route path="map" element={<AdminMapPage />} />
          <Route path="health-records" element={<HealthRecordsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="audit-log" element={<AuditLogPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="enroll" element={<EnrollPage />} />
        </Route>

        {/* Responder */}
        <Route path="/responder" element={<ResponderLayout />}>
          <Route index element={<Navigate to="/responder/dispatch" replace />} />
          <Route path="dispatch" element={<DispatchPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="qr-scan" element={<QRScanPage />} />
          <Route path="turnover" element={<TurnoverPage />} />
        </Route>

        {/* Patient */}
        <Route path="/patient" element={<PatientLayout />}>
          <Route index element={<Navigate to="/patient/dashboard" replace />} />
          <Route path="dashboard" element={<PatientDashboardPage />} />
          <Route path="emergency" element={<EmergencyPage />} />
          <Route path="education" element={<EducationPage />} />
          <Route path="enrollment" element={<EnrollmentPage />} />
          <Route path="notifications" element={<PatientNotificationsPage />} />
          <Route path="health-records" element={<PatientHealthRecordsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

