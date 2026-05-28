import { PatientSidebar } from "../components/layout/PatientSidebar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Patient Portal", template: "%s | RespondaCare Patient Portal" },
};

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#0f1115]">
      <PatientSidebar />
      <main className="flex-grow overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
