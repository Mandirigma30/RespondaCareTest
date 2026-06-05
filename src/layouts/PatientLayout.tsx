import { Outlet } from "react-router-dom";
import { PatientSidebar } from "../components/layout/PatientSidebar";

export default function PatientLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#0f1115]">
      <PatientSidebar />
      <main className="flex-grow overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
