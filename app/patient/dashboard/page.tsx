"use client";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Download, Plus, AlertTriangle, Pill } from "lucide-react";
import Link from "next/link";
import { Button } from "../../components/ui/Button";

export default function PatientDashboardPage() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-animate]", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.55, stagger: 0.08, ease: "power2.out" });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={ref} className="bg-[#0f1115] min-h-full">
      {/* Top Header */}
      <header className="p-8 flex justify-between items-start" data-animate>
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Welcome back, Alex</h1>
          <p className="text-[#9ca3af] text-sm">Your health overview and emergency tools are ready.</p>
        </div>
        <div className="flex items-center gap-3 bg-[#1a1d23] px-4 py-2 rounded-full border border-gray-800">
          <div className="text-right">
            <p className="text-sm font-bold text-white leading-tight">Alex Johnson</p>
            <p className="text-[10px] text-[#9ca3af] uppercase font-semibold">ID: RC-8829-X</p>
          </div>
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8b1a1a] to-[#4a0f0f] flex items-center justify-center text-white font-bold border-2 border-[#8b1a1a]">
              A
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#0f1115] rounded-full" />
          </div>
        </div>
      </header>

      <div className="px-8 pb-8 flex gap-8">
        {/* Main Column */}
        <div className="flex-grow space-y-8 max-w-4xl">
          {/* Emergency Card */}
          <section data-animate className="bg-[#1a1d23] p-8 rounded-3xl border border-gray-800 relative overflow-hidden flex justify-between items-center">
            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-white mb-2">Need immediate help?</h2>
              <p className="text-[#9ca3af] text-sm max-w-md">Report an emergency to alert your primary care team and emergency contacts instantly.</p>
            </div>
            <Link href="/patient/emergency" className="relative z-10 flex items-center gap-4 bg-[#8b1a1a] hover:bg-[#a01e1e] transition-colors px-6 py-4 rounded-2xl shadow-xl shadow-red-900/20 group pulse-glow">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
              </div>
              <span className="text-white font-black text-xl uppercase tracking-wider">Emergency<br/>Reporting</span>
            </Link>
            <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-[#8b1a1a]/10 rounded-full blur-3xl" />
          </section>

          {/* Health Profile */}
          <section data-animate className="bg-[#1a1d23] p-8 rounded-3xl border border-gray-800">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold text-white">Health Profile</h2>
              <Link href="/patient/enrollment" className="text-[#8b1a1a] text-sm font-semibold hover:underline">Edit Profile</Link>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { label: "Blood Type",         value: "O-Positive" },
                { label: "Allergies",          value: "Penicillin, Peanuts" },
                { label: "Chronic Conditions", value: "Type 1 Diabetes" },
              ].map((s) => (
                <div key={s.label} className="bg-gray-800/30 p-5 rounded-2xl border border-gray-700/50">
                  <p className="text-[10px] font-bold text-[#9ca3af] tracking-widest uppercase mb-1">{s.label}</p>
                  <p className="text-xl font-bold text-white leading-tight">{s.value}</p>
                </div>
              ))}
            </div>

            {/* Medications */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Pill className="h-4 w-4 text-[#8b1a1a]" />
                <p className="text-[10px] font-bold text-[#8b1a1a] tracking-widest uppercase">Active Medications</p>
              </div>
              <div className="space-y-3">
                {[
                  { name: "Humalog KwikPen", dose: "As needed based on BG levels" },
                  { name: "Lisinopril",       dose: "10mg Tablet - Once daily" },
                ].map((med) => (
                  <div key={med.name} className="flex items-center justify-between p-4 bg-[#0f1115]/40 rounded-2xl border border-gray-800">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#8b1a1a]/20 rounded-full flex items-center justify-center">
                        <Pill className="h-6 w-6 text-[#8b1a1a] rotate-45" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white">{med.name}</h3>
                        <p className="text-xs text-[#9ca3af]">{med.dose}</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-green-500/10 text-green-500 text-[10px] font-bold uppercase rounded-full border border-green-500/20">Daily</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Right Column */}
        <div className="w-80 space-y-8 flex-shrink-0">
          {/* Digital QR ID */}
          <section data-animate className="bg-[#1a1d23] p-6 rounded-3xl border border-gray-800">
            <p className="text-[10px] font-bold text-[#9ca3af] tracking-widest uppercase mb-4">Digital QR ID Card</p>
            <div className="relative bg-[#0f1115] p-4 rounded-2xl border border-dashed border-gray-700 flex flex-col items-center mb-6">
              <div className="w-full bg-white rounded-xl p-4 flex flex-col items-center">
                <div className="w-full bg-teal-600/60 h-40 rounded-lg mb-3 relative flex items-center justify-center">
                  {/* QR placeholder */}
                  <div className="bg-white p-3 rounded-md shadow-lg w-28">
                    <div className="grid grid-cols-7 gap-0.5">
                      {Array.from({ length: 49 }).map((_, i) => {
                        // Deterministic QR-like pattern based on position
                        const deterministic = ((i * 7 + i % 3 + Math.floor(i / 7)) % 2 === 0);
                        return <div key={i} className={`w-3 h-3 ${deterministic ? "bg-black" : "bg-white"}`} />;
                      })}
                    </div>
                  </div>
                </div>
                <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Verify Secure ID: RC-8829-X</p>
              </div>
            </div>
            <div className="space-y-3">
              <Button variant="primary" fullWidth><Download className="h-5 w-5" /> Download PDF ID</Button>
              <Link href="/patient/enrollment">
                <Button variant="secondary" fullWidth className="mt-0"><Plus className="h-5 w-5" /> Digital Enrollment</Button>
              </Link>
            </div>
          </section>

          {/* Emergency Contacts */}
          <section data-animate className="bg-[#1a1d23] p-6 rounded-3xl border border-gray-800">
            <p className="text-[10px] font-bold text-[#9ca3af] tracking-widest uppercase mb-6">Emergency Contacts</p>
            <div className="space-y-5">
              {[
                { name: "Sarah Johnson",   rel: "Spouse",     phone: "(555) 012-3456" },
                { name: "Dr. Michael Chen", rel: "Primary MD", phone: "(555) 987-6543" },
              ].map((c) => (
                <div key={c.name} className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white">
                    {c.name[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{c.name}</h4>
                    <p className="text-[11px] text-[#9ca3af]">{c.rel} • {c.phone}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
