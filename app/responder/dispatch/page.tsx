"use client";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Radio, MapPin, Clock, HeartPulse, Car, CheckCircle, Navigation, Phone } from "lucide-react";
import { TopBar } from "../../components/layout/TopBar";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";

const dispatches = [
  { id: "#INC-2049", type: "Cardiac Arrest", address: "123 Rizal St., Zone 3", eta: "2 min", priority: "critical", icon: <HeartPulse className="w-6 h-6" />, status: "En Route" },
  { id: "#INC-2048", type: "Vehicular Accident", address: "Taft Ave corner España", eta: "8 min", priority: "high", icon: <Car className="w-6 h-6" />, status: "Dispatched" },
];

const borderMap: Record<string, string> = {
  critical: "border-l-[#e53e3e]", high: "border-l-[#ed8936]", medium: "border-l-yellow-500",
};

export default function DispatchPage() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-animate]", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.07, ease: "power2.out" });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={ref} className="flex flex-col h-full">
      <TopBar title="Active Dispatch" />
      <div className="px-8 py-6 flex-1 space-y-6">
        {/* Status Banner */}
        <div data-animate className="bg-[#48bb78]/10 border border-[#48bb78]/30 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-[#48bb78] animate-pulse" />
            <div>
              <p className="text-white font-bold">Responder Status: On Duty</p>
              <p className="text-[#8b949e] text-xs">Unit RC-R08 • Logged in since 07:00</p>
            </div>
          </div>
          <Button variant="ghost" size="sm">Go Off Duty</Button>
        </div>

        {/* Active Dispatches */}
        <div className="space-y-4">
          <h2 data-animate className="font-bold text-white text-xl">Active Assignments</h2>
          {dispatches.map((d, i) => (
            <div key={i} data-animate className={`bg-[#1a1d23] rounded-2xl border border-[#2d333b] border-l-4 ${borderMap[d.priority]} p-6`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className={`p-2.5 rounded-xl ${d.priority === "critical" ? "bg-red-900/20 text-[#e53e3e]" : "bg-orange-900/20 text-[#ed8936]"}`}>
                    {d.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">{d.type}</h3>
                    <div className="flex items-center gap-2 mt-1 text-[#8b949e] text-sm">
                      <MapPin className="w-4 h-4" /> {d.address}
                    </div>
                    <p className="text-xs font-mono text-gray-600 mt-1">{d.id}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={d.priority as "critical" | "high"}>{d.priority}</Badge>
                  <div className="flex items-center gap-1 mt-2 text-white font-bold">
                    <Clock className="w-4 h-4 text-[#ed8936]" /> ETA {d.eta}
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <Button size="sm" className="flex-1">
                  <Navigation className="w-4 h-4" /> Navigate
                </Button>
                <Button variant="secondary" size="sm" className="flex-1">
                  <Phone className="w-4 h-4" /> Contact Dispatch
                </Button>
                <Button variant="ghost" size="sm" className="flex-1">
                  <CheckCircle className="w-4 h-4" /> Mark Arrived
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Incidents Today",    value: "5",   icon: <Radio className="w-5 h-5 text-[#e53e3e]" />,    color: "bg-red-900/20" },
            { label: "Resolved",           value: "3",   icon: <CheckCircle className="w-5 h-5 text-[#48bb78]" />, color: "bg-green-900/20" },
            { label: "Avg. Response Time", value: "4m",  icon: <Clock className="w-5 h-5 text-[#4299e1]" />,    color: "bg-blue-900/20" },
          ].map((s, i) => (
            <div key={i} data-animate className="bg-[#1a1d23] p-5 rounded-xl border border-[#2d333b] flex items-center gap-4">
              <div className={`p-2.5 rounded-lg ${s.color} flex-shrink-0`}>{s.icon}</div>
              <div>
                <p className="text-4xl font-bold text-white">{s.value}</p>
                <p className="text-[#8b949e] text-xs mt-1">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
