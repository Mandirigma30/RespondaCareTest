import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { HeartPulse, Car, CheckCircle, AlertTriangle, Clock, Loader2, Radio } from "lucide-react";
import { TopBar } from "../../components/layout/TopBar";
import { PageHeader } from "../../components/ui/PageHeader";
import { Badge } from "../../components/ui/Badge";
import { supabase, isPlaceholderUrl } from "../../lib/supabase";

interface HistoryItem {
  id: string;
  type: string;
  address: string;
  time: string;
  duration: string;
  outcome: string;
  icon: React.ReactNode;
}

const iconForType = (type: string) => {
  const t = type.toLowerCase();
  if (t.includes("cardiac") || t.includes("heart")) return <HeartPulse className="w-5 h-5" />;
  if (t.includes("vehicle") || t.includes("accident")) return <Car className="w-5 h-5" />;
  if (t.includes("fever") || t.includes("flu") || t.includes("medical")) return <AlertTriangle className="w-5 h-5" />;
  return <CheckCircle className="w-5 h-5" />;
};

export default function HistoryPage() {
  const ref = useRef<HTMLDivElement>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-animate]", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.07, ease: "power2.out" });
    }, ref);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      const items: HistoryItem[] = [];

      if (!isPlaceholderUrl) {
        // Live: query Supabase for resolved incidents
        try {
          const { data } = await supabase
            .schema("emergency")
            .from("incidents")
            .select("*")
            .in("status", ["Resolved", "On-Scene"])
            .order("created_at", { ascending: false })
            .limit(50);

          if (data && data.length > 0) {
            data.forEach((inc: any) => {
              items.push({
                id: `#${inc.incident_id?.slice(0, 8).toUpperCase() || "INC"}`,
                type: inc.nature_of_call || "Emergency",
                address: inc.address || `Zone ${inc.barangay_id || 3}, Pasay City`,
                time: new Date(inc.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                duration: inc.arrival_time
                  ? `${Math.round((new Date(inc.updated_at).getTime() - new Date(inc.created_at).getTime()) / 60000)} min`
                  : "—",
                outcome: inc.status === "Resolved" ? "Resolved & Cleared" : "On-Scene",
                icon: iconForType(inc.nature_of_call || ""),
              });
            });
          }

          // Also pull from handovers for richer outcome text
          const { data: handovers } = await supabase
            .schema("emergency")
            .from("handovers")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(20);

          if (handovers) {
            handovers.forEach((h: any) => {
              items.push({
                id: `#${h.incident_id?.slice(0, 8).toUpperCase() || "UIR"}`,
                type: `Patient Handover — ${h.patient_name || "Unknown"}`,
                address: `${h.receiving_hospital || "Hospital"}`,
                time: new Date(h.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                duration: "—",
                outcome: h.turnover_notes || h.response_outcome || "Transported",
                icon: <CheckCircle className="w-5 h-5" />,
              });
            });
          }
        } catch (err) {
          console.warn("Failed to load live history, falling back to localStorage", err);
        }
      }

      // Sandbox / fallback: read from localStorage
      if (items.length === 0) {
        const cachedInc = localStorage.getItem("respondaCare_incidents");
        if (cachedInc) {
          try {
            const list = JSON.parse(cachedInc);
            list
              .filter((inc: any) => inc.status === "Resolved" || inc.status === "On-Scene")
              .forEach((inc: any) => {
                items.push({
                  id: inc.id || "#INC-????",
                  type: inc.category || "Emergency SOS",
                  address: inc.barangay || "Zone 3, Pasay City",
                  time: inc.timestamp
                    ? new Date(inc.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    : "—",
                  duration: "—",
                  outcome: inc.status === "Resolved" ? "Resolved & Cleared" : "On-Scene",
                  icon: iconForType(inc.category || ""),
                });
              });
          } catch (e) {}
        }

        const cachedHO = localStorage.getItem("respondaCare_handovers");
        if (cachedHO) {
          try {
            const list = JSON.parse(cachedHO);
            list.forEach((h: any) => {
              items.push({
                id: h.id ? `#${h.id}` : "#UIR",
                type: `Patient Handover — ${h.patient_name || "Unknown"}`,
                address: h.receiving_hospital || "Hospital",
                time: h.time || h.date || "—",
                duration: "—",
                outcome: h.turnover_notes || h.response_outcome || "Transported",
                icon: <CheckCircle className="w-5 h-5" />,
              });
            });
          } catch (e) {}
        }
      }

      setHistory(items);
      setLoading(false);
    };

    loadHistory();
  }, []);

  return (
    <div ref={ref} className="flex flex-col h-full bg-[#0c0f16] text-white">
      <TopBar title="Incident History" searchPlaceholder="Search history..." />
      <div className="px-8 py-6 flex-1 max-w-7xl mx-auto w-full">
        <PageHeader title="Incident History" subtitle="Your complete response history and outcomes." />

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#8b1a1a] animate-spin" />
          </div>
        ) : history.length === 0 ? (
          <div data-animate className="text-center py-16 bg-[#1a1d23] rounded-2xl border border-gray-800">
            <Radio className="w-12 h-12 text-gray-600 mx-auto mb-4 animate-pulse" />
            <p className="text-gray-400 font-bold">No completed incidents yet</p>
            <p className="text-gray-500 text-xs mt-1">Resolved and on-scene incidents will appear here.</p>
          </div>
        ) : (
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
                        {h.duration !== "—" && <span>Duration: {h.duration}</span>}
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
        )}
      </div>
    </div>
  );
}
