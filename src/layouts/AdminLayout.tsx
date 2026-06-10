import { Outlet, Navigate } from "react-router-dom";
import { AdminSidebar } from "../components/layout/AdminSidebar";

// [A1] Auth guard: block non-admin sessions from admin routes
function getSessionRole(): string | null {
  try {
    const s = localStorage.getItem("respondaCare_session");
    if (!s) return null;
    return JSON.parse(s).role || null;
  } catch {
    return null;
  }
}

export default function AdminLayout() {
  const role = getSessionRole();
  if (!role || role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0c0f16]">
      <AdminSidebar />
      <main className="flex-1 flex flex-col overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
