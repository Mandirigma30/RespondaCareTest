"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import {
  AlertTriangle, Truck, UserCheck, Timer, HeartPulse, Car, ShieldCheck, Volume2, CheckCircle,
} from "lucide-react";
import { TopBar } from "../../components/layout/TopBar";
import { StatCard } from "../../components/ui/StatCard";
import { IncidentCard } from "../../components/ui/IncidentCard";

// Static defaults
const defaultIncidents = [
  { id: "#INC-2049", title: "Cardiac Arrest",       location: "Zone 3",              time: "2 mins ago",  priority: "critical" as const, icon: <HeartPulse className="w-6 h-6" /> },
  { id: "#INC-2048", title: "Vehicular Accident",   location: "Taft Ave",            time: "8 mins ago",  priority: "high"     as const, icon: <Car className="w-6 h-6" />,       responders: ["R1", "R2"] },
  { id: "#INC-2047", title: "Fever / Flu Symptoms", location: "Zone 1, St. Peter St", time: "15 mins ago", priority: "medium"   as const, icon: <AlertTriangle className="w-6 h-6" /> },
  { id: "#INC-2045", title: "Noise Complaint",      location: "Zone 5",              time: "32 mins ago", priority: "low"      as const, icon: <Volume2 className="w-6 h-6" /> },
  { id: undefined,   title: "Stray Animal",         location: "Zone 2",              time: "1 hr ago",    priority: "resolved" as const, icon: <CheckCircle className="w-6 h-6" />, opacity: true },
];

export default function DashboardPage() {
  const ref = useRef<HTMLDivElement>(null);
  
  const [activeIncidentsList, setActiveIncidentsList] = useState<any[]>(defaultIncidents);
  const [stats, setStats] = useState({
    active: 12,
    deployed: 8,
    registered: 2405,
    avgTime: 4.2
  });

  // Stagger entrance transitions
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-animate]", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.55, stagger: 0.07, ease: "power2.out" });
    }, ref);
    return () => ctx.revert();
  }, []);

  // Sync real-time updates from storage (SOS/BHW events)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const cachedInc = localStorage.getItem("respondaCare_incidents");
      const cachedRes = localStorage.getItem("respondaCare_residents");

      let sosTriggers: any[] = [];
      if (cachedInc) {
        try {
          sosTriggers = JSON.parse(cachedInc);
        } catch (e) {
          console.error(e);
        }
      }

      // Convert local panic signals into priority list blocks
      const dynamicTriggers = sosTriggers.map((item: any) => ({
        id: item.id || `#INC-${Math.floor(1000 + Math.random() * 9000)}`,
        title: `${item.category || "Panic SOS"} Alert`,
        location: item.barangay || "Zone 3, Pasay City",
        time: "Just now",
        priority: "critical" as const,
        icon: <AlertTriangle className="w-6 h-6 text-red-500 animate-pulse" />
      }));

      // Prepend dynamic alerts
      setActiveIncidentsList([...dynamicTriggers, ...defaultIncidents]);

      // Handle registered count
      let regCount = 2405;
      if (cachedRes) {
        try {
          const parsed = JSON.parse(cachedRes);
          regCount += parsed.length;
        } catch (e) {}
      }

      setStats({
        active: 12 + dynamicTriggers.length,
        deployed: 8,
        registered: regCount,
        avgTime: 4.2
      });
    }
  }, []);

  return (
    <div ref={ref} className="flex flex-col h-full bg-[#0c0f16] text-white">
      <TopBar title="Mission Control" searchPlaceholder="Search incidents, residents..." />

      <div className="px-8 pb-8 pt-6 space-y-6 flex-grow max-w-7xl mx-auto w-full">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4" data-animate>
          <StatCard label="Active Incidents"     value={stats.active}    iconBg="bg-red-900/30"    icon={<AlertTriangle className="w-6 h-6 text-[#e53e3e]" />} trend="↑ +2/hr" trendColor="red" />
          <StatCard label="Responders Deployed"  value={stats.deployed}     iconBg="bg-blue-900/30"   icon={<Truck className="w-6 h-6 text-[#4299e1]" />}     badge="Active" />
          <StatCard label="Residents Registered" value={stats.registered}  iconBg="bg-green-900/30"  icon={<UserCheck className="w-6 h-6 text-[#48bb78]" />}  trend="↑ +12" trendColor="green" />
          <StatCard label="Avg. Response Time"   value={stats.avgTime}   iconBg="bg-orange-900/30" icon={<Timer className="w-6 h-6 text-[#ed8936]" />}      trend="↓ -30s" trendColor="green" suffix="m" />
        </div>

        {/* Map + Priority Queue */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" data-animate>
          {/* Tactical map background */}
          <div className="lg:col-span-2 relative bg-[#1a1d23] rounded-2xl overflow-hidden border border-white/5 h-[560px]">
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

              {/* Tactical Roads overlay */}
              <svg className="absolute inset-0 w-full h-full opacity-20">
                <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#8b949e" strokeWidth="2" />
                <line x1="30%" y1="0" x2="30%" y2="100%" stroke="#8b949e" strokeWidth="1.5" />
                <line x1="65%" y1="0" x2="65%" y2="100%" stroke="#8b949e" strokeWidth="1.5" />
                <line x1="0" y1="30%" x2="100%" y2="30%" stroke="#8b949e" strokeWidth="1" />
                <line x1="0" y1="70%" x2="100%" y2="70%" stroke="#8b949e" strokeWidth="1" />
              </svg>
            </div>

            {/* Live Monitoring Badge */}
            <div className="absolute top-6 left-6 flex items-center gap-3 px-4 py-2 rounded-lg border border-gray-700"
              style={{ background: "rgba(26,26,31,0.85)", backdropFilter: "blur(4px)" }}>
              <span className="text-xs font-bold uppercase tracking-wider text-white">Live Dispatch</span>
              <div className="flex items-center gap-2 border-l border-gray-600 pl-3">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs text-gray-300">Active Center: Pasay City</span>
              </div>
            </div>

            {/* Tactical Incident Markers */}
            <div className="absolute top-[45%] left-[45%] -translate-x-1/2 -translate-y-1/2">
              <div className="relative">
                <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-30" />
                <div className="w-12 h-12 bg-[#8b1a1a] rounded-full flex items-center justify-center shadow-lg border-2 border-white/20">
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
          <div className="bg-[#1a1d23] rounded-2xl p-6 border border-white/5 flex flex-col h-[560px]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">Dispatch Priority Queue</h3>
              <span className="text-[10px] font-mono text-[#8b949e] uppercase tracking-widest bg-[#0d1117] px-2 py-0.5 rounded border border-[#30363d]">
                Live Stream
              </span>
            </div>
            <div className="space-y-4 flex-1 overflow-y-auto pr-1">
              {activeIncidentsList.map((inc, i) => (
                <IncidentCard key={i} {...inc} opacity={inc.opacity} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
