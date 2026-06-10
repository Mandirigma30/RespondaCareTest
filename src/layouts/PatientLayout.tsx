import { Outlet, Navigate } from "react-router-dom";
import { PatientSidebar } from "../components/layout/PatientSidebar";

// [A1] Auth guard: block non-patient sessions from patient routes
function getSessionRole(): string | null {
  try {
    const s = localStorage.getItem("respondaCare_session");
    if (!s) return null;
    return JSON.parse(s).role || null;
  } catch {
    return null;
  }
}

export default function PatientLayout() {
  const role = getSessionRole();
  if (!role || role !== "patient") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0f1115]">
      <PatientSidebar />
      <main className="flex-grow overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
