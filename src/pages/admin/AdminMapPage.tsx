import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import MapView from "../../components/MapView";
import { TopBar } from "../../components/layout/TopBar";
import { HeartPulse, Car, ShieldCheck, AlertTriangle, Layers, Crosshair } from "lucide-react";
import { supabase, isPlaceholderUrl } from "../../lib/supabase";

interface MapIncident {
  id: string;
  label: string;
  type: string; // critical, high, medium, low
  lat: number;
  lng: number;
  icon: string;
}

const defaultMapIncidents: MapIncident[] = [
  { id: "#INC-2049", label: "Cardiac Arrest",     type: "critical", lat: 14.555, lng: 121.025, icon: "❤️" },
  { id: "#INC-2048", label: "Vehicular Accident",  type: "high",     lat: 14.551, lng: 121.028, icon: "🚗" },
  { id: "#INC-2047", label: "Fever Symptoms",      type: "medium",   lat: 14.558, lng: 121.020, icon: "🌡️" },
  { id: "#INC-2045", label: "Noise Complaint",     type: "low",      lat: 14.550, lng: 121.022, icon: "🔊" },
];

const typeColors: Record<string, string> = {
  critical: "text-[#e53e3e]", high: "text-[#ed8936]", medium: "text-yellow-400", low: "text-gray-400",
};

export default function AdminMapPage() {
  const ref = useRef<HTMLDivElement>(null);
  const [incidents, setIncidents] = useState<MapIncident[]>(defaultMapIncidents);
  const [mapCenter, setMapCenter] = useState<[number, number]>([14.5547, 121.0244]);
  const [mapZoom, setMapZoom] = useState<number>(15);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-animate]", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.07, ease: "power2.out" });
    }, ref);
    return () => ctx.revert();
  }, []);

  const loadIncidents = async () => {
    if (isPlaceholderUrl) {
      // Load from local storage cache
      const cachedInc = localStorage.getItem("respondaCare_incidents");
      let sosTriggers: any[] = [];
      if (cachedInc) {
        try {
          sosTriggers = JSON.parse(cachedInc);
        } catch (e) {
          console.error(e);
        }
      }

      const dynamicIncidents: MapIncident[] = sosTriggers.map((item: any) => ({
        id: item.id || `#INC-${Math.floor(1000 + Math.random() * 9000)}`,
        label: `${item.category || "Panic SOS"} Alert`,
        type: "critical",
        lat: item.latitude || item.lat || 14.5547 + (Math.random() - 0.5) * 0.005,
        lng: item.longitude || item.lng || 121.0244 + (Math.random() - 0.5) * 0.005,
        icon: "⚠️"
      }));

      setIncidents([...dynamicIncidents, ...defaultMapIncidents]);
    } else {
      // Live database query
      try {
        const { data, error } = await supabase
          .schema("emergency")
          .from("incidents")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (data) {
          const mapped: MapIncident[] = data.map((inc: any) => {
            let priorityVal = "medium";
            if (inc.status === "Resolved") priorityVal = "low";
            else if (inc.severity_score >= 5) priorityVal = "critical";
            else if (inc.severity_score >= 4) priorityVal = "high";
            else if (inc.severity_score >= 2) priorityVal = "medium";
            else priorityVal = "low";

            let iconChar = "⚠️";
            if (inc.nature_of_call?.toLowerCase().includes("cardiac")) iconChar = "❤️";
            else if (inc.nature_of_call?.toLowerCase().includes("accident") || inc.nature_of_call?.toLowerCase().includes("vehicular")) iconChar = "🚗";
            else if (inc.nature_of_call?.toLowerCase().includes("fever") || inc.nature_of_call?.toLowerCase().includes("flu")) iconChar = "🌡️";
            else if (inc.nature_of_call?.toLowerCase().includes("noise")) iconChar = "🔊";

            return {
              id: inc.incident_id,
              label: inc.nature_of_call || "Emergency SOS",
              type: priorityVal,
              lat: inc.latitude || 14.5547,
              lng: inc.longitude || 121.0244,
              icon: iconChar
            };
          });
          setIncidents(mapped);
        }
      } catch (err) {
        console.error("Error loading incidents in admin map page:", err);
      }
    }
  };

  useEffect(() => {
    loadIncidents();

    let subscription: any = null;
    if (!isPlaceholderUrl) {
      subscription = supabase
        .channel("emergency-incidents-map")
        .on(
          "postgres_changes",
          { event: "*", schema: "emergency", table: "incidents" },
          () => {
            loadIncidents();
          }
        )
        .subscribe();
    }

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, []);

  return (
    <div ref={ref} className="flex flex-col h-full bg-[#0c0f16]">
      <TopBar title="Tactical Map View" />
      <div className="flex-1 flex gap-0 overflow-hidden">
        {/* Map */}
        <div className="flex-1 relative" style={{ minHeight: "calc(100vh - 75px)" }}>
          <MapView incidents={incidents} center={mapCenter} zoom={mapZoom} />

          {/* Map controls overlay */}
          <div className="absolute top-4 left-4 z-[1000] flex items-center gap-3 px-4 py-2 rounded-lg border border-gray-700"
            style={{ background: "rgba(26,26,31,0.9)", backdropFilter: "blur(4px)" }}>
            <span className="text-xs font-bold uppercase tracking-wider text-white">Live View</span>
            <div className="flex items-center gap-2 border-l border-gray-600 pl-3">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs text-gray-300">Barangay 45 — Pasay City</span>
            </div>
          </div>
          <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
            <button className="w-10 h-10 bg-[#1a1d23] border border-gray-700 rounded-lg flex items-center justify-center hover:bg-[#25252b] text-white cursor-pointer">
              <Layers className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setMapCenter([14.5547, 121.0244]);
                setMapZoom(15);
              }}
              className="w-10 h-10 bg-[#1a1d23] border border-gray-700 rounded-lg flex items-center justify-center hover:bg-[#25252b] text-white cursor-pointer"
            >
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
              <div
                key={inc.id}
                onClick={() => {
                  setMapCenter([inc.lat, inc.lng]);
                  setMapZoom(17);
                }}
                className="p-4 bg-[#0c0f16] rounded-xl border border-[#2d333b] hover:border-[#8b1a1a] transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl">{inc.icon}</span>
                  <div>
                    <p className="font-semibold text-white text-sm">{inc.label}</p>
                    <p className={`text-xs font-bold uppercase mt-0.5 ${typeColors[inc.type] || "text-gray-400"}`}>{inc.type}</p>
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
                { color: "bg-[#e53e3e]", label: "Critical", icon: <HeartPulse className="w-3 h-3 text-white" /> },
                { color: "bg-[#ed8936]", label: "High", icon: <Car className="w-3 h-3 text-white" /> },
                { color: "bg-[#4299e1]", label: "Responder", icon: <ShieldCheck className="w-3 h-3 text-white" /> },
                { color: "bg-yellow-500", label: "Medium", icon: <AlertTriangle className="w-3 h-3 text-white" /> },
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
