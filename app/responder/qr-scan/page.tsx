"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import { QrCode, Search, User, AlertCircle, Pill, Heart, Shield, ArrowRight } from "lucide-react";
import { TopBar } from "../../components/layout/TopBar";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { decryptPayload } from "../../lib/cryptoUtils";

interface ScannedResident {
  id: string;
  name: string;
  age: number;
  barangay: string;
  bloodType: string;
  sample: {
    s: string;
    a: string;
    m: string;
    p: string;
    l: string;
    e: string;
  };
}

export default function QRScanPage() {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  const [scanned, setScanned] = useState(false);
  const [localResidents, setLocalResidents] = useState<any[]>([]);
  const [manualId, setManualId] = useState("");
  const [scannedProfile, setScannedProfile] = useState<ScannedResident | null>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-animate]", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.07, ease: "power2.out" });
    }, ref);
    return () => ctx.revert();
  }, []);

  // Fetch registered residents database from local cache
  useEffect(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("respondaCare_residents");
      if (cached) {
        setLocalResidents(JSON.parse(cached));
      }
    }
  }, []);

  const handleSimulateScan = async (encryptedPayload: string) => {
    try {
      // Decrypt using security key "barangay45key"
      const decrypted = await decryptPayload(encryptedPayload, "barangay45key");
      
      const newProfile: ScannedResident = {
        id: `RC-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
        name: decrypted.name,
        age: decrypted.age,
        barangay: decrypted.barangay,
        bloodType: decrypted.bloodType || "O+",
        sample: decrypted.sample
      };

      setScannedProfile(newProfile);
      setScanned(true);
    } catch (err) {
      console.error("Decryption failed", err);
      alert("Verification error: Security payload is corrupt or derived with an invalid key.");
    }
  };

  const handleSearchManual = async () => {
    if (!manualId.trim()) return;
    
    // Try decrypting input base64 string directly
    try {
      const decrypted = await decryptPayload(manualId.trim(), "barangay45key");
      const newProfile: ScannedResident = {
        id: `RC-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
        name: decrypted.name,
        age: decrypted.age,
        barangay: decrypted.barangay,
        bloodType: decrypted.bloodType || "O+",
        sample: decrypted.sample
      };
      setScannedProfile(newProfile);
      setScanned(true);
      return;
    } catch (e) {
      // Ignore and proceed to name lookup
    }

    // Find in enrolled list
    const found = localResidents.find(r => r.name.toLowerCase().includes(manualId.toLowerCase()));
    if (found) {
      handleSimulateScan(found.encryptedPayload);
    } else {
      alert("Resident not found in cache. Ensure they have been enrolled first or input the raw encrypted base64 payload.");
    }
  };

  const proceedToUir = () => {
    if (!scannedProfile) return;
    // Cache inside sessionStorage to prefill long-form assessment
    sessionStorage.setItem("respondaCare_scanned_resident", JSON.stringify(scannedProfile));
    router.push("/responder/turnover");
  };

  return (
    <div ref={ref} className="flex flex-col h-full bg-[#0c0f16] text-white">
      <TopBar title="QR Scan & Profile" showSearch={false} />
      <div className="px-8 py-6 flex-1 max-w-4xl mx-auto w-full pb-20">
        <div data-animate className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white flex items-center justify-center gap-2">
            <QrCode className="h-8 w-8 text-[#8b1a1a]" />
            Resident Medical Scan
          </h1>
          <p className="text-[#8b949e] mt-2">Scan a resident&apos;s physical QR Card to decrypt their secure medical profile instantly.</p>
        </div>

        {!scanned ? (
          <div className="flex flex-col items-center gap-8">
            
            {/* Simulation Droplist */}
            {localResidents.length > 0 && (
              <div data-animate className="w-full max-w-md bg-[#161b22] border border-[#30363d] rounded-2xl p-4">
                <span className="text-[10px] font-mono text-[#ff8080] tracking-wider uppercase block mb-3 font-bold">
                  Simulated Camera Scanner Dropdown
                </span>
                <select
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-3.5 text-white text-sm outline-none focus:border-[#8b1a1a] transition-all cursor-pointer"
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val) handleSimulateScan(val);
                  }}
                >
                  <option value="">-- Choose Registered Card to Scan --</option>
                  {localResidents.map((r, idx) => (
                    <option key={idx} value={r.encryptedPayload}>
                      {r.name} ({r.barangay})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Scanner Viewport */}
            <div data-animate className="relative w-72 h-72 bg-[#161b22] rounded-3xl border-2 border-dashed border-[#30363d] flex items-center justify-center">
              <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-[#8b1a1a] rounded-tl-lg" />
              <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-[#8b1a1a] rounded-tr-lg" />
              <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-[#8b1a1a] rounded-bl-lg" />
              <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-[#8b1a1a] rounded-br-lg" />
              {/* Scan Bar Animation */}
              <div className="absolute inset-x-6 h-0.5 bg-red-500 opacity-80 animate-pulse" style={{ top: "50%" }} />
              <QrCode className="w-24 h-24 text-[#8b1a1a]/30" />
            </div>

            {/* Manual Search */}
            <div data-animate className="w-full max-w-md">
              <p className="text-center text-[#8b949e] text-sm mb-4">— or search manually —</p>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8b949e]" />
                <input
                  placeholder="Enter Name or Encrypted Payload..."
                  value={manualId}
                  onChange={(e) => setManualId(e.target.value)}
                  className="w-full bg-[#161b22] border border-[#30363d] rounded-xl pl-12 pr-4 py-4 text-white placeholder-[#8b949e] focus:outline-none focus:ring-1 focus:ring-[#8b1a1a]"
                />
              </div>
              <Button fullWidth className="mt-3 bg-[#8b1a1a] hover:bg-[#a01e1e]" onClick={handleSearchManual}>
                <Search className="w-4 h-4" /> Decrypt & Lookup Profile
              </Button>
            </div>
          </div>
        ) : (
          scannedProfile && (
            <div className="max-w-2xl mx-auto space-y-5 animate-fadeIn">
              <div data-animate className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Resident Decrypted Health Profile</h2>
                <Button variant="ghost" size="sm" onClick={() => setScanned(false)}>← New Scan</Button>
              </div>

              {/* Profile Header */}
              <div data-animate className="bg-[#161b22] rounded-2xl p-6 border border-[#30363d] relative">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#8b1a1a] to-[#4a0f0f] flex items-center justify-center text-white text-2xl font-bold">
                      {scannedProfile.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{scannedProfile.name}</h3>
                      <p className="text-[#8b949e] text-sm">Age {scannedProfile.age} • {scannedProfile.barangay}</p>
                      <p className="font-mono text-[9px] text-[#8b949e] mt-1.5 flex items-center gap-1">
                        <Shield className="h-3 w-3 text-emerald-400" />
                        <span>RA 10173 Client-Side Decrypted Payload</span>
                      </p>
                    </div>
                  </div>
                  <Badge variant="medium" className="bg-[#8b1a1a]/20 border border-[#8b1a1a]/30 text-[#ff8080]">
                    Verified
                  </Badge>
                </div>
              </div>

              {/* SAMPLE Medical Details */}
              <div data-animate className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Blood Type */}
                <div className="bg-[#161b22] rounded-xl p-4 border border-[#30363d] flex items-center gap-4">
                  <div className="p-2.5 rounded-lg bg-red-950/40 text-red-400 flex-shrink-0">
                    <Heart className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[#8b949e] uppercase tracking-widest">Blood Type</p>
                    <p className="text-white font-semibold mt-0.5">{scannedProfile.bloodType}</p>
                  </div>
                </div>

                {/* S: Symptoms */}
                <div className="bg-[#161b22] rounded-xl p-4 border border-[#30363d] flex items-center gap-4">
                  <div className="p-2.5 rounded-lg bg-orange-950/40 text-orange-400 flex-shrink-0">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[#8b949e] uppercase tracking-widest">(S) Signs & Symptoms</p>
                    <p className="text-white font-semibold mt-0.5">{scannedProfile.sample.s}</p>
                  </div>
                </div>

                {/* A: Allergies */}
                <div className="bg-[#161b22] rounded-xl p-4 border border-[#30363d] flex items-center gap-4">
                  <div className="p-2.5 rounded-lg bg-yellow-950/40 text-yellow-400 flex-shrink-0">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[#8b949e] uppercase tracking-widest">(A) Allergies</p>
                    <p className="text-white font-semibold mt-0.5">{scannedProfile.sample.a}</p>
                  </div>
                </div>

                {/* M: Medications */}
                <div className="bg-[#161b22] rounded-xl p-4 border border-[#30363d] flex items-center gap-4">
                  <div className="p-2.5 rounded-lg bg-green-950/40 text-green-400 flex-shrink-0">
                    <Pill className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[#8b949e] uppercase tracking-widest">(M) Medications</p>
                    <p className="text-white font-semibold mt-0.5">{scannedProfile.sample.m}</p>
                  </div>
                </div>

                {/* P: Pertinent Past History */}
                <div className="bg-[#161b22] rounded-xl p-4 border border-[#30363d] flex items-center gap-4 md:col-span-2">
                  <div className="p-2.5 rounded-lg bg-blue-950/40 text-blue-400 flex-shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[#8b949e] uppercase tracking-widest">(P) Pertinent Past Hx</p>
                    <p className="text-white font-semibold mt-0.5">{scannedProfile.sample.p}</p>
                  </div>
                </div>

                {/* L: Last Oral Intake */}
                <div className="bg-[#161b22] rounded-xl p-4 border border-[#30363d] flex items-center gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-[#8b949e] uppercase tracking-widest">(L) Last Oral Intake</p>
                    <p className="text-white font-semibold mt-0.5">{scannedProfile.sample.l}</p>
                  </div>
                </div>

                {/* E: Events Leading */}
                <div className="bg-[#161b22] rounded-xl p-4 border border-[#30363d] flex items-center gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-[#8b949e] uppercase tracking-widest">(E) Events Leading to Incident</p>
                    <p className="text-white font-semibold mt-0.5">{scannedProfile.sample.e}</p>
                  </div>
                </div>

              </div>

              {/* Trigger UIR handover Action Button */}
              <div data-animate className="pt-4">
                <button
                  onClick={proceedToUir}
                  className="w-full bg-[#8b1a1a] hover:bg-[#a01e1e] text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg shadow-red-950/30"
                >
                  <span>Initiate Hospital Handover Report (UIR)</span>
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>

            </div>
          )
        )}
      </div>
    </div>
  );
}
