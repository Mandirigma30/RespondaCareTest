"use client";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { Search, UserPlus, Download, Filter, Eye } from "lucide-react";
import { TopBar } from "../../components/layout/TopBar";
import { PageHeader } from "../../components/ui/PageHeader";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import Link from "next/link";

type Resident = {
  id: string;
  name: string;
  age: number;
  zone: string;
  contact: string;
  bloodType: string;
  vulnerability: "High" | "Medium" | "Low";
  lastUpdated: string;
};

const residents: Resident[] = [
  { id: "RC-001", name: "Maria Santos",    age: 62, zone: "Zone 3", contact: "(555) 012-3456", bloodType: "O+", vulnerability: "High",   lastUpdated: "2024-03-24" },
  { id: "RC-002", name: "Juan dela Cruz",  age: 45, zone: "Zone 1", contact: "(555) 234-5678", bloodType: "A+", vulnerability: "Low",    lastUpdated: "2024-03-23" },
  { id: "RC-003", name: "Ana Reyes",       age: 78, zone: "Zone 2", contact: "(555) 345-6789", bloodType: "B-", vulnerability: "High",   lastUpdated: "2024-03-22" },
  { id: "RC-004", name: "Pedro Lim",       age: 34, zone: "Zone 5", contact: "(555) 456-7890", bloodType: "AB+", vulnerability: "Medium", lastUpdated: "2024-03-21" },
  { id: "RC-005", name: "Rosa Garcia",     age: 55, zone: "Zone 4", contact: "(555) 567-8901", bloodType: "O-", vulnerability: "Medium", lastUpdated: "2024-03-20" },
  { id: "RC-006", name: "Carlos Mendoza",  age: 29, zone: "Zone 1", contact: "(555) 678-9012", bloodType: "A-", vulnerability: "Low",    lastUpdated: "2024-03-19" },
  { id: "RC-007", name: "Elena Torres",    age: 70, zone: "Zone 3", contact: "(555) 789-0123", bloodType: "B+", vulnerability: "High",   lastUpdated: "2024-03-18" },
  { id: "RC-008", name: "Miguel Flores",   age: 48, zone: "Zone 2", contact: "(555) 890-1234", bloodType: "O+", vulnerability: "Low",    lastUpdated: "2024-03-17" },
];

const vulnMap: Record<string, "red" | "orange" | "green"> = {
  High: "red", Medium: "orange", Low: "green",
};

export default function ResidentsPage() {
  const ref = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-animate]", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.06, ease: "power2.out" });
    }, ref);
    return () => ctx.revert();
  }, []);

  const filtered = residents.filter((r) =>
    r.name.toLowerCase().includes(query.toLowerCase()) || r.zone.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div ref={ref} className="flex flex-col h-full">
      <TopBar title="Resident Directory" />
      <div className="px-8 py-6 flex-1">
        <PageHeader
          title="Resident Directory"
          subtitle="Complete listing of registered community members."
          actions={
            <>
              <Button variant="ghost" size="sm"><Download className="w-4 h-4" /> Export</Button>
              <Link href="/admin/residents/new">
                <Button size="sm"><UserPlus className="w-4 h-4" /> Add Resident</Button>
              </Link>
            </>
          }
        />

        {/* Filters */}
        <div data-animate className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8b949e]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search residents..."
              className="w-full bg-[#1a1d23] border border-[#2d333b] rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-[#8b949e] focus:outline-none focus:ring-1 focus:ring-[#8b1a1a]"
            />
          </div>
          <Button variant="ghost" size="sm"><Filter className="w-4 h-4" /> Filter by Zone</Button>
          <Button variant="ghost" size="sm"><Filter className="w-4 h-4" /> Vulnerability</Button>
        </div>

        {/* Table */}
        <div data-animate className="bg-[#1a1d23] border border-[#2d333b] rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#1e222a] text-[#8b949e] text-[11px] font-bold uppercase tracking-widest border-b border-[#2d333b]">
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Age</th>
                <th className="px-6 py-4">Zone</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Blood Type</th>
                <th className="px-6 py-4">Vulnerability</th>
                <th className="px-6 py-4">Last Updated</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2d333b]">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 text-xs font-mono text-[#8b949e]">{r.id}</td>
                  <td className="px-6 py-4 font-semibold text-white text-sm">{r.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-300">{r.age}</td>
                  <td className="px-6 py-4 text-sm text-gray-300">{r.zone}</td>
                  <td className="px-6 py-4 text-sm text-gray-300">{r.contact}</td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-white text-sm">{r.bloodType}</span>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={vulnMap[r.vulnerability]}>{r.vulnerability}</Badge>
                  </td>
                  <td className="px-6 py-4 text-xs text-[#8b949e]">{r.lastUpdated}</td>
                  <td className="px-6 py-4">
                    <button className="text-[#4299e1] hover:text-blue-300 transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="bg-[#1e222a] px-6 py-4 border-t border-[#2d333b] flex items-center justify-between">
            <p className="text-xs text-[#8b949e]">Showing <span className="text-white">{filtered.length}</span> of <span className="text-white">2,405</span> residents</p>
          </div>
        </div>
      </div>
    </div>
  );
}
