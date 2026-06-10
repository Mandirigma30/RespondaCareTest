import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { Heart, Pill, AlertCircle, Activity, Plus, Save, Loader2, CheckCircle2, LogOut, Pencil } from "lucide-react";
import { FormInput, FormTextarea, FormSelect } from "../../components/ui/FormInput";
import { Button } from "../../components/ui/Button";
import { encryptPayload } from "../../lib/cryptoUtils";
import { supabase, isPlaceholderUrl } from "../../lib/supabase";
import { useNavigate } from "react-router-dom";

const sections = [
  { icon: <Heart className="w-5 h-5 text-[#e53e3e]" />, title: "Medical History", id: "medical" },
  { icon: <Pill className="w-5 h-5 text-[#48bb78]" />, title: "Medications", id: "meds" },
  { icon: <AlertCircle className="w-5 h-5 text-[#ed8936]" />, title: "Allergies & Conditions", id: "allergies" },
  { icon: <Activity className="w-5 h-5 text-[#4299e1]" />, title: "Vital Signs", id: "vitals" },
];

export default function EnrollmentPage() {
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Profile Dropdown state & info
  const [patientName, setPatientName] = useState("Guest");
  const [patientId, setPatientId] = useState("RC-8829-X");
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const session = localStorage.getItem("respondaCare_session");
    if (session) {
      try {
        const parsed = JSON.parse(session);
        if (parsed.name) setPatientName(parsed.name);
        if (parsed.auth_uid) {
          setPatientId("RC-" + parsed.auth_uid.substring(0, 6).toUpperCase());
        }
      } catch (e) {}
    }
  }, []);

  // Form States
  const [bloodType, setBloodType] = useState("O+");
  const [chronic, setChronic] = useState("");
  const [surgeries, setSurgeries] = useState("");
  const [smoke, setSmoke] = useState("Non-smoker");
  const [drugAllergy, setDrugAllergy] = useState("");
  const [foodAllergy, setFoodAllergy] = useState("");
  const [envAllergy, setEnvAllergy] = useState("");
  
  // Medications State
  const [medications, setMedications] = useState<Array<{ name: string; dose: string; freq: string }>>([
    { name: "Humalog KwikPen", dose: "As needed based on BG levels", freq: "As needed" },
    { name: "Lisinopril", dose: "10mg Tablet", freq: "Once daily" },
  ]);
  const [newMedName, setNewMedName] = useState("");
  const [newMedDose, setNewMedDose] = useState("");
  const [newMedFreq, setNewMedFreq] = useState("");

  // Vitals State
  const [bp, setBp] = useState("");
  const [hr, setHr] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [bgLevel, setBgLevel] = useState("");
  const [notes, setNotes] = useState("");

  // UI States
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-animate]", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.55, stagger: 0.08, ease: "power2.out" });
    }, ref);
    return () => ctx.revert();
  }, []);

  // Load profile from Supabase first, fallback to local cache
  useEffect(() => {
    const loadProfile = async () => {
      let encryptedPayload = "";

      // 1. Try fetching from Supabase first
      const { data: sessionData } = await supabase.auth.getSession();
      const authUser = sessionData?.session?.user;
      if (authUser) {
        const { data: resData } = await supabase
          .schema("core")
          .from("residents")
          .select("encrypted_payload")
          .eq("user_id", authUser.id)
          .maybeSingle();
        if (resData?.encrypted_payload) {
          encryptedPayload = resData.encrypted_payload;
        }
      }

      // 2. Fall back to local storage
      if (!encryptedPayload) {
        const session = localStorage.getItem("respondaCare_session");
        if (session) {
          try {
            const parsedSession = JSON.parse(session);
            const residents = localStorage.getItem("respondaCare_residents");
            if (residents) {
              const list = JSON.parse(residents);
              const found = list.find((r: any) => r.name.toLowerCase() === parsedSession.name?.toLowerCase());
              if (found && found.encryptedPayload) {
                encryptedPayload = found.encryptedPayload;
              }
            }
          } catch (e) {}
        }
      }

      // 3. Decrypt and set state
      if (encryptedPayload) {
        import("../../lib/cryptoUtils").then(async ({ decryptPayload }) => {
          try {
            const decrypted = (await decryptPayload(encryptedPayload, "barangay45key")) as any;
            if (decrypted) {
              setBloodType(decrypted.bloodType || "O+");
              setChronic(decrypted.chronic || "");
              setSurgeries(decrypted.surgeries || "");
              setSmoke(decrypted.smoke || "Non-smoker");
              setDrugAllergy(decrypted.allergies?.drug || "");
              setFoodAllergy(decrypted.allergies?.food || "");
              setEnvAllergy(decrypted.allergies?.environmental || "");
              if (decrypted.medications) setMedications(decrypted.medications);
              setBp(decrypted.vitals?.bp || "");
              setHr(decrypted.vitals?.hr || "");
              setWeight(decrypted.vitals?.weight || "");
              setHeight(decrypted.vitals?.height || "");
              setBgLevel(decrypted.vitals?.bgLevel || "");
              setNotes(decrypted.notes || "");
            }
          } catch (e) {
            console.error("Failed to decrypt cached profile", e);
          }
        });
      }
    };
    loadProfile();
  }, []);

  const handleAddMedication = () => {
    if (!newMedName.trim()) return;
    setMedications([
      ...medications,
      {
        name: newMedName.trim(),
        dose: newMedDose.trim() || "N/A",
        freq: newMedFreq.trim() || "N/A"
      }
    ]);
    setNewMedName("");
    setNewMedDose("");
    setNewMedFreq("");
  };

  const handleRemoveMedication = (idx: number) => {
    setMedications(medications.filter((_, i) => i !== idx));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const session = localStorage.getItem("respondaCare_session");
      if (!session) throw new Error("No active authenticated session found.");
      
      const parsedSession = JSON.parse(session);
      const patientName = parsedSession.name || "Alex Johnson";

      const payload = {
        name: patientName,
        age: 34, // Default age fallback
        gender: "Male",
        barangay: "Brgy. 45, Pasay City",
        bloodType,
        chronic,
        surgeries,
        smoke,
        allergies: {
          drug: drugAllergy,
          food: foodAllergy,
          environmental: envAllergy,
        },
        medications,
        vitals: {
          bp,
          hr,
          weight,
          height,
          bgLevel,
        },
        notes,
        // Match the legacy structure required by QR scanner scan view
        sample: {
          s: chronic || "None on record",
          a: [drugAllergy, foodAllergy].filter(Boolean).join(", ") || "None",
          m: medications.map(m => `${m.name} (${m.dose})`).join(", ") || "None",
          p: surgeries || "None",
          l: "N/A",
          e: notes || "N/A"
        }
      };

      // Encrypt client-side via WebCrypto using password salt "barangay45key"
      const encrypted = await encryptPayload(payload, "barangay45key");

      // Save to localStorage under respondaCare_residents
      const cached = localStorage.getItem("respondaCare_residents") || "[]";
      const list = JSON.parse(cached);
      const existing = list.find((r: any) => r.name.toLowerCase() === patientName.toLowerCase());
      
      const record = {
        id: existing?.id || `RC-${Math.floor(1000 + Math.random() * 9000)}`,
        name: patientName,
        barangay: "Brgy. 45, Pasay City",
        encryptedPayload: encrypted,
        dob: existing?.dob || "1992-04-12",
        gender: existing?.gender || "Male",
        contact: existing?.contact || "+63 917 123 4567",
        address: existing?.address || "Zone 3, Barangay 45, Pasay City",
        bloodType: bloodType,
        vulnerability: chronic ? "High" : "Low",
        lastUpdated: new Date().toISOString().slice(0, 10),
      };
      
      const existingIdx = list.findIndex((r: any) => r.name.toLowerCase() === patientName.toLowerCase());
      if (existingIdx > -1) {
        list[existingIdx] = record;
      } else {
        list.push(record);
      }
      localStorage.setItem("respondaCare_residents", JSON.stringify(list));

      // Save to local audit logs
      const localLogs = JSON.parse(localStorage.getItem("respondaCare_auditLogs") || "[]");
      localLogs.unshift({
        ts: new Date().toISOString().slice(0, 10),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        user: patientName,
        role: "patient",
        action: `Resident updated own encrypted medical profile`,
        resource: "health.records",
        ip: "127.0.0.1",
        dotColor: "bg-orange-400"
      });
      localStorage.setItem("respondaCare_auditLogs", JSON.stringify(localLogs));

      // Sync to live Supabase if available
      if (!isPlaceholderUrl) {
        const { data: sessionData } = await supabase.auth.getSession();
        const authUser = sessionData?.session?.user;
        if (authUser) {
          // Find resident_id in core.residents
          const { data: resData } = await supabase
            .schema("core")
            .from("residents")
            .select("resident_id")
            .eq("user_id", authUser.id)
            .maybeSingle();

          let residentId = resData?.resident_id;

          if (!residentId) {
            // Insert a new resident row if none exists
            const { data: newRes, error: insErr } = await supabase
              .schema("core")
              .from("residents")
              .insert({
                user_id: authUser.id,
                barangay_id: 1, // Default to first barangay
                address: "Zone 3, Barangay 45, Pasay City",
                date_of_birth: "1992-04-12",
                gender: "Male",
                consent_given: true,
                consent_granted: true,
                encrypted_payload: encrypted
              })
              .select("resident_id")
              .single();
            
            if (insErr) throw insErr;
            residentId = newRes?.resident_id;
          } else {
            // Update encrypted payload in core.residents
            const { error: updErr } = await supabase
              .schema("core")
              .from("residents")
              .update({ encrypted_payload: encrypted })
              .eq("resident_id", residentId);
            if (updErr) throw updErr;
          }

          if (residentId) {
            // Also insert a log record in health.records
            const { error: recErr } = await supabase
              .schema("health")
              .from("records")
              .insert({
                resident_id: residentId,
                encrypted_vitals: encrypted,
                record_type: "updated",
              });
            if (recErr) throw recErr;

            // Sync to health.profiles
            const allergiesCombined = [drugAllergy, foodAllergy, envAllergy].filter(Boolean).join(", ");
            const medicationsCombined = medications.map(m => `${m.name} (${m.dose} - ${m.freq})`).join(", ");
            const { error: profErr } = await supabase
              .schema("health")
              .from("profiles")
              .upsert({
                resident_id: residentId,
                blood_type: bloodType,
                allergies: allergiesCombined || "None",
                medications: medicationsCombined || "None",
                past_medical_hx: surgeries || "None",
              }, { onConflict: 'resident_id' });
            if (profErr) console.warn("Failed to update health.profiles:", profErr);

            // Sync to health.allergy_flags (clean existing first)
            await supabase.schema("health").from("allergy_flags").delete().eq("resident_id", residentId);
            const allergens = [
              { name: drugAllergy, type: 'drug' },
              { name: foodAllergy, type: 'food' },
              { name: envAllergy, type: 'environmental' }
            ].filter(a => a.name && a.name.trim());

            for (const item of allergens) {
              const { error: algErr } = await supabase
                .schema("health")
                .from("allergy_flags")
                .insert({
                  resident_id: residentId,
                  allergen_name: item.name.trim(),
                  severity: 'moderate',
                });
              if (algErr) console.warn("Failed to insert allergy flag:", algErr);
            }

            // Sync to health.medications (clean existing first)
            await supabase.schema("health").from("medications").delete().eq("resident_id", residentId);
            for (const med of medications) {
              if (med.name && med.name.trim()) {
                const { error: medErr } = await supabase
                  .schema("health")
                  .from("medications")
                  .insert({
                    resident_id: residentId,
                    drug_name: med.name.trim(),
                    dosage: med.dose || "N/A",
                    frequency: med.freq || "N/A",
                    is_active: true
                  });
                if (medErr) console.warn("Failed to insert medication:", medErr);
              }
            }

            // Log administrative action in audit logs
            const { error: auditErr } = await supabase
              .schema("security")
              .from("audit_log")
              .insert({
                action: "UPDATE_HEALTH_RECORD",
                target_table: "health.records",
                target_id: residentId,
                details: { info: "Resident updated own encrypted medical profile" }
              });
            if (auditErr) console.warn("Failed to write audit log:", auditErr);
          }
        }
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save and encrypt enrollment data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={ref} className="bg-[#0f1115] min-h-full p-8 text-white">
      <header data-animate className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-50">
        <div>
          <h1 className="text-3xl font-bold text-white">Digital Health Enrollment</h1>
          <p className="text-[#9ca3af] mt-2">Update your complete health profile for emergency use by first responders.</p>
        </div>

        {/* Profile Dropdown */}
        <div className="flex items-center gap-3 relative">
          <div 
            className="relative"
            onMouseEnter={() => setShowDropdown(true)}
            onMouseLeave={() => setShowDropdown(false)}
          >
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-3 bg-[#1a1d23] hover:bg-[#252930] px-4 py-2 rounded-full border border-gray-800 transition-colors cursor-pointer text-left focus:outline-none"
            >
              <div className="text-right">
                <p className="text-sm font-bold text-white leading-tight">{patientName || "Guest"}</p>
                <p className="text-[10px] text-[#9ca3af] uppercase font-semibold">ID: {patientId}</p>
              </div>
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8b1a1a] to-[#4a0f0f] flex items-center justify-center text-white font-bold border-2 border-[#8b1a1a]">
                  {(patientName || "G").charAt(0).toUpperCase()}
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#0f1115] rounded-full animate-pulse" />
              </div>
            </button>

            {showDropdown && (
              <div className="absolute right-0 top-full pt-2 w-48 z-50 text-white text-xs">
                <div className="bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl overflow-hidden">
                  <div className="p-3 border-b border-[#30363d]">
                    <p className="font-bold text-white truncate">{patientName || "Guest"}</p>
                    <p className="text-[10px] text-[#8b949e] uppercase font-semibold mt-0.5">Resident</p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        navigate("/patient/dashboard?edit=true");
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white hover:bg-[#1a1d23] text-left cursor-pointer transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                      <span>Edit Personal Info</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        localStorage.removeItem("respondaCare_session");
                        navigate("/");
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-[#1a1d23] text-left border-t border-[#30363d] cursor-pointer transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Progress / Sections */}
      <div data-animate className="flex flex-wrap items-center gap-3 mb-8">
        {sections.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActiveSectionIdx(i)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
              activeSectionIdx === i ? "bg-[#8b1a1a] text-white" : "bg-[#1a1d23] text-[#8b949e] hover:text-white"
            }`}
          >
            {s.icon} {s.title}
          </button>
        ))}
      </div>

      {error && (
        <div data-animate className="mb-6 p-4 rounded-lg bg-red-950/45 border border-red-500/30 text-sm text-red-300 font-mono">
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div data-animate className="mb-6 p-4 rounded-lg bg-emerald-950/45 border border-emerald-500/30 text-sm text-emerald-300 font-mono flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          <span>Profile encrypted (AES-256-GCM) and synchronized successfully.</span>
        </div>
      )}

      <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={handleSave}>
        {/* Medical History */}
        {activeSectionIdx === 0 && (
          <div data-animate className="bg-[#1a1d23] rounded-2xl p-6 border border-gray-800 space-y-4 md:col-span-2">
            <h3 className="font-bold text-white flex items-center gap-2"><Heart className="w-4 h-4 text-[#e53e3e]" /> Medical History</h3>
            <FormSelect id="blood-type" label="Blood Type" value={bloodType} onChange={(e) => setBloodType(e.target.value)}>
              {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map((b) => <option key={b}>{b}</option>)}
            </FormSelect>
            <FormTextarea id="chronic" label="Chronic Conditions" placeholder="e.g., Type 1 Diabetes, Hypertension..." value={chronic} onChange={(e) => setChronic(e.target.value)} rows={3} />
            <FormTextarea id="surgeries" label="Past Surgeries / Hospitalizations" placeholder="e.g., Appendectomy 2019..." value={surgeries} onChange={(e) => setSurgeries(e.target.value)} rows={3} />
            <FormSelect id="smoke" label="Smoking Status" value={smoke} onChange={(e) => setSmoke(e.target.value)}>
              <option>Non-smoker</option><option>Former smoker</option><option>Current smoker</option>
            </FormSelect>
          </div>
        )}

        {/* Medications */}
        {activeSectionIdx === 1 && (
          <div data-animate className="bg-[#1a1d23] rounded-2xl p-6 border border-gray-800 space-y-4 md:col-span-2">
            <h3 className="font-bold text-white flex items-center gap-2 mb-2"><Pill className="w-4 h-4 text-[#48bb78]" /> Current Medications</h3>
            
            <div className="space-y-3">
              {medications.map((med, idx) => (
                <div key={idx} className="p-4 bg-[#0f1115] rounded-xl border border-gray-800 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-white text-sm">{med.name}</p>
                    <p className="text-xs text-[#9ca3af]">{med.dose} — {med.freq}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] bg-green-900/20 text-green-400 border border-green-900/30 px-2 py-0.5 rounded font-bold uppercase">Active</span>
                    <button type="button" onClick={() => handleRemoveMedication(idx)} className="text-xs text-red-500 hover:text-red-400 font-bold">Remove</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-[#0f1115] rounded-xl border border-gray-800 space-y-3">
              <p className="text-xs font-bold text-gray-400">Add New Medication</p>
              <div className="grid grid-cols-3 gap-3">
                <FormInput id="new-med-name" placeholder="Medication Name (e.g. Lisinopril)" value={newMedName} onChange={(e) => setNewMedName(e.target.value)} />
                <FormInput id="new-med-dose" placeholder="Dosage (e.g. 10mg)" value={newMedDose} onChange={(e) => setNewMedDose(e.target.value)} />
                <FormInput id="new-med-freq" placeholder="Frequency (e.g. Once daily)" value={newMedFreq} onChange={(e) => setNewMedFreq(e.target.value)} />
              </div>
              <Button type="button" variant="secondary" onClick={handleAddMedication}><Plus className="w-4 h-4" /> Add Medication</Button>
            </div>
          </div>
        )}

        {/* Allergies */}
        {activeSectionIdx === 2 && (
          <div data-animate className="bg-[#1a1d23] rounded-2xl p-6 border border-gray-800 space-y-4 md:col-span-2">
            <h3 className="font-bold text-white flex items-center gap-2"><AlertCircle className="w-4 h-4 text-[#ed8936]" /> Allergies & Sensitivities</h3>
            <FormTextarea id="drug-allergy" label="Drug Allergies" placeholder="e.g., Penicillin, NSAIDs..." value={drugAllergy} onChange={(e) => setDrugAllergy(e.target.value)} rows={3} />
            <FormTextarea id="food-allergy" label="Food Allergies" placeholder="e.g., Peanuts, Shellfish..." value={foodAllergy} onChange={(e) => setFoodAllergy(e.target.value)} rows={3} />
            <FormTextarea id="env-allergy" label="Environmental Allergies" placeholder="e.g., Pollen, Dust mites..." value={envAllergy} onChange={(e) => setEnvAllergy(e.target.value)} rows={2} />
          </div>
        )}

        {/* Vitals */}
        {activeSectionIdx === 3 && (
          <div data-animate className="bg-[#1a1d23] rounded-2xl p-6 border border-gray-800 space-y-4 md:col-span-2">
            <h3 className="font-bold text-white flex items-center gap-2"><Activity className="w-4 h-4 text-[#4299e1]" /> Vital Signs (Last Recorded)</h3>
            <div className="grid grid-cols-2 gap-3">
              <FormInput id="bp" label="Blood Pressure" placeholder="120/80 mmHg" value={bp} onChange={(e) => setBp(e.target.value)} />
              <FormInput id="hr" label="Heart Rate" placeholder="72 bpm" value={hr} onChange={(e) => setHr(e.target.value)} />
              <FormInput id="weight" label="Weight (kg)" placeholder="70" value={weight} onChange={(e) => setWeight(e.target.value)} />
              <FormInput id="height" label="Height (cm)" placeholder="165" value={height} onChange={(e) => setHeight(e.target.value)} />
            </div>
            <FormInput id="bg-level" label="Blood Glucose (if applicable)" placeholder="5.6 mmol/L" value={bgLevel} onChange={(e) => setBgLevel(e.target.value)} />
            <FormTextarea id="notes" label="Additional Notes for Responders" placeholder="Any critical information first responders should know..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>
        )}

        {/* Save Actions */}
        <div data-animate className="md:col-span-2 flex justify-end gap-3 mt-4">
          <Button type="button" variant="ghost" onClick={() => setActiveSectionIdx(Math.max(0, activeSectionIdx - 1))}>Previous</Button>
          {activeSectionIdx < sections.length - 1 ? (
            <Button type="button" onClick={() => setActiveSectionIdx(activeSectionIdx + 1)}>Next Section</Button>
          ) : (
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              <span>Save & Encrypt Profile</span>
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

