import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Activity, Heart, AlertCircle, Eye } from "lucide-react";
import { TopBar } from "../../components/layout/TopBar";
import { PageHeader } from "../../components/ui/PageHeader";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";

const records = [
  { id: "RC-001", name: "Maria Santos",   age: 62, condition: "Hypertension, Type 2 Diabetes", bp: "145/92", bmi: "28.4", last: "2024-03-22", risk: "High"   },
  { id: "RC-003", name: "Ana Reyes",      age: 78, condition: "COPD, Heart Failure",            bp: "158/96", bmi: "24.1", last: "2024-03-20", risk: "High"   },
  { id: "RC-007", name: "Elena Torres",   age: 70, condition: "Stroke Recovery",                bp: "130/85", bmi: "22.8", last: "2024-03-18", risk: "High"   },
  { id: "RC-004", name: "Pedro Lim",      age: 34, condition: "Asthma",                         bp: "118/76", bmi: "23.5", last: "2024-03-15", risk: "Medium" },
  { id: "RC-005", name: "Rosa Garcia",    age: 55, condition: "Pre-diabetes",                   bp: "125/80", bmi: "27.0", last: "2024-03-10", risk: "Medium" },
  { id: "RC-002", name: "Juan dela Cruz", age: 45, condition: "None on record",                 bp: "112/72", bmi: "21.2", last: "2024-03-01", risk: "Low"    },
];

const riskMap: Record<string, "red" | "orange" | "green"> = { High: "red", Medium: "orange", Low: "green" };

export default function HealthRecordsPage() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-animate]", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.07, ease: "power2.out" });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={ref} className="flex flex-col h-full bg-[#0c0f16]">
      <TopBar title="Health Records" searchPlaceholder="Search residents..." />
      <div className="px-8 py-6 flex-1 max-w-7xl mx-auto w-full">
        <PageHeader title="Health Records" subtitle="Monitoring high-risk individuals and recent consultations." />

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { icon: <AlertCircle className="w-6 h-6 text-[#e53e3e]" />, bg: "bg-red-900/20", label: "High Risk Residents", value: "234", sub: "+12 this month" },
            { icon: <Heart className="w-6 h-6 text-[#ed8936]" />,       bg: "bg-orange-900/20", label: "Chronic Conditions", value: "891", sub: "across 3 categories" },
            { icon: <Activity className="w-6 h-6 text-[#48bb78]" />,    bg: "bg-green-900/20", label: "Active Consultations", value: "47", sub: "in the last 7 days" },
          ].map((s, i) => (
            <div key={i} data-animate className="bg-[#1a1d23] p-5 rounded-xl border border-[#2d333b] flex items-start gap-4 hover-lift">
              <div className={`p-2.5 rounded-lg ${s.bg} flex-shrink-0`}>{s.icon}</div>
              <div>
                <p className="text-[#8b949e] text-xs mb-1">{s.label}</p>
                <p className="text-3xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-[#8b949e] mt-1">{s.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div data-animate className="bg-[#1a1d23] border border-[#2d333b] rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#1e222a] text-[#8b949e] text-[11px] font-bold uppercase tracking-widest border-b border-[#2d333b]">
                <th className="px-6 py-4">Resident</th>
                <th className="px-6 py-4">Age</th>
                <th className="px-6 py-4">Primary Condition</th>
                <th className="px-6 py-4">BP</th>
                <th className="px-6 py-4">BMI</th>
                <th className="px-6 py-4">Last Checkup</th>
                <th className="px-6 py-4">Risk Level</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2d333b]">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-white text-sm">{r.name}</p>
                    <p className="text-xs text-[#8b949e] font-mono">{r.id}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">{r.age}</td>
                  <td className="px-6 py-4 text-sm text-gray-300 max-w-[200px]">{r.condition}</td>
                  <td className="px-6 py-4 text-sm font-mono text-gray-300">{r.bp}</td>
                  <td className="px-6 py-4 text-sm font-mono text-gray-300">{r.bmi}</td>
                  <td className="px-6 py-4 text-xs text-[#8b949e]">{r.last}</td>
                  <td className="px-6 py-4"><Badge variant={riskMap[r.risk]}>{r.risk}</Badge></td>
                  <td className="px-6 py-4">
                    <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /> View</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
