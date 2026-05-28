"use client";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { QrCode, Search, User, AlertCircle, Pill, Heart } from "lucide-react";
import { TopBar } from "../../components/layout/TopBar";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";

const mockProfile = {
  id: "RC-8829-X", name: "Alex Johnson", age: 34, bloodType: "O+", zone: "Zone 3",
  conditions: "Type 1 Diabetes", allergies: "Penicillin, Peanuts",
  medications: ["Humalog KwikPen", "Lisinopril 10mg"],
  emergency: [{ name: "Sarah Johnson", rel: "Spouse", phone: "(555) 012-3456" }],
  risk: "Medium",
};

export default function QRScanPage() {
  const ref = useRef<HTMLDivElement>(null);
  const [scanned, setScanned] = useState(false);
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-animate]", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.07, ease: "power2.out" });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={ref} className="flex flex-col h-full">
      <TopBar title="QR Scan & Profile" showSearch={false} />
      <div className="px-8 py-6 flex-1">
        <div data-animate className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white">Resident QR Scan</h1>
          <p className="text-[#8b949e] mt-2">Scan a resident&apos;s QR code to access their emergency health profile instantly.</p>
        </div>

        {!scanned ? (
          <div className="flex flex-col items-center gap-8">
            {/* Scanner Viewport */}
            <div data-animate className="relative w-72 h-72 bg-[#1a1d23] rounded-3xl border-2 border-dashed border-[#8b1a1a] flex items-center justify-center">
              <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-[#8b1a1a] rounded-tl-lg" />
              <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-[#8b1a1a] rounded-tr-lg" />
              <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-[#8b1a1a] rounded-bl-lg" />
              <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-[#8b1a1a] rounded-br-lg" />
              {/* Animated scan line */}
              <div className="absolute inset-x-6 h-0.5 bg-[#e53e3e] opacity-80 animate-bounce" style={{ top: "50%" }} />
              <QrCode className="w-24 h-24 text-[#8b1a1a]/50" />
            </div>

            {/* Manual Search */}
            <div data-animate className="w-full max-w-md">
              <p className="text-center text-[#8b949e] text-sm mb-4">— or search manually —</p>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8b949e]" />
                <input
                  placeholder="Enter Resident ID (e.g. RC-8829-X)"
                  className="w-full bg-[#1a1d23] border border-[#2d333b] rounded-xl pl-12 pr-4 py-4 text-white placeholder-[#8b949e] focus:outline-none focus:ring-1 focus:ring-[#8b1a1a]"
                />
              </div>
              <Button fullWidth className="mt-3" onClick={() => setScanned(true)}>
                <Search className="w-4 h-4" /> Lookup Resident
              </Button>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-5">
            <div data-animate className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Resident Profile Found</h2>
              <Button variant="ghost" size="sm" onClick={() => setScanned(false)}>← New Scan</Button>
            </div>

            {/* Profile Header */}
            <div data-animate className="bg-[#1a1d23] rounded-2xl p-6 border border-[#2d333b]">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#8b1a1a] to-[#4a0f0f] flex items-center justify-center text-white text-2xl font-bold">
                    A
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{mockProfile.name}</h3>
                    <p className="text-[#8b949e] text-sm">Age {mockProfile.age} • {mockProfile.zone}</p>
                    <p className="font-mono text-xs text-gray-600 mt-1">{mockProfile.id}</p>
                  </div>
                </div>
                <Badge variant={mockProfile.risk.toLowerCase() as "medium"}>{mockProfile.risk} Risk</Badge>
              </div>
            </div>

            {/* Critical Info */}
            {[
              { icon: <Heart className="w-5 h-5 text-[#e53e3e]" />, bg: "bg-red-900/20", label: "Blood Type", value: mockProfile.bloodType },
              { icon: <AlertCircle className="w-5 h-5 text-[#ed8936]" />, bg: "bg-orange-900/20", label: "Allergies", value: mockProfile.allergies },
              { icon: <Pill className="w-5 h-5 text-[#48bb78]" />, bg: "bg-green-900/20", label: "Active Medications", value: mockProfile.medications.join(", ") },
              { icon: <User className="w-5 h-5 text-[#4299e1]" />, bg: "bg-blue-900/20", label: "Conditions", value: mockProfile.conditions },
            ].map((item) => (
              <div key={item.label} data-animate className="bg-[#1a1d23] rounded-xl p-4 border border-[#2d333b] flex items-center gap-4">
                <div className={`p-2.5 rounded-lg ${item.bg} flex-shrink-0`}>{item.icon}</div>
                <div>
                  <p className="text-xs font-bold text-[#8b949e] uppercase tracking-widest">{item.label}</p>
                  <p className="text-white font-semibold mt-0.5">{item.value}</p>
                </div>
              </div>
            ))}

            {/* Emergency Contact */}
            <div data-animate className="bg-[#1a1d23] rounded-xl p-4 border border-[#2d333b]">
              <p className="text-xs font-bold text-[#8b949e] uppercase tracking-widest mb-3">Emergency Contact</p>
              {mockProfile.emergency.map((c) => (
                <div key={c.name} className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-semibold">{c.name}</p>
                    <p className="text-sm text-[#8b949e]">{c.rel} — {c.phone}</p>
                  </div>
                  <a href={`tel:${c.phone}`}><Button size="sm"><QrCode className="w-4 h-4" /> Call</Button></a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
