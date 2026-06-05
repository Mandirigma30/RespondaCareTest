import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { Search, UserPlus, Download, Filter, Eye, X, ShieldAlert, Heart, Activity, User } from "lucide-react";
import { TopBar } from "../../components/layout/TopBar";
import { PageHeader } from "../../components/ui/PageHeader";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Link } from "react-router-dom";
import { supabase, isPlaceholderUrl } from "../../lib/supabase";
import { decryptPayload } from "../../lib/cryptoUtils";
import jsPDF from "jspdf";
import "jspdf-autotable";

type Resident = {
  id: string;
  name: string;
  age: number;
  zone: string;
  contact: string;
  bloodType: string;
  vulnerability: "High" | "Medium" | "Low";
  lastUpdated: string;
  encrypted_payload?: string;
  encryptedPayload?: string;
  gender?: string;
  dob?: string;
  address?: string;
  next_of_kin_name?: string;
  next_of_kin_relationship?: string;
  next_of_kin_contact_number?: string;
  email?: string;
};

const vulnMap: Record<string, "red" | "orange" | "green"> = {
  High: "red", Medium: "orange", Low: "green",
};

export default function ResidentsPage() {
  const ref = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [zoneFilter, setZoneFilter] = useState("All");
  const [vulnFilter, setVulnFilter] = useState("All");
  const [residentsList, setResidentsList] = useState<Resident[]>([]);
  
  // Modal states
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
  const [decryptedMedical, setDecryptedMedical] = useState<any | null>(null);
  const [decrypting, setDecrypting] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-animate]", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.06, ease: "power2.out" });
    }, ref);
    return () => ctx.revert();
  }, [residentsList]);

  const loadResidents = async () => {
    if (isPlaceholderUrl) {
      const cached = localStorage.getItem("respondaCare_residents") || "[]";
      const parsed = JSON.parse(cached);
      
      const mapped = parsed.map((r: any, idx: number) => ({
        id: r.id || `RC-${100 + idx}`,
        name: r.name || "Unknown",
        age: r.age || 30,
        zone: r.barangay?.includes("Zone 2") ? "Zone 2" : r.barangay?.includes("Zone 3") ? "Zone 3" : r.barangay?.includes("Zone 4") ? "Zone 4" : "Zone 1",
        contact: r.contact || "N/A",
        bloodType: r.bloodType || "O+",
        vulnerability: r.vulnerability || "Low",
        lastUpdated: r.lastUpdated || "2024-03-24",
        encryptedPayload: r.encryptedPayload,
        gender: r.gender || "Female",
        dob: r.dob || "1994-01-01",
        address: r.address || "N/A",
        next_of_kin_name: r.next_of_kin_name || "N/A",
        next_of_kin_relationship: r.next_of_kin_relationship || "N/A",
        next_of_kin_contact_number: r.next_of_kin_contact_number || "N/A",
      }));
      setResidentsList(mapped);
    } else {
      try {
        const { data, error } = await supabase
          .from("core.residents")
          .select(`
            resident_id,
            address,
            date_of_birth,
            gender,
            contact_number,
            mobility_status,
            encrypted_payload,
            next_of_kin_name,
            next_of_kin_relationship,
            next_of_kin_contact_number,
            created_at,
            user_id
          `);
        
        if (error) throw error;
        if (data) {
          const { data: usersData } = await supabase
            .from("security.users")
            .select("user_id, full_name, email");
          
          const userMap = new Map(usersData?.map(u => [u.user_id, u]) || []);
          
          const mapped = data.map((res: any) => {
            const user = userMap.get(res.user_id);
            const birthYear = res.date_of_birth ? new Date(res.date_of_birth).getFullYear() : 1990;
            const age = new Date().getFullYear() - birthYear;

            return {
              id: res.resident_id,
              name: user?.full_name || "Unknown",
              age: age,
              zone: res.address?.includes("Zone 2") ? "Zone 2" : res.address?.includes("Zone 3") ? "Zone 3" : res.address?.includes("Zone 4") ? "Zone 4" : "Zone 1",
              contact: res.contact_number || "N/A",
              bloodType: "O+", 
              vulnerability: (res.mobility_status || "Low") as any,
              lastUpdated: new Date(res.created_at).toISOString().slice(0, 10),
              encrypted_payload: res.encrypted_payload,
              gender: res.gender,
              dob: res.date_of_birth,
              address: res.address,
              next_of_kin_name: res.next_of_kin_name,
              next_of_kin_relationship: res.next_of_kin_relationship,
              next_of_kin_contact_number: res.next_of_kin_contact_number,
              email: user?.email || "N/A"
            };
          });
          setResidentsList(mapped);
        }
      } catch (err) {
        console.error("Error loading residents:", err);
      }
    }
  };

  useEffect(() => {
    loadResidents();
  }, []);

  const handleOpenModal = async (res: Resident) => {
    setSelectedResident(res);
    setDecryptedMedical(null);
    const payload = res.encrypted_payload || res.encryptedPayload;
    if (payload) {
      setDecrypting(true);
      try {
        const decrypted = await decryptPayload(payload, "barangay45key");
        setDecryptedMedical(decrypted);

        // Audit log sync
        if (!isPlaceholderUrl) {
          await supabase.from("security.audit_log").insert({
            action: "DECRYPT_LOOKUP_ADMIN",
            target_table: "core.residents",
            target_id: res.id,
            details: { info: `Admin viewed decrypted profile of ${res.name}` }
          });
        }
      } catch (err) {
        console.error("Failed to decrypt health profile:", err);
      } finally {
        setDecrypting(false);
      }
    }
  };

  const handleExportCsv = () => {
    const headers = ["ID", "Name", "Age", "Zone", "Contact", "Blood Type", "Vulnerability", "Last Updated"];
    const rows = filtered.map(r => [r.id, r.name, r.age, r.zone, r.contact, r.bloodType, r.vulnerability, r.lastUpdated]);
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "respondaCare_residents.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPdf = () => {
    const doc = new jsPDF();
    doc.text("RespondaCare Resident Directory", 14, 15);
    (doc as any).autoTable({
      startY: 20,
      head: [['ID', 'Name', 'Age', 'Zone', 'Contact', 'Blood Type', 'Vulnerability', 'Last Updated']],
      body: filtered.map(r => [r.id, r.name, r.age, r.zone, r.contact, r.bloodType, r.vulnerability, r.lastUpdated]),
    });
    doc.save("respondaCare_residents.pdf");
  };

  const filtered = residentsList.filter((r) => {
    const matchesQuery = r.name.toLowerCase().includes(query.toLowerCase()) || 
                         r.zone.toLowerCase().includes(query.toLowerCase()) ||
                         r.id.toLowerCase().includes(query.toLowerCase());
    const matchesZone = zoneFilter === "All" || r.zone === zoneFilter;
    const matchesVuln = vulnFilter === "All" || r.vulnerability === vulnFilter;
    return matchesQuery && matchesZone && matchesVuln;
  });

  return (
    <div ref={ref} className="flex flex-col h-full bg-[#0c0f16]">
      <TopBar title="Resident Directory" />
      <div className="px-8 py-6 flex-1 max-w-7xl mx-auto w-full">
        <PageHeader
          title="Resident Directory"
          subtitle="Complete listing of registered community members."
          actions={
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleExportCsv}><Download className="w-4 h-4 mr-1" /> Export CSV</Button>
              <Button variant="ghost" size="sm" onClick={handleExportPdf}><Download className="w-4 h-4 mr-1" /> Export PDF</Button>
              <Link to="/admin/residents/new">
                <Button size="sm"><UserPlus className="w-4 h-4 mr-1" /> Add Resident</Button>
              </Link>
            </div>
          }
        />

        {/* Filters */}
        <div data-animate className="flex flex-col md:flex-row items-center gap-4 mb-6">
          <div className="relative flex-1 w-full md:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8b949e]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search residents..."
              className="w-full bg-[#1a1d23] border border-[#2d333b] rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-[#8b949e] focus:outline-none focus:ring-1 focus:ring-[#8b1a1a]"
            />
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
            <div className="flex items-center gap-1 bg-[#1a1d23] border border-[#2d333b] rounded-lg px-2 text-sm text-gray-300">
              <Filter className="w-3.5 h-3.5 text-[#8b949e]" />
              <select value={zoneFilter} onChange={(e) => setZoneFilter(e.target.value)} className="bg-transparent border-none outline-none text-white py-1">
                <option value="All" className="bg-[#1a1d23]">All Zones</option>
                <option value="Zone 1" className="bg-[#1a1d23]">Zone 1</option>
                <option value="Zone 2" className="bg-[#1a1d23]">Zone 2</option>
                <option value="Zone 3" className="bg-[#1a1d23]">Zone 3</option>
                <option value="Zone 4" className="bg-[#1a1d23]">Zone 4</option>
              </select>
            </div>

            <div className="flex items-center gap-1 bg-[#1a1d23] border border-[#2d333b] rounded-lg px-2 text-sm text-gray-300">
              <Filter className="w-3.5 h-3.5 text-[#8b949e]" />
              <select value={vulnFilter} onChange={(e) => setVulnFilter(e.target.value)} className="bg-transparent border-none outline-none text-white py-1">
                <option value="All" className="bg-[#1a1d23]">All Vulnerability</option>
                <option value="Low" className="bg-[#1a1d23]">Low</option>
                <option value="Medium" className="bg-[#1a1d23]">Medium</option>
                <option value="High" className="bg-[#1a1d23]">High</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div data-animate className="bg-[#1a1d23] border border-[#2d333b] rounded-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#1e222a] text-[#8b949e] text-[11px] font-bold uppercase tracking-widest border-b border-[#2d333b]">
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Age</th>
                  <th className="px-6 py-4">Zone</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Vulnerability</th>
                  <th className="px-6 py-4">Last Updated</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2d333b]">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 text-xs font-mono text-[#8b949e]">{r.id.substring(0, 8)}...</td>
                    <td className="px-6 py-4 font-semibold text-white text-sm">{r.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-300">{r.age}</td>
                    <td className="px-6 py-4 text-sm text-gray-300">{r.zone}</td>
                    <td className="px-6 py-4 text-sm text-gray-300">{r.contact}</td>
                    <td className="px-6 py-4">
                      <Badge variant={vulnMap[r.vulnerability]}>{r.vulnerability}</Badge>
                    </td>
                    <td className="px-6 py-4 text-xs text-[#8b949e]">{r.lastUpdated}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleOpenModal(r)}
                        className="text-[#4299e1] hover:text-blue-300 transition-colors cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-[#1e222a] px-6 py-4 border-t border-[#2d333b] flex items-center justify-between">
            <p className="text-xs text-[#8b949e]">Showing <span className="text-white">{filtered.length}</span> of <span className="text-white">{residentsList.length}</span> residents</p>
          </div>
        </div>

        {/* Details Modal */}
        {selectedResident && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-2xl bg-[#1a1d23] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              <header className="px-6 py-4 bg-[#1e222a] border-b border-gray-800 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-white">Resident Information Profile</h3>
                  <p className="text-xs text-[#8b949e] mt-1 font-mono">Resident ID: {selectedResident.id}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedResident(null);
                    setDecryptedMedical(null);
                  }}
                  className="p-1 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </header>

              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
                {/* Demographic details */}
                <div>
                  <h4 className="text-xs font-bold text-[#8b949e] uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> Demographic Details
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-[#0d1117] p-4 rounded-xl border border-white/[0.02]">
                    <div>
                      <p className="text-xs text-gray-500">Full Name</p>
                      <p className="font-semibold text-white mt-0.5">{selectedResident.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Date of Birth</p>
                      <p className="text-gray-300 mt-0.5">{selectedResident.dob || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Age / Gender</p>
                      <p className="text-gray-300 mt-0.5">{selectedResident.age} years / {selectedResident.gender || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Contact Number</p>
                      <p className="text-gray-300 mt-0.5">{selectedResident.contact}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Email Address</p>
                      <p className="text-gray-300 mt-0.5 truncate">{selectedResident.email || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Vulnerability Status</p>
                      <p className="mt-1"><Badge variant={vulnMap[selectedResident.vulnerability]}>{selectedResident.vulnerability}</Badge></p>
                    </div>
                    <div className="col-span-2 md:col-span-3">
                      <p className="text-xs text-gray-500">Home Address</p>
                      <p className="text-gray-300 mt-0.5">{selectedResident.address || "N/A"}</p>
                    </div>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div>
                  <h4 className="text-xs font-bold text-[#8b949e] uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-[#ed8936]" /> Emergency Contact
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#0d1117] p-4 rounded-xl border border-white/[0.02]">
                    <div>
                      <p className="text-xs text-gray-500">Contact Name</p>
                      <p className="font-semibold text-white mt-0.5">{selectedResident.next_of_kin_name || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Relationship</p>
                      <p className="text-gray-300 mt-0.5">{selectedResident.next_of_kin_relationship || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Contact Phone</p>
                      <p className="text-gray-300 mt-0.5">{selectedResident.next_of_kin_contact_number || "N/A"}</p>
                    </div>
                  </div>
                </div>

                {/* Decrypted Health Profile */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-xs font-bold text-[#8b949e] uppercase tracking-widest flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5 text-red-500" /> Decrypted Health Records
                    </h4>
                    <span className="text-[9px] font-mono text-emerald-400 border border-emerald-500/20 bg-emerald-950/20 px-2 py-0.5 rounded flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      RA 10173 Compliant Decryption
                    </span>
                  </div>

                  {decrypting ? (
                    <div className="p-8 bg-[#0d1117] rounded-xl border border-white/[0.02] flex flex-col items-center justify-center gap-2">
                      <Activity className="w-6 h-6 text-[#4299e1] animate-spin" />
                      <p className="text-xs text-gray-400 font-mono">Decrypting payload with barangay45key...</p>
                    </div>
                  ) : decryptedMedical ? (
                    <div className="bg-[#0d1117] p-5 rounded-xl border border-white/[0.02] space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 font-bold uppercase">Chronic Conditions</p>
                          <p className="text-gray-200 mt-1 whitespace-pre-line">{decryptedMedical.sample?.s || "None on record"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-bold uppercase">Known Allergies</p>
                          <p className="text-red-300 mt-1 whitespace-pre-line">{decryptedMedical.sample?.a || "None on record"}</p>
                        </div>
                      </div>
                      <div className="border-t border-white/[0.04] pt-4">
                        <p className="text-xs text-gray-500 font-bold uppercase font-mono">Current Medications</p>
                        <p className="text-green-300 mt-1 font-semibold whitespace-pre-line">{decryptedMedical.sample?.m || "None on record"}</p>
                      </div>
                      {decryptedMedical.sample?.p && (
                        <div className="border-t border-white/[0.04] pt-4">
                          <p className="text-xs text-gray-500 font-bold uppercase">Clinical Notes</p>
                          <p className="text-gray-300 mt-1 whitespace-pre-line">{decryptedMedical.sample?.p}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-6 bg-[#0d1117] rounded-xl border border-white/[0.02] text-center text-[#8b949e] text-xs">
                      No encrypted health records found for this resident or decryption key mismatched.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
