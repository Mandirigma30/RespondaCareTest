import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { Download } from "lucide-react";
import { TopBar } from "../../components/layout/TopBar";
import { PageHeader } from "../../components/ui/PageHeader";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";

type LogRole = "dispatcher" | "admin" | "responder" | "automated";

const logs = [
  { ts: "2024-03-24", time: "14:22", user: "Dispatcher 04", role: "dispatcher" as LogRole, action: "Incident #RC-9921 marked as 'Arrived'", resource: "Incident", ip: "192.168.1.45", dotColor: "bg-orange-400" },
  { ts: "2024-03-24", time: "14:15", user: "Admin User",    role: "admin"      as LogRole, action: "Updated Vulnerability Status for Resident: Maria Santos", resource: "Resident", ip: "192.168.1.12", dotColor: "bg-red-500" },
  { ts: "2024-03-24", time: "13:50", user: "Responder 08",  role: "responder"  as LogRole, action: "Successful QR Scan: Resident #205", resource: "QR Scan", ip: "10.0.0.5", dotColor: "bg-emerald-500" },
  { ts: "2024-03-24", time: "13:42", user: "System",        role: "automated"  as LogRole, action: "Daily Database Backup completed", resource: "Backup", ip: "Localhost", dotColor: "bg-blue-500" },
  { ts: "2024-03-24", time: "13:05", user: "Admin User",    role: "admin"      as LogRole, action: "New Resident enrolled: Pedro Lim (RC-004)", resource: "Resident", ip: "192.168.1.12", dotColor: "bg-green-500" },
  { ts: "2024-03-24", time: "12:38", user: "Dispatcher 02", role: "dispatcher" as LogRole, action: "Emergency alert dispatched: #INC-2044", resource: "Incident", ip: "192.168.1.30", dotColor: "bg-orange-400" },
];

export default function AuditLogPage() {
  const ref = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-animate]", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.06, ease: "power2.out" });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={ref} className="flex flex-col h-full bg-[#0c0f16]">
      <TopBar title="Audit Log" searchPlaceholder="Quick search events..." />
      <div className="px-8 py-6 flex-1 max-w-7xl mx-auto w-full">
        <PageHeader
          title="Audit Log"
          subtitle="Review and monitor system-wide activity and administrative changes."
          actions={<Button size="sm"><Download className="w-4 h-4" /> Export Log</Button>}
        />

        {/* Filter Bar */}
        <div data-animate className="flex items-center gap-3 mb-6 flex-wrap">
          {["Date Range: Last 24 Hours", "User Role: All", "Action Type: All"].map((f) => (
            <button key={f} className="flex items-center gap-2 bg-[#1a1d23] border border-[#2d333b] px-3 py-2 rounded-md text-sm font-medium hover:border-gray-500 transition-all text-gray-300">
              {f} <span className="text-[#8b949e] ml-1">▾</span>
            </button>
          ))}
          <div className="relative ml-auto">
            <input placeholder="Search logs..." className="bg-[#1a1d23] border border-[#2d333b] rounded-md pl-8 pr-3 py-2 text-sm text-gray-300 placeholder-[#8b949e] focus:outline-none focus:ring-1 focus:ring-[#8b1a1a]" />
          </div>
        </div>

        {/* Table */}
        <div data-animate className="bg-[#1a1d23] border border-[#2d333b] rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#1e222a] text-[#8b949e] text-[11px] font-bold uppercase tracking-widest border-b border-[#2d333b]">
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Resource</th>
                <th className="px-6 py-4">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2d333b]">
              {logs.map((log, i) => (
                <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-5 align-top">
                    <div className="text-sm font-medium text-white">{log.ts}</div>
                    <div className="text-xs text-[#8b949e] font-bold">{log.time}</div>
                  </td>
                  <td className="px-6 py-5 align-top">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#8b1a1a] to-[#4a0f0f] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {log.user[0]}
                      </div>
                      <span className="text-sm font-semibold text-white">{log.user}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 align-top">
                    <Badge variant={log.role}>{log.role}</Badge>
                  </td>
                  <td className="px-6 py-5 align-top">
                    <div className="flex gap-3">
                      <span className={`h-2 w-2 mt-1.5 rounded-full flex-shrink-0 ${log.dotColor}`} />
                      <span className="text-sm text-gray-300 leading-tight">{log.action}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 align-top">
                    <span className="text-sm text-[#8b949e] underline decoration-[#2d333b] underline-offset-4 cursor-pointer hover:text-white">
                      {log.resource}
                    </span>
                  </td>
                  <td className="px-6 py-5 align-top text-xs font-mono text-[#8b949e]">{log.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="bg-[#1e222a] px-6 py-4 border-t border-[#2d333b] flex items-center justify-between">
            <p className="text-xs text-[#8b949e]">Showing <span className="text-white">1–6</span> of <span className="text-white">1,284</span> entries</p>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, "...", 42].map((p, i) => (
                <button key={i} onClick={() => typeof p === "number" && setPage(p)}
                  className={["w-8 h-8 flex items-center justify-center rounded text-xs font-bold",
                    page === p ? "bg-[#8b1a1a] text-white" : "border border-[#2d333b] bg-[#1a1d23] text-[#8b949e] hover:border-gray-500"
                  ].join(" ")}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
