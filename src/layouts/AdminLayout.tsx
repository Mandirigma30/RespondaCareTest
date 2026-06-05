import { Outlet } from "react-router-dom";
import { AdminSidebar } from "../components/layout/AdminSidebar";

export default function AdminLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#0c0f16]">
      <AdminSidebar />
      <main className="flex-1 flex flex-col overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
