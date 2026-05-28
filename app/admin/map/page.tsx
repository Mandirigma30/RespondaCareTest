"use client";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import dynamic from "next/dynamic";
import { TopBar } from "../../components/layout/TopBar";
import { HeartPulse, Car, ShieldCheck, AlertTriangle, Layers, Crosshair } from "lucide-react";

// Dynamically import map to avoid SSR issues
const MapView = dynamic(() => import("../../components/MapView"), { ssr: false, loading: () => (
  <div className="w-full h-full flex items-center justify-center bg-[#1a1d23] text-[#8b949e]">
    Loading map…
  </div>
)});

const incidents = [
  { id: "#INC-2049", label: "Cardiac Arrest",     type: "critical", lat: 14.603, lng: 120.985, icon: "❤️" },
  { id: "#INC-2048", label: "Vehicular Accident",  type: "high",     lat: 14.598, lng: 120.991, icon: "🚗" },
  { id: "#INC-2047", label: "Fever Symptoms",      type: "medium",   lat: 14.607, lng: 120.980, icon: "🌡️" },
  { id: "#INC-2045", label: "Noise Complaint",     type: "low",      lat: 14.595, lng: 120.978, icon: "🔊" },
];

const typeColors: Record<string, string> = {
  critical: "text-[#e53e3e]", high: "text-[#ed8936]", medium: "text-yellow-400", low: "text-gray-400",
};

export default function MapPage() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-animate]", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.07, ease: "power2.out" });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={ref} className="flex flex-col h-full">
      <TopBar title="Tactical Map View" />
      <div className="flex-1 flex gap-0 overflow-hidden">
        {/* Map */}
        <div data-animate className="flex-1 relative" style={{ minHeight: "calc(100vh - 65px)" }}>
          <MapView incidents={incidents} />

          {/* Map controls overlay */}
          <div className="absolute top-4 left-4 z-[1000] flex items-center gap-3 px-4 py-2 rounded-lg border border-gray-700"
            style={{ background: "rgba(26,26,31,0.9)", backdropFilter: "blur(4px)" }}>
            <span className="text-xs font-bold uppercase tracking-wider text-white">Live View</span>
            <div className="flex items-center gap-2 border-l border-gray-600 pl-3">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs text-gray-300">Barangay 45 — Tondo, Manila</span>
            </div>
          </div>
          <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
            <button className="w-10 h-10 bg-[#1a1d23] border border-gray-700 rounded-lg flex items-center justify-center hover:bg-[#25252b] text-white">
              <Layers className="w-4 h-4" />
            </button>
            <button className="w-10 h-10 bg-[#1a1d23] border border-gray-700 rounded-lg flex items-center justify-center hover:bg-[#25252b] text-white">
              <Crosshair className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Incidents Panel */}
        <div data-animate className="w-72 bg-[#1a1d23] border-l border-[#2d333b] flex flex-col overflow-y-auto">
          <div className="p-5 border-b border-[#2d333b]">
            <h3 className="font-bold text-white">Active Incidents</h3>
            <p className="text-xs text-[#8b949e] mt-1">{incidents.length} incidents on map</p>
          </div>
          <div className="p-4 space-y-3">
            {incidents.map((inc) => (
              <div key={inc.id} className="p-4 bg-[#0c0f16] rounded-xl border border-[#2d333b] hover:border-[#8b1a1a] transition-colors cursor-pointer">
                <div className="flex items-start gap-3">
                  <span className="text-xl">{inc.icon}</span>
                  <div>
                    <p className="font-semibold text-white text-sm">{inc.label}</p>
                    <p className={`text-xs font-bold uppercase mt-0.5 ${typeColors[inc.type]}`}>{inc.type}</p>
                    <p className="text-xs text-[#8b949e] mt-1 font-mono">{inc.id}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-auto p-5 border-t border-[#2d333b]">
            <p className="text-xs font-bold text-[#8b949e] uppercase tracking-widest mb-3">Legend</p>
            <div className="space-y-2 text-xs">
              {[
                { color: "bg-[#e53e3e]", label: "Critical", icon: <HeartPulse className="w-3 h-3" /> },
                { color: "bg-[#ed8936]", label: "High", icon: <Car className="w-3 h-3" /> },
                { color: "bg-[#4299e1]", label: "Responder", icon: <ShieldCheck className="w-3 h-3" /> },
                { color: "bg-yellow-500", label: "Medium", icon: <AlertTriangle className="w-3 h-3" /> },
              ].map(({ color, label, icon }) => (
                <div key={label} className="flex items-center gap-2 text-gray-300">
                  <span className={`w-6 h-6 rounded-full ${color} flex items-center justify-center flex-shrink-0`}>{icon}</span>
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
