import { Outlet, Navigate } from "react-router-dom";
import { ResponderSidebar } from "../components/layout/ResponderSidebar";

// [A1] Auth guard: block non-responder sessions from responder routes
function getSessionRole(): string | null {
  try {
    const s = localStorage.getItem("respondaCare_session");
    if (!s) return null;
    return JSON.parse(s).role || null;
  } catch {
    return null;
  }
}

export default function ResponderLayout() {
  const role = getSessionRole();
  if (!role || role !== "responder") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0c0f16]">
      <ResponderSidebar />
      <main className="flex-1 flex flex-col overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
