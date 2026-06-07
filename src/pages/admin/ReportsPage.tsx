import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { TopBar } from "../../components/layout/TopBar";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { Download, AlertTriangle, UserCheck, Timer, TrendingUp } from "lucide-react";
import { Button } from "../../components/ui/Button";

const incidentTrend = [
  { month: "Oct", count: 34 }, { month: "Nov", count: 28 }, { month: "Dec", count: 45 },
  { month: "Jan", count: 38 }, { month: "Feb", count: 52 }, { month: "Mar", count: 41 },
];
const responseTime = [
  { day: "Mon", time: 5.2 }, { day: "Tue", time: 4.8 }, { day: "Wed", time: 6.1 },
  { day: "Thu", time: 4.3 }, { day: "Fri", time: 5.7 }, { day: "Sat", time: 3.9 }, { day: "Sun", time: 4.2 },
];
const defaultIncidentTypes = [
  { name: "Medical", value: 42 }, { name: "Accident", value: 28 }, { name: "Fire", value: 12 },
  { name: "Violence", value: 10 }, { name: "Other", value: 8 },
];
const COLORS = ["#e53e3e", "#ed8936", "#ecc94b", "#4299e1", "#718096"];

const defaultResolvedByZone = [
  { zone: "Zone 1", resolved: 18, pending: 5 }, { zone: "Zone 2", resolved: 22, pending: 3 },
  { zone: "Zone 3", resolved: 15, pending: 8 }, { zone: "Zone 4", resolved: 12, pending: 2 },
  { zone: "Zone 5", resolved: 9,  pending: 4 },
];

const tooltipStyle = { backgroundColor: "#1a1d23", border: "1px solid #2d333b", borderRadius: 8, color: "#e2e8f0" };

export default function ReportsPage() {
  const ref = useRef<HTMLDivElement>(null);

  // Dynamic stats state
  const [stats, setStats] = useState({
    totalIncidents: 241,
    resolutionRate: 89,
    avgResponseTime: 4.2,
    residentsEnrolled: 2405
  });

  const [pieData, setPieData] = useState(defaultIncidentTypes);
  const [zoneData, setZoneData] = useState(defaultResolvedByZone);

  useEffect(() => {
    // 1. Enrolled residents
    const cachedResidents = localStorage.getItem("respondaCare_residents");
    let residentsCount = 2405;
    if (cachedResidents) {
      try {
        const parsed = JSON.parse(cachedResidents);
        residentsCount = 2400 + parsed.length; // offset by default number
      } catch (e) {}
    }

    // 2. Incidents & Handovers
    const cachedIncidents = localStorage.getItem("respondaCare_incidents");
    const cachedHandovers = localStorage.getItem("respondaCare_handovers");
    
    let localIncidents = [];
    let localHandovers = [];
    
    if (cachedIncidents) {
      try { localIncidents = JSON.parse(cachedIncidents); } catch(e){}
    }
    if (cachedHandovers) {
      try { localHandovers = JSON.parse(cachedHandovers); } catch(e){}
    }

    // Calculations
    const totalLocalInc = localIncidents.length;
    const resolvedLocal = localIncidents.filter((i: any) => i.status === "Resolved").length + localHandovers.length;

    const baseIncidents = 241;
    const computedTotalIncidents = baseIncidents + totalLocalInc;
    
    const baseResolved = Math.round(baseIncidents * 0.89);
    const computedResolved = baseResolved + resolvedLocal;
    const computedRate = Math.min(100, Math.round((computedResolved / computedTotalIncidents) * 100)) || 89;

    setStats({
      totalIncidents: computedTotalIncidents,
      resolutionRate: computedRate,
      avgResponseTime: 4.2,
      residentsEnrolled: residentsCount
    });

    // Pie chart update (Merge local categories)
    const categoryCounts: Record<string, number> = {
      "Medical": 42,
      "Accident": 28,
      "Fire": 12,
      "Violence": 10,
      "Other": 8
    };

    localIncidents.forEach((inc: any) => {
      const cat = inc.category || "Medical";
      if (categoryCounts[cat] !== undefined) {
        categoryCounts[cat] += 1;
      } else {
        categoryCounts["Other"] += 1;
      }
    });

    const updatedPie = Object.keys(categoryCounts).map(name => ({
      name,
      value: categoryCounts[name]
    }));
    setPieData(updatedPie);

    // Zone Data update
    const zoneCounts: Record<string, { resolved: number, pending: number }> = {
      "Zone 1": { resolved: 18, pending: 5 },
      "Zone 2": { resolved: 22, pending: 3 },
      "Zone 3": { resolved: 15, pending: 8 },
      "Zone 4": { resolved: 12, pending: 2 },
      "Zone 5": { resolved: 9,  pending: 4 }
    };

    localIncidents.forEach((inc: any) => {
      const zoneName = inc.barangay && inc.barangay.includes("Zone") 
        ? inc.barangay.substring(inc.barangay.indexOf("Zone"), inc.barangay.indexOf("Zone") + 6) 
        : "Zone 3";
      
      const targetZone = zoneCounts[zoneName] || zoneCounts["Zone 3"];
      if (inc.status === "Resolved") {
        targetZone.resolved += 1;
      } else {
        targetZone.pending += 1;
      }
    });

    const updatedZones = Object.keys(zoneCounts).map(zone => ({
      zone,
      resolved: zoneCounts[zone].resolved,
      pending: zoneCounts[zone].pending
    }));
    setZoneData(updatedZones);

  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-animate]", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.07, ease: "power2.out" });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={ref} className="flex flex-col h-full bg-[#0c0f16]">
      <TopBar title="Reports & Analytics" />
      <div className="px-8 py-6 flex-1 space-y-6 max-w-7xl mx-auto w-full">
        <PageHeader
          title="Reports Dashboard"
          subtitle="Performance metrics, incident trends and community health analytics."
          actions={
            <Button size="sm"><Download className="w-4 h-4" /> Export Report</Button>
          }
        />

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Total Incidents (30d)" value={stats.totalIncidents}   iconBg="bg-red-900/30"    icon={<AlertTriangle className="w-6 h-6 text-[#e53e3e]" />} trend="↑ +18%" trendColor="red" />
          <StatCard label="Resolution Rate"       value={stats.resolutionRate}    iconBg="bg-green-900/30"  icon={<UserCheck className="w-6 h-6 text-[#48bb78]" />}      trend="↑ +4%" trendColor="green" suffix="%" />
          <StatCard label="Avg. Response (min)"   value={stats.avgResponseTime}   iconBg="bg-blue-900/30"   icon={<Timer className="w-6 h-6 text-[#4299e1]" />}          trend="↓ -12s" trendColor="green" suffix="m" />
          <StatCard label="Residents Enrolled"    value={stats.residentsEnrolled}  iconBg="bg-orange-900/30" icon={<TrendingUp className="w-6 h-6 text-[#ed8936]" />}      trend="↑ +3.2%" trendColor="green" />
        </div>

        {/* Charts row 1 */}
        <div className="grid grid-cols-3 gap-6">
          {/* Incident Trend */}
          <div data-animate className="col-span-2 bg-[#1a1d23] rounded-2xl p-6 border border-[#2d333b]">
            <h3 className="font-bold text-white mb-1">Incident Trend (6 Months)</h3>
            <p className="text-xs text-[#8b949e] mb-5">Monthly incident volume across all zones</p>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={incidentTrend}>
                <defs>
                  <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b1a1a" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8b1a1a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d333b" />
                <XAxis dataKey="month" tick={{ fill: "#8b949e", fontSize: 11 }} />
                <YAxis tick={{ fill: "#8b949e", fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="count" stroke="#e53e3e" fill="url(#incGrad)" strokeWidth={2} name="Incidents" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Incident Types Pie */}
          <div data-animate className="bg-[#1a1d23] rounded-2xl p-6 border border-[#2d333b]">
            <h3 className="font-bold text-white mb-1">Incident Types</h3>
            <p className="text-xs text-[#8b949e] mb-4">Distribution by category</p>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={(p) => `${p.name ?? ''} ${(((p.percent ?? 0)) * 100).toFixed(0)}%`} labelLine={false} fontSize={9}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts row 2 */}
        <div className="grid grid-cols-2 gap-6">
          {/* Response Time */}
          <div data-animate className="bg-[#1a1d23] rounded-2xl p-6 border border-[#2d333b]">
            <h3 className="font-bold text-white mb-1">Avg. Response Time (This Week)</h3>
            <p className="text-xs text-[#8b949e] mb-5">Minutes from alert to arrival</p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={responseTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d333b" />
                <XAxis dataKey="day" tick={{ fill: "#8b949e", fontSize: 11 }} />
                <YAxis tick={{ fill: "#8b949e", fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="time" stroke="#4299e1" strokeWidth={2} dot={{ fill: "#4299e1", r: 4 }} name="Avg. Minutes" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Zone Resolution */}
          <div data-animate className="bg-[#1a1d23] rounded-2xl p-6 border border-[#2d333b]">
            <h3 className="font-bold text-white mb-1">Resolved vs. Pending by Zone</h3>
            <p className="text-xs text-[#8b949e] mb-5">Incident resolution status per zone</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={zoneData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d333b" />
                <XAxis dataKey="zone" tick={{ fill: "#8b949e", fontSize: 11 }} />
                <YAxis tick={{ fill: "#8b949e", fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ color: "#8b949e", fontSize: 11 }} />
                <Bar dataKey="resolved" fill="#48bb78" name="Resolved" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pending"  fill="#e53e3e" name="Pending"  radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
