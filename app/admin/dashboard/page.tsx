"use client";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import {
  AlertTriangle, TrendingUp, TrendingDown, Truck,
  UserCheck, Timer, HeartPulse, Car, ShieldCheck, Volume2, CheckCircle,
} from "lucide-react";
import { TopBar } from "../../components/layout/TopBar";
import { StatCard } from "../../components/ui/StatCard";
import { IncidentCard } from "../../components/ui/IncidentCard";

const incidents = [
  { id: "#INC-2049", title: "Cardiac Arrest",       location: "Zone 3",              time: "2 mins ago",  priority: "critical" as const, icon: <HeartPulse className="w-6 h-6" /> },
  { id: "#INC-2048", title: "Vehicular Accident",   location: "Taft Ave",            time: "8 mins ago",  priority: "high"     as const, icon: <Car className="w-6 h-6" />,       responders: ["R1", "R2"] },
  { id: "#INC-2047", title: "Fever / Flu Symptoms", location: "Zone 1, St. Peter St", time: "15 mins ago", priority: "medium"   as const, icon: <AlertTriangle className="w-6 h-6" /> },
  { id: "#INC-2045", title: "Noise Complaint",      location: "Zone 5",              time: "32 mins ago", priority: "low"      as const, icon: <Volume2 className="w-6 h-6" /> },
  { id: undefined,   title: "Stray Animal",         location: "Zone 2",              time: "1 hr ago",    priority: "resolved" as const, icon: <CheckCircle className="w-6 h-6" />, opacity: true },
];

export default function DashboardPage() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-animate]", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.55, stagger: 0.07, ease: "power2.out" });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={ref} className="flex flex-col h-full">
      <TopBar title="Mission Control" searchPlaceholder="Search incidents, residents..." />

      <div className="px-8 pb-8 pt-6 space-y-6 flex-1">
        {/* Stat Cards */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Active Incidents"     value={12}    iconBg="bg-red-900/30"    icon={<AlertTriangle className="w-6 h-6 text-[#e53e3e]" />} trend="↑ +2/hr" trendColor="red" />
          <StatCard label="Responders Deployed"  value={8}     iconBg="bg-blue-900/30"   icon={<Truck className="w-6 h-6 text-[#4299e1]" />}     badge="Active" />
          <StatCard label="Residents Registered" value={2405}  iconBg="bg-green-900/30"  icon={<UserCheck className="w-6 h-6 text-[#48bb78]" />}  trend="↑ +12" trendColor="green" />
          <StatCard label="Avg. Response Time"   value={4.2}   iconBg="bg-orange-900/30" icon={<Timer className="w-6 h-6 text-[#ed8936]" />}      trend="↓ -30s" trendColor="green" suffix="m" />
        </div>

        {/* Map + Priority Queue */}
        <div className="grid grid-cols-3 gap-6">
          {/* Map */}
          <div data-animate className="col-span-2 relative bg-[#1a1d23] rounded-2xl overflow-hidden border border-white/5 h-[560px]">
            {/* Fake tactical map background */}
            <div className="absolute inset-0"
              style={{
                background: "radial-gradient(ellipse at 50% 50%, #1e2a3a 0%, #0c1520 60%, #080d14 100%)",
              }}
            >
              {/* Grid lines */}
              <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#4299e1" strokeWidth="0.5"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>

              {/* Road lines */}
              <svg className="absolute inset-0 w-full h-full opacity-20">
                <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#8b949e" strokeWidth="2" />
                <line x1="30%" y1="0" x2="30%" y2="100%" stroke="#8b949e" strokeWidth="1.5" />
                <line x1="65%" y1="0" x2="65%" y2="100%" stroke="#8b949e" strokeWidth="1.5" />
                <line x1="0" y1="30%" x2="100%" y2="30%" stroke="#8b949e" strokeWidth="1" />
                <line x1="0" y1="70%" x2="100%" y2="70%" stroke="#8b949e" strokeWidth="1" />
              </svg>
            </div>

            {/* Live View Badge */}
            <div className="absolute top-6 left-6 flex items-center gap-3 px-4 py-2 rounded-lg border border-gray-700"
              style={{ background: "rgba(26,26,31,0.85)", backdropFilter: "blur(4px)" }}>
              <span className="text-xs font-bold uppercase tracking-wider">Live View</span>
              <div className="flex items-center gap-2 border-l border-gray-600 pl-3">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs text-gray-300">Monitoring Barangay 45</span>
              </div>
            </div>

            {/* Zoom Controls */}
            <div className="absolute top-6 right-6 flex flex-col gap-2">
              {["+", "−"].map((s) => (
                <button key={s} className="w-10 h-10 bg-[#1a1d23] border border-gray-700 rounded-lg flex items-center justify-center hover:bg-[#25252b] text-white font-bold text-lg">
                  {s}
                </button>
              ))}
            </div>

            {/* Incident Markers */}
            <div className="absolute top-[45%] left-[45%] -translate-x-1/2 -translate-y-1/2">
              <div className="relative">
                <div className="absolute inset-0 bg-red-500 rounded-full map-ping opacity-30" />
                <div className="w-12 h-12 bg-[#e53e3e] rounded-full flex items-center justify-center shadow-lg border-2 border-white/20">
                  <HeartPulse className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            <div className="absolute bottom-[28%] right-[40%]">
              <div className="w-10 h-10 bg-[#ed8936] rounded-full flex items-center justify-center shadow-lg border-2 border-white/20">
                <Car className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="absolute top-[55%] left-[50%]">
              <div className="w-8 h-8 bg-[#4299e1] rounded-lg flex items-center justify-center shadow-lg border border-white/20">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>

          {/* Priority Queue */}
          <div data-animate className="bg-[#1a1d23] rounded-2xl p-6 border border-white/5 flex flex-col h-[560px]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">Priority Queue</h3>
              <button className="text-xs text-[#4299e1] hover:underline">View All</button>
            </div>
            <div className="space-y-4 flex-1 overflow-y-auto pr-1">
              {incidents.map((inc, i) => (
                <IncidentCard key={i} {...inc} opacity={inc.opacity} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
