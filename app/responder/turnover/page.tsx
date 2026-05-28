"use client";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { FileText, User, MapPin, Clock, CheckCircle, Printer, Send } from "lucide-react";
import { TopBar } from "../../components/layout/TopBar";
import { FormInput, FormTextarea, FormSelect } from "../../components/ui/FormInput";
import { Button } from "../../components/ui/Button";

export default function TurnoverPage() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-animate]", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.07, ease: "power2.out" });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={ref} className="flex flex-col h-full">
      <TopBar title="Hospital Turnover Report" showSearch={false} />
      <div className="px-8 py-6 flex-1">
        {/* Header */}
        <div data-animate className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Hospital Turnover Report</h1>
            <p className="text-[#8b949e] mt-1">Documentation for medical facility patient hand-off. Incident #INC-2049</p>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" size="sm"><Printer className="w-4 h-4" /> Print</Button>
            <Button size="sm"><Send className="w-4 h-4" /> Submit Report</Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Incident Info */}
          <div data-animate className="bg-[#1a1d23] rounded-2xl p-6 border border-[#2d333b] space-y-4">
            <h3 className="font-bold text-white flex items-center gap-2"><FileText className="w-4 h-4 text-[#8b1a1a]" /> Incident Information</h3>
            <FormInput id="inc-id" label="Incident ID" defaultValue="#INC-2049" readOnly />
            <FormInput id="inc-type" label="Incident Type" defaultValue="Cardiac Arrest" readOnly />
            <div className="grid grid-cols-2 gap-3">
              <FormInput id="response-time" label="Response Time" defaultValue="4 min 12 sec" readOnly />
              <FormInput id="arrival-time" label="Arrival Time" defaultValue="14:26" readOnly />
            </div>
            <div className="flex items-center gap-2 bg-[#0c0f16] rounded-xl p-3 border border-[#2d333b]">
              <MapPin className="w-4 h-4 text-[#8b949e] flex-shrink-0" />
              <span className="text-sm text-white">123 Rizal St., Zone 3, Barangay 45</span>
            </div>
          </div>

          {/* Patient Info */}
          <div data-animate className="bg-[#1a1d23] rounded-2xl p-6 border border-[#2d333b] space-y-4">
            <h3 className="font-bold text-white flex items-center gap-2"><User className="w-4 h-4 text-[#4299e1]" /> Patient Information</h3>
            <FormInput id="p-name" label="Patient Name" defaultValue="Maria Santos" />
            <div className="grid grid-cols-2 gap-3">
              <FormInput id="p-age" label="Age" defaultValue="62" />
              <FormInput id="p-blood" label="Blood Type" defaultValue="O+" />
            </div>
            <FormInput id="p-id" label="Resident ID" defaultValue="RC-001" readOnly />
            <FormTextarea id="p-conditions" label="Known Conditions" defaultValue="Hypertension, Type 2 Diabetes" rows={2} />
          </div>

          {/* Clinical Observations */}
          <div data-animate className="bg-[#1a1d23] rounded-2xl p-6 border border-[#2d333b] space-y-4">
            <h3 className="font-bold text-white flex items-center gap-2"><Clock className="w-4 h-4 text-[#ed8936]" /> Clinical Observations</h3>
            <div className="grid grid-cols-3 gap-3">
              <FormInput id="bp" label="Blood Pressure" placeholder="145/92" />
              <FormInput id="hr" label="Heart Rate" placeholder="92 bpm" />
              <FormInput id="spo2" label="SpO2" placeholder="94%" />
            </div>
            <FormSelect id="gcs" label="GCS Score">
              <option>15 — Normal</option><option>14</option><option>13</option><option>Below 12 — Critical</option>
            </FormSelect>
            <FormSelect id="consciousness" label="Level of Consciousness">
              <option>Alert</option><option>Verbal Response Only</option><option>Pain Response Only</option><option>Unresponsive</option>
            </FormSelect>
            <FormTextarea id="interventions" label="Interventions Performed" placeholder="CPR performed for 3 minutes, AED applied, IV access established..." rows={4} />
          </div>

          {/* Hospital Handoff */}
          <div data-animate className="bg-[#1a1d23] rounded-2xl p-6 border border-[#2d333b] space-y-4">
            <h3 className="font-bold text-white flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[#48bb78]" /> Hospital Hand-off</h3>
            <FormSelect id="hospital" label="Receiving Hospital">
              <option>Tondo General Hospital</option>
              <option>Chinese General Hospital</option>
              <option>University of Santo Tomas Hospital</option>
            </FormSelect>
            <FormInput id="receiving-md" label="Receiving Physician" placeholder="Dr. Santos, MD" />
            <FormInput id="er-bay" label="ER Bay / Unit" placeholder="Bay 4 — Trauma" />
            <FormInput id="handoff-time" type="time" label="Hand-off Time" />
            <FormTextarea id="handoff-notes" label="Handoff Notes" placeholder="Patient stabilized, responsive to verbal stimuli. Monitor for arrhythmia..." rows={4} />

            <div className="flex items-center gap-3 p-4 bg-green-900/10 border border-green-900/30 rounded-xl">
              <CheckCircle className="w-5 h-5 text-[#48bb78] flex-shrink-0" />
              <p className="text-sm text-[#8b949e]">By submitting, I confirm the accuracy of this hand-off report as per RespondaCare protocol.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
