import { AdminSidebar } from "../components/layout/AdminSidebar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Command Center", template: "%s | RespondaCare Command Center" },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#0c0f16]">
      <AdminSidebar />
      <main className="flex-1 flex flex-col overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
