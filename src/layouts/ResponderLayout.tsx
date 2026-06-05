import { Outlet } from "react-router-dom";
import { ResponderSidebar } from "../components/layout/ResponderSidebar";

export default function ResponderLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#0c0f16]">
      <ResponderSidebar />
      <main className="flex-1 flex flex-col overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
