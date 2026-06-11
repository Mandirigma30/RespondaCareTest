import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { Activity, Heart, AlertCircle, Eye, X, Thermometer, FileHeart, Loader2 } from "lucide-react";
import { supabase, isPlaceholderUrl } from "../../lib/supabase";
import { decryptPayload } from "../../lib/cryptoUtils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DecryptedVitals {
  name?: string;
  chronic?: string;
  surgeries?: string;
  bloodType?: string;
  smoke?: string;
  allergies?: {
    drug?: string;
    food?: string;
    environmental?: string;
  };
  medications?: Array<{ name: string; dose: string; freq: string }>;
  sample?: {
    s?: string;
    a?: string;
    m?: string;
    p?: string;
    l?: string;
    e?: string;
  };
  vitals?: {
    bp?: string;
    hr?: string;
    weight?: string;
    height?: string;
    bgLevel?: string;
  };
  notes?: string;
}

interface PatientHealthRecord {
  record_id: string;
  record_type: string;
  created_at: string;
  encrypted_vitals: string;
  decrypted: DecryptedVitals | null;
}

interface HealthProfile {
  blood_type: string | null;
  allergies: string | null;
  medications: string | null;
  past_medical_hx: string | null;
  signs_symptoms: string | null;
  updated_at: string | null;
}

function calcBmi(heightCm: string | undefined, weightKg: string | undefined): string {
  const h = parseFloat(heightCm ?? "");
  const w = parseFloat(weightKg ?? "");
  if (h > 0 && w > 0) return (w / ((h / 100) * (h / 100))).toFixed(1);
  return "—";
}

const CRYPTO_KEY = "barangay45key";

// ─── Component ────────────────────────────────────────────────────────────────

export default function PatientHealthRecordsPage() {
  const ref = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<PatientHealthRecord[]>([]);
  const [profile, setProfile] = useState<HealthProfile | null>(null);

  // Modal
  const [selectedRecord, setSelectedRecord] = useState<PatientHealthRecord | null>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-animate]",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.07, ease: "power2.out" }
      );
    }, ref);
    return () => ctx.revert();
  }, [loading]);

  // ── Load data ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        if (isPlaceholderUrl) {
          // Offline mode: load from localStorage
          const cached = localStorage.getItem("respondaCare_residents") || "[]";
          const residents = JSON.parse(cached) as Array<{
            encryptedPayload?: string;
            dob?: string;
            lastUpdated?: string;
          }>;

          const mapped: PatientHealthRecord[] = await Promise.all(
            residents.slice(0, 10).map(async (r, idx) => {
              let decrypted: DecryptedVitals | null = null;
              if (r.encryptedPayload) {
                try {
                  decrypted = (await decryptPayload(r.encryptedPayload, CRYPTO_KEY)) as DecryptedVitals;
                } catch {
                  // silently degrade
                }
              }
              return {
                record_id: `LOCAL-${idx}`,
                record_type: "initial",
                created_at: r.lastUpdated || new Date().toISOString(),
                encrypted_vitals: r.encryptedPayload || "",
                decrypted,
              };
            })
          );
          setRecords(mapped);
          return;
        }

        // Live mode: get the authenticated user
        const { data: authData, error: authErr } = await supabase.auth.getUser();
        if (authErr) throw new Error(authErr.message);
        const user = authData?.user;
        if (!user) throw new Error("Not authenticated. Please log in.");

        // Look up the resident row
        const { data: resData, error: resErr } = await supabase
          .schema("core")
          .from("residents")
          .select("resident_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (resErr) throw new Error(resErr.message);
        if (!resData) {
          setError("No resident profile found. Please complete enrollment first.");
          setLoading(false);
          return;
        }

        const residentId = (resData as { resident_id: string }).resident_id;

        // Fetch health records (RLS scoped to this resident)
        const { data: recData, error: recErr } = await supabase
          .schema("health")
          .from("records")
          .select("record_id, record_type, created_at, encrypted_vitals")
          .eq("resident_id", residentId)
          .order("created_at", { ascending: false });

        if (recErr) throw new Error(recErr.message);

        const mapped: PatientHealthRecord[] = await Promise.all(
          ((recData ?? []) as Array<{
            record_id: string;
            record_type: string;
            created_at: string;
            encrypted_vitals: string;
          }>).map(async (rec) => {
            let decrypted: DecryptedVitals | null = null;
            if (rec.encrypted_vitals) {
              try {
                decrypted = (await decryptPayload(rec.encrypted_vitals, CRYPTO_KEY)) as DecryptedVitals;
              } catch {
                // silently degrade — don't block render for one bad record
              }
            }
            return {
              record_id: rec.record_id,
              record_type: rec.record_type,
              created_at: rec.created_at,
              encrypted_vitals: rec.encrypted_vitals,
              decrypted,
            };
          })
        );

        setRecords(mapped);

        // Fetch health profile (unencrypted fields stored in health.profiles)
        const { data: profData, error: profErr } = await supabase
          .schema("health")
          .from("profiles")
          .select("blood_type, allergies, medications, past_medical_hx, signs_symptoms, updated_at")
          .eq("resident_id", residentId)
          .maybeSingle();

        if (profErr) {
          console.warn("health.profiles fetch failed:", profErr.message);
        } else if (profData) {
          setProfile(profData as HealthProfile);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load health records.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // ─── Render ───────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh] bg-[#0f1115]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#8b1a1a] animate-spin" />
          <p className="text-xs font-mono text-[#8b949e] uppercase tracking-widest animate-pulse">
            Decrypting health records…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className="bg-[#0f1115] min-h-full text-white pb-16">
      {/* Page header */}
      <header
        data-animate
        className="px-8 pt-8 pb-4 border-b border-gray-800 flex items-start gap-4"
      >
        <div className="p-2.5 rounded-xl bg-[#8b1a1a]/20 border border-[#8b1a1a]/30 flex-shrink-0">
          <FileHeart className="w-6 h-6 text-[#e53e3e]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">My Health Records</h1>
          <p className="text-sm text-[#9ca3af] mt-1">
            All data is AES-256-GCM encrypted and decrypted locally on your device.
          </p>
        </div>
      </header>

      <div className="px-8 py-6 space-y-8 max-w-5xl mx-auto w-full">
        {/* Error banner */}
        {error && (
          <div
            data-animate
            className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-sm text-red-300 flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ── Current Health Profile ──────────────────────────────────────────── */}
        {profile && (
          <section data-animate>
            <h2 className="text-[11px] font-bold text-[#8b949e] uppercase tracking-widest mb-4 flex items-center gap-2">
              <Heart className="w-3.5 h-3.5 text-red-500" /> Current Health Profile
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: "Blood Type", value: profile.blood_type ?? "Not recorded" },
                { label: "Chronic Conditions / Signs", value: profile.signs_symptoms ?? "None on record" },
                { label: "Allergies", value: profile.allergies ?? "None on record" },
                { label: "Active Medications", value: profile.medications ?? "None on record" },
                { label: "Past Medical History", value: profile.past_medical_hx ?? "None on record" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-[#1a1d23] p-5 rounded-2xl border border-gray-800"
                >
                  <p className="text-[10px] font-bold text-[#8b949e] uppercase tracking-widest mb-2">
                    {item.label}
                  </p>
                  <p className="text-sm text-white leading-relaxed">{item.value}</p>
                </div>
              ))}
              {profile.updated_at && (
                <div className="bg-[#1a1d23] p-5 rounded-2xl border border-gray-800">
                  <p className="text-[10px] font-bold text-[#8b949e] uppercase tracking-widest mb-2">
                    Last Updated
                  </p>
                  <p className="text-sm font-mono text-[#9ca3af]">
                    {new Date(profile.updated_at).toLocaleDateString("en-PH", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Record History ──────────────────────────────────────────────────── */}
        <section data-animate>
          <h2 className="text-[11px] font-bold text-[#8b949e] uppercase tracking-widest mb-4 flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-[#4299e1]" /> Encrypted Record History
          </h2>

          {records.length === 0 ? (
            <div className="bg-[#1a1d23] border border-gray-800 rounded-2xl p-10 text-center">
              <FileHeart className="w-10 h-10 text-[#30363d] mx-auto mb-3" />
              <p className="text-sm text-[#8b949e]">
                No health records found. Complete your enrollment to create your first record.
              </p>
            </div>
          ) : (
            <div className="bg-[#1a1d23] border border-gray-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[#1e222a] text-[#8b949e] text-[11px] font-bold uppercase tracking-widest border-b border-gray-800">
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Record Type</th>
                      <th className="px-6 py-4">Blood Pressure</th>
                      <th className="px-6 py-4">BMI</th>
                      <th className="px-6 py-4">Condition</th>
                      <th className="px-6 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {records.map((rec) => {
                      const bpVal = rec.decrypted?.vitals?.bp ?? "—";
                      const bmiVal = calcBmi(
                        rec.decrypted?.vitals?.height,
                        rec.decrypted?.vitals?.weight
                      );
                      const condition =
                        rec.decrypted?.sample?.s ??
                        rec.decrypted?.chronic ??
                        "—";
                      return (
                        <tr
                          key={rec.record_id}
                          className="hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="px-6 py-4 text-sm font-mono text-[#9ca3af]">
                            {new Date(rec.created_at).toLocaleDateString("en-PH")}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={[
                                "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                rec.record_type === "initial"
                                  ? "bg-blue-950/50 text-blue-400 border border-blue-500/20"
                                  : "bg-emerald-950/50 text-emerald-400 border border-emerald-500/20",
                              ].join(" ")}
                            >
                              {rec.record_type}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-mono text-gray-300">{bpVal}</td>
                          <td className="px-6 py-4 text-sm font-mono text-gray-300">{bmiVal}</td>
                          <td className="px-6 py-4 text-sm text-gray-300 max-w-[200px] truncate">
                            {condition}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => setSelectedRecord(rec)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#9ca3af] hover:text-white hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" /> View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* ── Detail modal ─────────────────────────────────────────────────────── */}
      {selectedRecord && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-xl bg-[#1a1d23] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col text-sm">
            <header className="px-6 py-4 bg-[#1e222a] border-b border-gray-800 flex justify-between items-center flex-shrink-0">
              <div>
                <h3 className="text-base font-bold text-white">Record Detail</h3>
                <p className="text-[10px] text-[#8b949e] font-mono mt-0.5">
                  {new Date(selectedRecord.created_at).toLocaleString("en-PH")} ·{" "}
                  <span className="uppercase">{selectedRecord.record_type}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Vitals */}
              <div>
                <h4 className="text-[10px] font-bold text-[#8b949e] uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Thermometer className="w-3.5 h-3.5 text-[#4299e1]" /> Vital Signs
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-[#0d1117] p-4 rounded-xl border border-white/[0.04]">
                  {[
                    { label: "Blood Pressure", value: selectedRecord.decrypted?.vitals?.bp ?? "—" },
                    { label: "Heart Rate", value: selectedRecord.decrypted?.vitals?.hr ? `${selectedRecord.decrypted.vitals.hr} bpm` : "—" },
                    { label: "Blood Glucose", value: selectedRecord.decrypted?.vitals?.bgLevel ?? "—" },
                    { label: "Height", value: selectedRecord.decrypted?.vitals?.height ? `${selectedRecord.decrypted.vitals.height} cm` : "—" },
                    { label: "Weight", value: selectedRecord.decrypted?.vitals?.weight ? `${selectedRecord.decrypted.vitals.weight} kg` : "—" },
                    {
                      label: "BMI",
                      value: calcBmi(
                        selectedRecord.decrypted?.vitals?.height,
                        selectedRecord.decrypted?.vitals?.weight
                      ),
                    },
                  ].map((v) => (
                    <div key={v.label}>
                      <p className="text-[10px] text-gray-500">{v.label}</p>
                      <p className="font-mono font-semibold text-white mt-0.5">{v.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* AES-decrypted clinical background */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-[10px] font-bold text-[#8b949e] uppercase tracking-widest flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-red-500" /> Medical Background
                  </h4>
                  <span className="text-[9px] font-mono text-emerald-400 border border-emerald-500/20 bg-emerald-950/20 px-2 py-0.5 rounded flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    AES-256-GCM Decrypted
                  </span>
                </div>
                {selectedRecord.decrypted ? (
                  <div className="bg-[#0d1117] p-5 rounded-xl border border-white/[0.04] space-y-4 text-sm">
                    {[
                      { label: "Conditions / Signs", value: selectedRecord.decrypted.sample?.s ?? selectedRecord.decrypted.chronic ?? "None on record", color: "text-white" },
                      { label: "Allergies", value: selectedRecord.decrypted.sample?.a ?? "None on record", color: "text-red-300" },
                      { label: "Medications", value: selectedRecord.decrypted.sample?.m ?? "None on record", color: "text-green-300" },
                      { label: "Past Medical History", value: selectedRecord.decrypted.sample?.p ?? selectedRecord.decrypted.surgeries ?? "None on record", color: "text-blue-300" },
                    ].map((item, idx) => (
                      <div key={idx} className={idx > 0 ? "border-t border-white/[0.04] pt-4" : ""}>
                        <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">{item.label}</p>
                        <p className={`${item.color} leading-relaxed`}>{item.value}</p>
                      </div>
                    ))}
                    {selectedRecord.decrypted.notes && (
                      <div className="border-t border-white/[0.04] pt-4">
                        <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Notes</p>
                        <p className="text-gray-300 whitespace-pre-line leading-relaxed">
                          {selectedRecord.decrypted.notes}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-[#0d1117] p-5 rounded-xl border border-white/[0.04] text-[#8b949e] text-xs text-center">
                    No decrypted data available for this record.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
