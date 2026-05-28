"use client";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { HeartPulse, Car, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { TopBar } from "../../components/layout/TopBar";
import { PageHeader } from "../../components/ui/PageHeader";
import { Badge } from "../../components/ui/Badge";

const history = [
  { id: "#INC-2043", type: "Cardiac Arrest",    address: "Zone 3, Rizal St.",      time: "09:15",   duration: "18 min", outcome: "Stabilized & Transported", status: "resolved", icon: <HeartPulse className="w-5 h-5" /> },
  { id: "#INC-2040", type: "Vehicular Accident", address: "Taft Ave",               time: "Yesterday", duration: "32 min", outcome: "Multi-casualty — 2 transported", status: "resolved", icon: <Car className="w-5 h-5" /> },
  { id: "#INC-2038", type: "Medical Assistance", address: "Zone 1, Sta. Cruz St.",  time: "2 days ago", duration: "12 min", outcome: "Patient referred to BHW",     status: "resolved", icon: <CheckCircle className="w-5 h-5" /> },
  { id: "#INC-2034", type: "Fever / Flu",        address: "Zone 5, Blumentritt",    time: "3 days ago", duration: "8 min",  outcome: "Medication dispensed",          status: "resolved", icon: <AlertTriangle className="w-5 h-5" /> },
];

export default function HistoryPage() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-animate]", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.07, ease: "power2.out" });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={ref} className="flex flex-col h-full">
      <TopBar title="Incident History" searchPlaceholder="Search history..." />
      <div className="px-8 py-6 flex-1">
        <PageHeader title="Incident History" subtitle="Your complete response history and outcomes." />

        <div className="space-y-4">
          {history.map((h, i) => (
            <div key={i} data-animate className="bg-[#1a1d23] rounded-2xl border border-[#2d333b] border-l-4 border-l-[#48bb78] p-6 hover-lift">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 bg-green-900/20 rounded-xl text-[#48bb78] flex-shrink-0">{h.icon}</div>
                  <div>
                    <h3 className="font-bold text-white text-lg">{h.type}</h3>
                    <p className="text-[#8b949e] text-sm mt-1">{h.address}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-[#8b949e]">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {h.time}</span>
                      <span>Duration: {h.duration}</span>
                      <span className="font-mono text-gray-600">{h.id}</span>
                    </div>
                  </div>
                </div>
                <Badge variant="resolved">Resolved</Badge>
              </div>
              <div className="mt-4 bg-[#0c0f16] rounded-xl p-3 border border-[#2d333b]">
                <p className="text-xs text-[#8b949e] font-bold uppercase tracking-widest mb-1">Outcome</p>
                <p className="text-sm text-white">{h.outcome}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
