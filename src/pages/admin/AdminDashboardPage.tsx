import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import {
  AlertTriangle, Truck, UserCheck, Timer, HeartPulse, Car, Volume2, CheckCircle,
} from "lucide-react";
import { TopBar } from "../../components/layout/TopBar";
import { StatCard } from "../../components/ui/StatCard";
import { IncidentCard } from "../../components/ui/IncidentCard";
import MapView from "../../components/MapView";
import { supabase, isPlaceholderUrl } from "../../lib/supabase";

// Static defaults with fallback coordinates
const defaultIncidents = [
  { id: "#INC-2049", title: "Cardiac Arrest",       location: "Zone 3",              time: "2 mins ago",  priority: "critical" as const, icon: <HeartPulse className="w-6 h-6" />, latitude: 14.555, longitude: 121.025 },
  { id: "#INC-2048", title: "Vehicular Accident",   location: "Taft Ave",            time: "8 mins ago",  priority: "high"     as const, icon: <Car className="w-6 h-6" />,       responders: ["R1", "R2"], latitude: 14.551, longitude: 121.028 },
  { id: "#INC-2047", title: "Fever / Flu Symptoms", location: "Zone 1, St. Peter St", time: "15 mins ago", priority: "medium"   as const, icon: <AlertTriangle className="w-6 h-6" />, latitude: 14.558, longitude: 121.020 },
  { id: "#INC-2045", title: "Noise Complaint",      location: "Zone 5",              time: "32 mins ago", priority: "low"      as const, icon: <Volume2 className="w-6 h-6" />, latitude: 14.550, longitude: 121.022 },
  { id: undefined,   title: "Stray Animal",         location: "Zone 2",              time: "1 hr ago",    priority: "resolved" as const, icon: <CheckCircle className="w-6 h-6" />, opacity: true, latitude: 14.553, longitude: 121.024 },
];

export default function AdminDashboardPage() {
  const ref = useRef<HTMLDivElement>(null);
  
  const [activeIncidentsList, setActiveIncidentsList] = useState<any[]>(defaultIncidents);
  const [stats, setStats] = useState({
    active: 12,
    deployed: 8,
    registered: 2405,
    avgTime: 4.2
  });

  const [mapCenter, setMapCenter] = useState<[number, number]>([14.5547, 121.0244]);
  const [mapZoom, setMapZoom] = useState<number>(15);

  // Stagger entrance transitions
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-animate]", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.55, stagger: 0.07, ease: "power2.out" });
    }, ref);
    return () => ctx.revert();
  }, []);

  const loadRealtimeIncidents = async () => {
    if (isPlaceholderUrl) {
      // Offline / Sandbox fallback loading logic:
      const cachedInc = localStorage.getItem("respondaCare_incidents");
      let sosTriggers: any[] = [];
      if (cachedInc) {
        try {
          sosTriggers = JSON.parse(cachedInc);
        } catch (e) {
          console.error(e);
        }
      }

      const dynamicTriggers = sosTriggers.map((item: any) => ({
        id: item.id || `#INC-${Math.floor(1000 + Math.random() * 9000)}`,
        title: `${item.category || "Panic SOS"} Alert`,
        location: item.barangay || "Zone 3, Pasay City",
        time: "Just now",
        priority: "critical" as const,
        icon: <AlertTriangle className="w-6 h-6 text-red-500 animate-pulse" />,
        latitude: item.latitude || 14.5547 + (Math.random() - 0.5) * 0.005,
        longitude: item.longitude || 121.0244 + (Math.random() - 0.5) * 0.005
      }));

      setActiveIncidentsList([...dynamicTriggers, ...defaultIncidents]);
      
      const cachedRes = localStorage.getItem("respondaCare_residents");
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
    } else {
      // Live database query
      try {
        const { data, error } = await supabase
          .from("emergency.incidents")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (data) {
          const mapped = data.map((inc: any) => {
            let priorityVal: "critical" | "high" | "medium" | "low" | "resolved" = "medium";
            if (inc.status === "Resolved") priorityVal = "resolved";
            else if (inc.severity_score >= 5) priorityVal = "critical";
            else if (inc.severity_score >= 4) priorityVal = "high";
            else if (inc.severity_score >= 2) priorityVal = "medium";
            else priorityVal = "low";

            let iconNode = <AlertTriangle className="w-6 h-6 text-[#ecc94b]" />;
            if (priorityVal === "critical") iconNode = <HeartPulse className="w-6 h-6 text-[#e53e3e]" />;
            else if (priorityVal === "high") iconNode = <Car className="w-6 h-6 text-[#ed8936]" />;
            else if (priorityVal === "resolved") iconNode = <CheckCircle className="w-6 h-6 text-[#48bb78]" />;

            return {
              id: inc.incident_id,
              title: inc.nature_of_call || "Emergency SOS",
              location: inc.address || `Zone ${inc.barangay_id || 3}`,
              time: new Date(inc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              priority: priorityVal,
              icon: iconNode,
              latitude: inc.latitude || 14.5547,
              longitude: inc.longitude || 121.0244,
              opacity: inc.status === "Resolved"
            };
          });
          setActiveIncidentsList(mapped);

          // Update active stats from query count
          const activeCount = data.filter((inc: any) => inc.status !== "Resolved").length;
          
          // Count total registered residents from Supabase
          const { count: resCount } = await supabase
            .from("core.residents")
            .select("*", { count: "exact", head: true });
          
          setStats({
            active: activeCount,
            deployed: 8,
            registered: resCount || 2405,
            avgTime: 4.2
          });
        }
      } catch (err) {
        console.error("Error loading live incidents in admin dashboard:", err);
      }
    }
  };

  // Sync real-time updates from storage or Supabase Realtime
  useEffect(() => {
    loadRealtimeIncidents();

    let subscription: any = null;
    if (!isPlaceholderUrl) {
      subscription = supabase
        .channel("emergency-incidents-admin")
        .on(
          "postgres_changes",
          { event: "*", schema: "emergency", table: "incidents" },
          () => {
            loadRealtimeIncidents();
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

  // Convert activeIncidentsList to MapView incident format:
  const mapIncidents = activeIncidentsList
    .filter(inc => inc.latitude && inc.longitude)
    .map(inc => {
      let iconChar = "⚠️";
      if (inc.title.toLowerCase().includes("cardiac")) iconChar = "❤️";
      else if (inc.title.toLowerCase().includes("accident") || inc.title.toLowerCase().includes("vehicular")) iconChar = "🚗";
      else if (inc.title.toLowerCase().includes("fever") || inc.title.toLowerCase().includes("flu")) iconChar = "🌡️";
      else if (inc.title.toLowerCase().includes("noise")) iconChar = "🔊";
      return {
        id: inc.id || String(Math.random()),
        label: inc.title,
        type: inc.priority === "resolved" ? "low" : inc.priority,
        lat: inc.latitude,
        lng: inc.longitude,
        icon: iconChar
      };
    });

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
            <MapView incidents={mapIncidents} center={mapCenter} zoom={mapZoom} />

            {/* Live Monitoring Badge */}
            <div className="absolute top-6 left-6 z-[1000] flex items-center gap-3 px-4 py-2 rounded-lg border border-gray-700"
              style={{ background: "rgba(26,26,31,0.85)", backdropFilter: "blur(4px)" }}>
              <span className="text-xs font-bold uppercase tracking-wider text-white">Live Dispatch</span>
              <div className="flex items-center gap-2 border-l border-gray-600 pl-3">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs text-gray-300">Active Center: Pasay City</span>
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
                <div key={i} onClick={() => {
                  if (inc.latitude && inc.longitude) {
                    setMapCenter([inc.latitude, inc.longitude]);
                    setMapZoom(17);
                  }
                }} className="cursor-pointer transition-all hover:scale-[1.01]">
                  <IncidentCard {...inc} opacity={inc.opacity} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
