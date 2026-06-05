import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { Download } from "lucide-react";
import { TopBar } from "../../components/layout/TopBar";
import { PageHeader } from "../../components/ui/PageHeader";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { supabase, isPlaceholderUrl } from "../../lib/supabase";

type LogRole = "dispatcher" | "admin" | "responder" | "automated";

interface AuditLogItem {
  ts: string;
  time: string;
  user: string;
  role: LogRole;
  action: string;
  resource: string;
  ip: string;
  dotColor: string;
}

const defaultLogs: AuditLogItem[] = [
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
  const [logsList, setLogsList] = useState<AuditLogItem[]>(defaultLogs);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-animate]", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.06, ease: "power2.out" });
    }, ref);
    return () => ctx.revert();
  }, [logsList]);

  const loadAuditLogs = async () => {
    if (isPlaceholderUrl) {
      setLogsList(defaultLogs);
    } else {
      try {
        const { data, error } = await supabase
          .from("security.audit_log")
          .select("*")
          .order("created_at", { ascending: false });
        
        if (error) throw error;
        if (data) {
          const { data: usersData } = await supabase
            .from("security.users")
            .select("user_id, full_name, role_id");
          
          const userMap = new Map(usersData?.map(u => [u.user_id, u]) || []);
          
          const roleMap: Record<number, string> = {
            1: "admin",
            2: "bhw",
            3: "patient",
            4: "responder",
            5: "dispatcher"
          };

          const mapped = data.map((log: any) => {
            const user = userMap.get(log.actor_id);
            const userRoleName = user ? roleMap[user.role_id] : "automated";
            
            const dateObj = new Date(log.created_at);
            const tsStr = dateObj.toISOString().slice(0, 10);
            const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            let logAction = log.action;
            if (log.details && log.details.info) {
              logAction = log.details.info;
            }

            let dotColor = "bg-blue-500";
            if (log.action.includes("DECRYPT")) dotColor = "bg-red-500";
            else if (log.action.includes("INSERT") || log.action.includes("CREATE")) dotColor = "bg-green-500";
            else if (log.action.includes("UPDATE")) dotColor = "bg-orange-400";

            return {
              ts: tsStr,
              time: timeStr,
              user: user?.full_name || "System",
              role: (userRoleName || "automated") as any,
              action: logAction,
              resource: log.target_table || "System",
              ip: log.ip_address || "N/A",
              dotColor: dotColor
            };
          });
          setLogsList(mapped);
        }
      } catch (err) {
        console.error("Error fetching audit logs:", err);
      }
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const handleExport = () => {
    const headers = ["Timestamp", "User", "Role", "Action", "Resource", "IP Address"];
    const rows = filteredLogs.map(log => [`${log.ts} ${log.time}`, log.user, log.role, log.action, log.resource, log.ip]);
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "respondaCare_audit_log.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLogs = logsList.filter(log => 
    log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.resource.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination config
  const itemsPerPage = 8;
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = filteredLogs.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div ref={ref} className="flex flex-col h-full bg-[#0c0f16]">
      <TopBar title="Audit Log" searchPlaceholder="Quick search events..." />
      <div className="px-8 py-6 flex-1 max-w-7xl mx-auto w-full">
        <PageHeader
          title="Audit Log"
          subtitle="Review and monitor system-wide activity and administrative changes."
          actions={<Button size="sm" onClick={handleExport}><Download className="w-4 h-4 mr-1" /> Export Log</Button>}
        />

        {/* Filter Bar */}
        <div data-animate className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="bg-[#1a1d23] border border-[#2d333b] px-3 py-2 rounded-md text-sm font-medium text-gray-300">
            Date Range: Last 24 Hours
          </div>
          <div className="bg-[#1a1d23] border border-[#2d333b] px-3 py-2 rounded-md text-sm font-medium text-gray-300">
            Action Type: All
          </div>
          <div className="relative ml-auto w-full md:w-auto">
            <input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search logs..."
              className="bg-[#1a1d23] border border-[#2d333b] rounded-md pl-4 pr-3 py-2 text-sm text-gray-300 placeholder-[#8b949e] w-full md:w-72 focus:outline-none focus:ring-1 focus:ring-[#8b1a1a]"
            />
          </div>
        </div>

        {/* Table */}
        <div data-animate className="bg-[#1a1d23] border border-[#2d333b] rounded-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
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
                {paginatedLogs.map((log, i) => (
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
                        {log.resource.substring(log.resource.lastIndexOf('.') + 1)}
                      </span>
                    </td>
                    <td className="px-6 py-5 align-top text-xs font-mono text-[#8b949e]">{log.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-[#1e222a] px-6 py-4 border-t border-[#2d333b] flex items-center justify-between">
            <p className="text-xs text-[#8b949e]">
              Showing <span className="text-white">{Math.min(filteredLogs.length, (page - 1) * itemsPerPage + 1)}–{Math.min(filteredLogs.length, page * itemsPerPage)}</span> of <span className="text-white">{filteredLogs.length}</span> entries
            </p>
            <div className="flex items-center gap-1.5 font-mono">
              {Array.from({ length: totalPages }).map((_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={i}
                    onClick={() => setPage(p)}
                    className={[
                      "w-8 h-8 flex items-center justify-center rounded text-xs font-bold cursor-pointer",
                      page === p ? "bg-[#8b1a1a] text-white" : "border border-[#2d333b] bg-[#1a1d23] text-[#8b949e] hover:border-gray-500"
                    ].join(" ")}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
