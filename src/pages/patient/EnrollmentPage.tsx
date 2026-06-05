import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Heart, Pill, AlertCircle, Activity, Plus, Save } from "lucide-react";
import { FormInput, FormTextarea, FormSelect } from "../../components/ui/FormInput";
import { Button } from "../../components/ui/Button";

const sections = [
  { icon: <Heart className="w-5 h-5 text-[#e53e3e]" />, title: "Medical History", id: "medical" },
  { icon: <Pill className="w-5 h-5 text-[#48bb78]" />, title: "Medications", id: "meds" },
  { icon: <AlertCircle className="w-5 h-5 text-[#ed8936]" />, title: "Allergies & Conditions", id: "allergies" },
  { icon: <Activity className="w-5 h-5 text-[#4299e1]" />, title: "Vital Signs", id: "vitals" },
];

export default function EnrollmentPage() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-animate]", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.55, stagger: 0.08, ease: "power2.out" });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={ref} className="bg-[#0f1115] min-h-full p-8 text-white">
      <header data-animate className="mb-8">
        <h1 className="text-3xl font-bold text-white">Digital Health Enrollment</h1>
        <p className="text-[#9ca3af] mt-2">Update your complete health profile for emergency use by first responders.</p>
      </header>

      {/* Progress */}
      <div data-animate className="flex items-center gap-3 mb-8">
        {sections.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${i === 0 ? "bg-[#8b1a1a] text-white" : "bg-[#1a1d23] text-[#8b949e]"}`}>
              {s.icon} {s.title}
            </div>
            {i < sections.length - 1 && <div className="w-6 h-px bg-gray-700" />}
          </div>
        ))}
      </div>

      <form className="grid grid-cols-2 gap-6" onSubmit={(e) => e.preventDefault()}>
        {/* Medical History */}
        <div data-animate className="bg-[#1a1d23] rounded-2xl p-6 border border-gray-800 space-y-4">
          <h3 className="font-bold text-white flex items-center gap-2"><Heart className="w-4 h-4 text-[#e53e3e]" /> Medical History</h3>
          <FormSelect id="blood-type" label="Blood Type">
            {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map((b) => <option key={b}>{b}</option>)}
          </FormSelect>
          <FormTextarea id="chronic" label="Chronic Conditions" placeholder="e.g., Type 1 Diabetes, Hypertension..." rows={3} />
          <FormTextarea id="surgeries" label="Past Surgeries / Hospitalizations" placeholder="e.g., Appendectomy 2019..." rows={3} />
          <FormSelect id="smoke" label="Smoking Status">
            <option>Non-smoker</option><option>Former smoker</option><option>Current smoker</option>
          </FormSelect>
        </div>

        {/* Allergies */}
        <div data-animate className="bg-[#1a1d23] rounded-2xl p-6 border border-gray-800 space-y-4">
          <h3 className="font-bold text-white flex items-center gap-2"><AlertCircle className="w-4 h-4 text-[#ed8936]" /> Allergies & Sensitivities</h3>
          <FormTextarea id="drug-allergy" label="Drug Allergies" placeholder="e.g., Penicillin, NSAIDs..." rows={3} />
          <FormTextarea id="food-allergy" label="Food Allergies" placeholder="e.g., Peanuts, Shellfish..." rows={3} />
          <FormTextarea id="env-allergy" label="Environmental Allergies" placeholder="e.g., Pollen, Dust mites..." rows={2} />
        </div>

        {/* Medications */}
        <div data-animate className="bg-[#1a1d23] rounded-2xl p-6 border border-gray-800 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-white flex items-center gap-2"><Pill className="w-4 h-4 text-[#48bb78]" /> Current Medications</h3>
            <Button variant="ghost" size="sm"><Plus className="w-4 h-4" /> Add</Button>
          </div>
          {[
            { name: "Humalog KwikPen", dose: "As needed based on BG levels", freq: "As needed" },
            { name: "Lisinopril",       dose: "10mg Tablet",                   freq: "Once daily" },
          ].map((med) => (
            <div key={med.name} className="p-4 bg-[#0f1115] rounded-xl border border-gray-800 flex items-center justify-between">
              <div>
                <p className="font-bold text-white text-sm">{med.name}</p>
                <p className="text-xs text-[#9ca3af]">{med.dose} — {med.freq}</p>
              </div>
              <span className="text-[10px] bg-green-900/20 text-green-400 border border-green-900/30 px-2 py-0.5 rounded font-bold uppercase">Active</span>
            </div>
          ))}
          <FormInput id="new-med" placeholder="Add medication name..." />
        </div>

        {/* Vitals */}
        <div data-animate className="bg-[#1a1d23] rounded-2xl p-6 border border-gray-800 space-y-4">
          <h3 className="font-bold text-white flex items-center gap-2"><Activity className="w-4 h-4 text-[#4299e1]" /> Vital Signs (Last Recorded)</h3>
          <div className="grid grid-cols-2 gap-3">
            <FormInput id="bp" label="Blood Pressure" placeholder="120/80 mmHg" />
            <FormInput id="hr" label="Heart Rate" placeholder="72 bpm" />
            <FormInput id="weight" label="Weight (kg)" placeholder="70" />
            <FormInput id="height" label="Height (cm)" placeholder="165" />
          </div>
          <FormInput id="bg-level" label="Blood Glucose (if applicable)" placeholder="5.6 mmol/L" />
          <FormTextarea id="notes" label="Additional Notes for Responders" placeholder="Any critical information first responders should know..." rows={3} />
        </div>

        {/* Save */}
        <div data-animate className="col-span-2 flex justify-end gap-3">
          <Button variant="ghost">Cancel</Button>
          <Button size="lg"><Save className="w-5 h-5" /> Save Enrollment Data</Button>
        </div>
      </form>
    </div>
  );
}
