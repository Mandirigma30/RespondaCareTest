import { Routes, Route, Navigate } from 'react-router-dom'

// Layouts
import AdminLayout from './layouts/AdminLayout'
import ResponderLayout from './layouts/ResponderLayout'
import PatientLayout from './layouts/PatientLayout'

// Public Pages
import GatewayPage from './pages/GatewayPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import RegisterResponderPage from './pages/RegisterResponderPage'

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import ResidentsPage from './pages/admin/ResidentsPage'
import AddResidentPage from './pages/admin/AddResidentPage'
import AdminMapPage from './pages/admin/AdminMapPage'
import HealthRecordsPage from './pages/admin/HealthRecordsPage'
import ReportsPage from './pages/admin/ReportsPage'
import AuditLogPage from './pages/admin/AuditLogPage'
import SettingsPage from './pages/admin/SettingsPage'
import EnrollPage from './pages/admin/EnrollPage'

// Responder Pages
import DispatchPage from './pages/responder/DispatchPage'
import HistoryPage from './pages/responder/HistoryPage'
import QRScanPage from './pages/responder/QRScanPage'
import TurnoverPage from './pages/responder/TurnoverPage'

// Patient Pages
import PatientDashboardPage from './pages/patient/PatientDashboardPage'
import EmergencyPage from './pages/patient/EmergencyPage'
import EducationPage from './pages/patient/EducationPage'
import EnrollmentPage from './pages/patient/EnrollmentPage'

export default function App() {
  return (
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
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
