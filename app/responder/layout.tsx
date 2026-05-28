import { ResponderSidebar } from "../components/layout/ResponderSidebar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Responder Portal", template: "%s | RespondaCare Responder Portal" },
};

export default function ResponderLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#0c0f16]">
      <ResponderSidebar />
      <main className="flex-1 flex flex-col overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
