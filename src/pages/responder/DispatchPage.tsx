import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { Radio, MapPin, Clock, CheckCircle, Navigation, Phone } from "lucide-react";
import { TopBar } from "../../components/layout/TopBar";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { useNavigate } from "react-router-dom";
import { supabase, isPlaceholderUrl } from "../../lib/supabase";

interface DispatchItem {
  id: string;
  type: string;
  address: string;
  eta: string;
  priority: "critical" | "high" | "medium" | "low";
  icon: string;
  status: string;
}

const defaultDispatches: DispatchItem[] = [
  { id: "#INC-2049", type: "Cardiac Arrest", address: "123 Rizal St., Zone 3, Pasay City", eta: "2 min", priority: "critical", icon: "❤️", status: "En Route" },
  { id: "#INC-2048", type: "Vehicular Accident", address: "Taft Ave corner España, Pasay City", eta: "8 min", priority: "high", icon: "🚗", status: "Dispatched" },
];

const borderMap: Record<string, string> = {
  critical: "border-l-[#e53e3e]",
  high:     "border-l-[#ed8936]",
  medium:   "border-l-yellow-500",
  low:      "border-l-gray-500",
};

export default function DispatchPage() {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const [dispatches, setDispatches] = useState<DispatchItem[]>(defaultDispatches);
  const [searchQuery, setSearchQuery] = useState("");
  const [responderName, setResponderName] = useState("First Responder");

  const handleGoOffDuty = () => {
    localStorage.removeItem("respondaCare_session");
    navigate("/");
  };

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-animate]", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.07, ease: "power2.out" });
    }, ref);
    return () => ctx.revert();
  }, []);

  // Fetch session and live dispatches
  useEffect(() => {
    const session = localStorage.getItem("respondaCare_session");
    if (session) {
      try {
        const parsed = JSON.parse(session);
        if (parsed.name) setResponderName(parsed.name);
      } catch (e) {}
    }

    const fetchDispatches = async () => {
      if (!isPlaceholderUrl) {
        try {
          const { data, error } = await supabase
            .schema("emergency")
            .from("incidents")
            .select("*")
            .in("status", ["Active", "Dispatched", "On-Scene"])
            .order("created_at", { ascending: false });

          if (error) throw error;
          if (data && data.length > 0) {
            const mapped: DispatchItem[] = data.map((inc: any) => ({
              id: inc.incident_id,
              type: inc.nature_of_call || "Emergency Alert",
              // [C1] Fix: use real GPS coordinates in address when no address field is stored
              address: inc.address ||
                (inc.latitude && inc.longitude
                  ? `GPS: ${Number(inc.latitude).toFixed(5)}, ${Number(inc.longitude).toFixed(5)}`
                  : "Zone 3, Barangay 45"),
              eta: inc.severity_score >= 4 ? "3 min" : "10 min",
              priority: inc.severity_score >= 5 ? "critical" : inc.severity_score >= 4 ? "high" : inc.severity_score >= 3 ? "medium" : "low",
              icon: inc.nature_of_call?.toLowerCase().includes("cardiac") ? "❤️" : inc.nature_of_call?.toLowerCase().includes("accident") ? "🚗" : "⚠️",
              status: inc.status
            }));
            setDispatches(mapped);
            return;
          }
        } catch (err) {
          console.warn("Failed to fetch live dispatches, using fallback cache", err);
        }
      }

      // Check local cache
      const cached = localStorage.getItem("respondaCare_incidents");
      if (cached) {
        try {
          const list = JSON.parse(cached);
          const mapped: DispatchItem[] = list
            .filter((inc: any) => inc.status !== "Resolved")
            .map((inc: any) => ({
              id: inc.id || "#INC-9999",
              type: inc.category || "Emergency SOS",
              // [C1] Fix: prefer address field, fallback to GPS coordinates from lat/lng
              address: inc.address || inc.barangay ||
                (inc.lat && inc.lng
                  ? `GPS: ${Number(inc.lat).toFixed(5)}, ${Number(inc.lng).toFixed(5)}`
                  : "Zone 3, Pasay City"),
              eta: "5 min",
              priority: "critical",
              icon: "🚨",
              status: inc.status || "Active"
            }));
          setDispatches([...mapped, ...defaultDispatches]);
        } catch (e) {}
      }
    };

    fetchDispatches();

    // Poll localStorage every 5s in sandbox mode to pick up new SOS events
    let pollInterval: ReturnType<typeof setInterval> | null = null;
    if (isPlaceholderUrl) {
      pollInterval = setInterval(fetchDispatches, 5000);
    }

    // Set up real-time subscription for dispatch updates
    if (!isPlaceholderUrl) {
      const channel = supabase
        .channel("live-dispatches")
        .on("postgres_changes", { event: "*", schema: "emergency", table: "incidents" }, () => {
          fetchDispatches();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
        if (pollInterval) clearInterval(pollInterval);
      };
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, []);

  const handleNavigate = (address: string) => {
    // Launch external native map app
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`);
  };

  const handleContactDispatch = () => {
    // Fire telephone intent
    window.open("tel:911");
  };

  const handleMarkArrived = async (id: string) => {
    try {
      // Update local state
      setDispatches(dispatches.map(d => d.id === id ? { ...d, status: "On-Scene" } : d));

      // Update local storage cache
      const cached = localStorage.getItem("respondaCare_incidents");
      if (cached) {
        try {
          const list = JSON.parse(cached);
          const updated = list.map((inc: any) => inc.id === id ? { ...inc, status: "On-Scene" } : inc);
          localStorage.setItem("respondaCare_incidents", JSON.stringify(updated));
        } catch (e) {}
      }

      // Log to local audit trail
      const localLogs = JSON.parse(localStorage.getItem("respondaCare_auditLogs") || "[]");
      localLogs.unshift({
        ts: new Date().toISOString().slice(0, 10),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        user: responderName,
        role: "responder",
        action: `First Responder marked incident ${id} as arrived (On-Scene)`,
        resource: "emergency.incidents",
        ip: "127.0.0.1",
        dotColor: "bg-orange-400"
      });
      localStorage.setItem("respondaCare_auditLogs", JSON.stringify(localLogs));

      // Sync with Supabase if live
      if (!isPlaceholderUrl) {
        const { error } = await supabase
          .schema("emergency")
          .from("incidents")
          .update({ status: "On-Scene", arrival_time: new Date().toISOString() })
          .eq("incident_id", id);
        
        if (error) console.error("Database sync failed", error);

        // Append to audit log
        await supabase
          .schema("security")
          .from("audit_log")
          .insert({
            action: "MARK_ARRIVED",
            target_table: "emergency.incidents",
            target_id: id,
            details: { info: `First Responder marked incident ${id} as arrived (On-Scene)` }
          });
      }
      alert(`Status updated: Unit is now On-Scene at Incident ${id}.`);
    } catch (e) {
      console.error(e);
    }
  };

  // Filter queue by search text
  const filteredDispatches = dispatches.filter(d => 
    d.type.toLowerCase().includes(searchQuery.toLowerCase()) || 
    d.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div ref={ref} className="flex flex-col h-full bg-[#0c0f16]">
      <TopBar 
        title="Active Dispatch" 
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Filter assignments by type or location..."
      />
      <div className="px-8 py-6 flex-1 space-y-6 max-w-7xl mx-auto w-full text-white">
        {/* Status Banner */}
        <div data-animate className="bg-[#48bb78]/10 border border-[#48bb78]/30 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-[#48bb78] animate-pulse" />
            <div>
              <p className="text-white font-bold">Responder Status: On Duty</p>
              <p className="text-[#8b949e] text-xs">Unit: {responderName} • Logged in active shift</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleGoOffDuty}>Go Off Duty</Button>
        </div>

        {/* Active Assignments */}
        <div className="space-y-4">
          <h2 data-animate className="font-bold text-white text-xl">Active Assignments</h2>
          {filteredDispatches.map((d) => (
            <div key={d.id} data-animate className={`bg-[#1a1d23] rounded-2xl border border-[#2d333b] border-l-4 ${borderMap[d.priority]} p-6`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg ${d.priority === "critical" ? "bg-red-900/20 text-[#e53e3e]" : "bg-orange-900/20 text-[#ed8936]"}`}>
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
                  <div className="flex gap-2 justify-end">
                    <Badge variant={d.priority === "critical" ? "critical" : "high"}>{d.priority}</Badge>
                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-[#0d1117] text-[#8b949e] border border-gray-800">{d.status}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-white font-bold justify-end">
                    <Clock className="w-4 h-4 text-[#ed8936]" /> ETA {d.eta}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 flex-wrap">
                <Button size="sm" className="flex-1 min-w-[120px]" onClick={() => handleNavigate(d.address)}>
                  <Navigation className="w-4 h-4" /> Navigate
                </Button>
                <Button variant="secondary" size="sm" className="flex-1 min-w-[120px]" onClick={handleContactDispatch}>
                  <Phone className="w-4 h-4" /> Contact Dispatch
                </Button>
                <Button 
                  variant={d.status === "On-Scene" ? "secondary" : "ghost"} 
                  size="sm" 
                  className="flex-1 min-w-[120px]" 
                  onClick={() => handleMarkArrived(d.id)}
                  disabled={d.status === "On-Scene"}
                >
                  <CheckCircle className="w-4 h-4" /> 
                  <span>{d.status === "On-Scene" ? "Arrived On Scene" : "Mark Arrived"}</span>
                </Button>
              </div>
            </div>
          ))}

          {filteredDispatches.length === 0 && (
            <div data-animate className="text-center py-12 bg-[#1a1d23] rounded-2xl border border-gray-800">
              <Radio className="w-12 h-12 text-gray-600 mx-auto mb-4 animate-pulse" />
              <p className="text-gray-400 font-bold">No dispatch assignments found</p>
              <p className="text-gray-500 text-xs mt-1">Check back later or search with a different keyword.</p>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
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

