"use client";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Phone, AlertTriangle, MapPin, Camera } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { FormTextarea, FormSelect } from "../../components/ui/FormInput";
import Link from "next/link";

const incidentTypes = ["Cardiac Emergency", "Vehicular Accident", "Fire", "Flood", "Violence / Crime", "Medical Condition", "Other"];

export default function EmergencyPage() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-animate]", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.55, stagger: 0.08, ease: "power2.out" });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={ref} className="bg-[#0f1115] min-h-full p-8">
      {/* Header */}
      <div data-animate className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-[#e53e3e] rounded-2xl flex items-center justify-center shadow-lg shadow-red-900/30 pulse-glow">
          <AlertTriangle className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Emergency Reporting</h1>
          <p className="text-[#9ca3af] text-sm mt-1">Your alert will be sent immediately to emergency responders and your contacts.</p>
        </div>
      </div>

      {/* Quick Call Banner */}
      <div data-animate className="bg-[#e53e3e]/10 border border-[#e53e3e]/30 rounded-2xl p-5 flex items-center justify-between mb-8">
        <div>
          <p className="text-white font-bold">Life-threatening emergency?</p>
          <p className="text-[#9ca3af] text-sm">Call emergency hotline immediately</p>
        </div>
        <a href="tel:911" className="flex items-center gap-2 bg-[#e53e3e] hover:bg-red-500 text-white font-bold px-6 py-3 rounded-xl transition-colors">
          <Phone className="w-5 h-5" /> Call 911
        </a>
      </div>

      <div className="grid grid-cols-3 gap-8">
        {/* Form */}
        <div className="col-span-2 space-y-5">
          <div data-animate className="bg-[#1a1d23] rounded-2xl p-6 border border-gray-800">
            <h3 className="font-bold text-white mb-5">Incident Details</h3>
            <div className="space-y-4">
              <FormSelect id="inc-type" label="Type of Emergency">
                <option value="">Select emergency type...</option>
                {incidentTypes.map((t) => <option key={t}>{t}</option>)}
              </FormSelect>
              <FormTextarea id="inc-desc" label="Description" placeholder="Briefly describe what is happening..." rows={4} />
              <div>
                <label className="block text-sm font-semibold text-white mb-2">Location</label>
                <div className="flex gap-3">
                  <div className="flex-1 bg-[#1c2128] border border-[#30363d] rounded-lg px-4 py-3 flex items-center gap-3 text-white text-sm">
                    <MapPin className="w-4 h-4 text-[#8b949e]" />
                    <span>123 Rizal St., Zone 3, Barangay 45</span>
                  </div>
                  <Button variant="secondary" size="sm">
                    <MapPin className="w-4 h-4" /> Update
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Photo upload */}
          <div data-animate className="bg-[#1a1d23] rounded-2xl p-6 border border-gray-800">
            <h3 className="font-bold text-white mb-4">Attach Photo/Video (Optional)</h3>
            <div className="border-2 border-dashed border-gray-700 rounded-xl p-8 flex flex-col items-center gap-3 text-center hover:border-[#8b1a1a] transition-colors cursor-pointer">
              <Camera className="w-10 h-10 text-[#8b949e]" />
              <p className="text-[#9ca3af] text-sm">Drag & drop or click to upload</p>
              <p className="text-xs text-gray-600">JPG, PNG, MP4 — Max 10MB</p>
            </div>
          </div>

          <div data-animate>
            <Button variant="danger" fullWidth size="lg" className="pulse-glow">
              <AlertTriangle className="w-5 h-5" />
              Submit Emergency Report
            </Button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <div data-animate className="bg-[#1a1d23] rounded-2xl p-6 border border-gray-800">
            <p className="text-[10px] font-bold text-[#9ca3af] tracking-widest uppercase mb-4">Your Emergency Contacts</p>
            <div className="space-y-4">
              {[
                { name: "Sarah Johnson",    role: "Spouse",     phone: "(555) 012-3456" },
                { name: "Dr. Michael Chen", role: "Primary MD", phone: "(555) 987-6543" },
              ].map((c) => (
                <div key={c.name} className="flex items-center gap-3 p-3 bg-[#0f1115] rounded-xl border border-gray-800">
                  <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                    {c.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm truncate">{c.name}</p>
                    <p className="text-[11px] text-[#9ca3af]">{c.role}</p>
                  </div>
                  <a href={`tel:${c.phone}`} className="p-2 bg-[#8b1a1a]/20 rounded-lg text-[#8b1a1a] hover:bg-[#8b1a1a]/40 transition-colors">
                    <Phone className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          </div>
          <div data-animate className="bg-[#1a1d23] rounded-2xl p-6 border border-gray-800">
            <p className="text-[10px] font-bold text-[#9ca3af] tracking-widest uppercase mb-4">Nearest Emergency Services</p>
            <div className="space-y-3 text-sm text-gray-300">
              {[
                { name: "Tondo General Hospital",        dist: "0.8 km" },
                { name: "Philippine Red Cross Station",   dist: "1.2 km" },
                { name: "Barangay 45 Health Center",      dist: "0.3 km" },
              ].map((s) => (
                <div key={s.name} className="flex justify-between">
                  <span>{s.name}</span>
                  <span className="text-[#8b949e]">{s.dist}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
