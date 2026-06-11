import { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";
import {
  Heart, Pill, AlertCircle, Activity, Plus, Save, Loader2,
  CheckCircle2, LogOut, Pencil, X, AlertTriangle
} from "lucide-react";
import { FormInput, FormTextarea, FormSelect } from "../../components/ui/FormInput";
import { Button } from "../../components/ui/Button";
import { encryptPayload } from "../../lib/cryptoUtils";
import { supabase, isPlaceholderUrl } from "../../lib/supabase";
import { useNavigate } from "react-router-dom";

// ─── FIX 5: Typed validation interfaces ──────────────────────────────────────

interface Medication {
  name: string;
  dose: string;
  freq: string;
}


interface ValidationErrors {
  fullName?: string;
  dob?: string;
  contact?: string;
  address?: string;
}

// ─── Section tabs ─────────────────────────────────────────────────────────────

const sections = [
  { icon: <Heart className="w-5 h-5 text-[#e53e3e]" />, title: "Medical History", id: "medical" },
  { icon: <Pill className="w-5 h-5 text-[#48bb78]" />, title: "Medications", id: "meds" },
  { icon: <AlertCircle className="w-5 h-5 text-[#ed8936]" />, title: "Allergies & Conditions", id: "allergies" },
  { icon: <Activity className="w-5 h-5 text-[#4299e1]" />, title: "Vital Signs", id: "vitals" },
];

// ─── Philippine phone regex ────────────────────────────────────────────────────

const PH_PHONE_RE = /^(\+639\d{9}|09\d{9})$/;

function validatePhone(value: string): string | undefined {
  if (!value.trim()) return "Contact number is required.";
  if (!PH_PHONE_RE.test(value.replace(/\s/g, "")))
    return "Enter a valid Philippine number: 09XXXXXXXXX or +639XXXXXXXXX.";
  return undefined;
}

function validateDob(value: string): string | undefined {
  if (!value.trim()) return "Date of birth is required.";
  const parsed = new Date(value);
  if (isNaN(parsed.getTime())) return "Enter a valid date.";
  const today = new Date();
  if (parsed >= today) return "Date of birth must be in the past.";
  const ageYears = (today.getTime() - parsed.getTime()) / (365.25 * 24 * 3600 * 1000);
  if (ageYears > 120) return "Age cannot exceed 120 years.";
  return undefined;
}

function validateRequired(value: string, label: string): string | undefined {
  if (!value.trim()) return `${label} is required.`;
  return undefined;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function EnrollmentPage() {
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Profile dropdown
  const [patientName, setPatientName] = useState("Guest");
  const [patientId, setPatientId] = useState("RC-8829-X");
  const [showDropdown, setShowDropdown] = useState(false);

  // FIX 5: New required demographic fields (controlled, typed)
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [address, setAddress] = useState("");
  const [contact, setContact] = useState("");

  // Medical history fields
  const [bloodType, setBloodType] = useState("O+");
  const [chronic, setChronic] = useState("");
  const [surgeries, setSurgeries] = useState("");
  const [smoke, setSmoke] = useState("Non-smoker");
  const [drugAllergy, setDrugAllergy] = useState("");
  const [foodAllergy, setFoodAllergy] = useState("");
  const [envAllergy, setEnvAllergy] = useState("");

  // Medications
  const [medications, setMedications] = useState<Medication[]>([
    { name: "Humalog KwikPen", dose: "As needed based on BG levels", freq: "As needed" },
    { name: "Lisinopril", dose: "10mg Tablet", freq: "Once daily" },
  ]);
  const [newMedName, setNewMedName] = useState("");
  const [newMedDose, setNewMedDose] = useState("");
  const [newMedFreq, setNewMedFreq] = useState("");

  // Vitals
  const [bp, setBp] = useState("");
  const [hr, setHr] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [bgLevel, setBgLevel] = useState("");
  const [notes, setNotes] = useState("");

  // UI states
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);

  // FIX 3: Validation errors state
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  // FIX 3: Duplicate-detection modal state
  const [duplicateModal, setDuplicateModal] = useState<{
    show: boolean;
    duplicateResidentId: string | null;
  }>({ show: false, duplicateResidentId: null });

  // FIX 3: in-flight state for duplicate check — disables submit button
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);

  // Read session on mount
  useEffect(() => {
    const session = localStorage.getItem("respondaCare_session");
    if (session) {
      try {
        const parsed = JSON.parse(session) as Record<string, unknown>;
        if (typeof parsed.name === "string" && parsed.name) {
          setPatientName(parsed.name);
          setFullName(parsed.name);
        }
        if (typeof parsed.auth_uid === "string") {
          setPatientId("RC-" + parsed.auth_uid.substring(0, 6).toUpperCase());
        }
      } catch {
        // Silently ignore malformed session
      }
    }
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-animate]", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.55, stagger: 0.08, ease: "power2.out" });
    }, ref);
    return () => ctx.revert();
  }, []);

  // Load existing profile from Supabase / localStorage
  useEffect(() => {
    const loadProfile = async () => {
      let encryptedPayload = "";

      const { data: sessionData } = await supabase.auth.getSession();
      const authUser = sessionData?.session?.user;
      if (authUser) {
        const { data: resData } = await supabase
          .schema("core")
          .from("residents")
          .select("encrypted_payload, address, date_of_birth, contact_number")
          .eq("user_id", authUser.id)
          .maybeSingle();

        if (resData) {
          if (resData.encrypted_payload) encryptedPayload = resData.encrypted_payload as string;
          if (typeof resData.address === "string") setAddress(resData.address);
          if (typeof resData.date_of_birth === "string") setDob(resData.date_of_birth);
          if (typeof resData.contact_number === "string") setContact(resData.contact_number);
        }
      }

      if (!encryptedPayload) {
        const session = localStorage.getItem("respondaCare_session");
        if (session) {
          try {
            const parsedSession = JSON.parse(session) as Record<string, unknown>;
            const residents = localStorage.getItem("respondaCare_residents");
            if (residents) {
              const list = JSON.parse(residents) as Array<Record<string, unknown>>;
              const found = list.find(
                (r) => typeof r.name === "string" &&
                  r.name.toLowerCase() === (parsedSession.name as string)?.toLowerCase()
              );
              if (found && typeof found.encryptedPayload === "string") {
                encryptedPayload = found.encryptedPayload;
                if (typeof found.address === "string") setAddress(found.address);
                if (typeof found.dob === "string") setDob(found.dob);
                if (typeof found.contact === "string") setContact(found.contact);
              }
            }
          } catch {
            // Silently skip malformed cache
          }
        }
      }

      if (encryptedPayload) {
        const { decryptPayload } = await import("../../lib/cryptoUtils");
        try {
          const decrypted = (await decryptPayload(encryptedPayload, "barangay45key")) as Record<string, unknown>;
          if (decrypted) {
            if (typeof decrypted.bloodType === "string") setBloodType(decrypted.bloodType);
            if (typeof decrypted.chronic === "string") setChronic(decrypted.chronic);
            if (typeof decrypted.surgeries === "string") setSurgeries(decrypted.surgeries);
            if (typeof decrypted.smoke === "string") setSmoke(decrypted.smoke);
            const allergies = decrypted.allergies as Record<string, string> | undefined;
            if (allergies) {
              if (typeof allergies.drug === "string") setDrugAllergy(allergies.drug);
              if (typeof allergies.food === "string") setFoodAllergy(allergies.food);
              if (typeof allergies.environmental === "string") setEnvAllergy(allergies.environmental);
            }
            if (Array.isArray(decrypted.medications)) setMedications(decrypted.medications as Medication[]);
            const vitals = decrypted.vitals as Record<string, string> | undefined;
            if (vitals) {
              if (typeof vitals.bp === "string") setBp(vitals.bp);
              if (typeof vitals.hr === "string") setHr(vitals.hr);
              if (typeof vitals.weight === "string") setWeight(vitals.weight);
              if (typeof vitals.height === "string") setHeight(vitals.height);
              if (typeof vitals.bgLevel === "string") setBgLevel(vitals.bgLevel);
            }
            if (typeof decrypted.notes === "string") setNotes(decrypted.notes);
          }
        } catch (e) {
          console.error("Failed to decrypt cached profile", e);
        }
      }
    };
    loadProfile();
  }, []);

  const handleAddMedication = () => {
    if (!newMedName.trim()) return;
    setMedications([
      ...medications,
      { name: newMedName.trim(), dose: newMedDose.trim() || "N/A", freq: newMedFreq.trim() || "N/A" }
    ]);
    setNewMedName("");
    setNewMedDose("");
    setNewMedFreq("");
  };

  const handleRemoveMedication = (idx: number) => {
    setMedications(medications.filter((_, i) => i !== idx));
  };

  // ── FIX 5: Client-side validation ────────────────────────────────────────────

  const runValidation = useCallback((): boolean => {
    const errors: ValidationErrors = {
      fullName: validateRequired(fullName, "Full name"),
      dob:      validateDob(dob),
      contact:  validatePhone(contact),
      address:  validateRequired(address, "Address"),
    };
    // Strip undefined keys
    const filtered = Object.fromEntries(
      Object.entries(errors).filter(([, v]) => v !== undefined)
    ) as ValidationErrors;
    setValidationErrors(filtered);
    return Object.keys(filtered).length === 0;
  }, [fullName, dob, contact, address]);

  // ── FIX 3: Duplicate detection via Supabase ─────────────────────────────────
  // Uses .ilike() for case-insensitive full_name matching.
  // Errors are surfaced to the UI — never silently swallowed.

  const checkDuplicate = useCallback(async (): Promise<string | null> => {
    if (isPlaceholderUrl) return null;

    const dobFormatted = new Date(dob).toISOString().slice(0, 10);

    // Step 1: find security.users rows with a matching name (case-insensitive)
    const { data: matchedUsers, error: nameErr } = await supabase
      .schema("security")
      .from("users")
      .select("user_id, full_name")
      .ilike("full_name", fullName.trim());

    if (nameErr) {
      // Surface the error so the user knows the check failed
      throw new Error(`Duplicate check failed: ${nameErr.message}`);
    }

    if (!matchedUsers || matchedUsers.length === 0) return null;

    // Step 2: for each name-matched user, check if a resident row exists with the same DOB
    const userIds = (matchedUsers as Array<{ user_id: string; full_name: string }>).map(
      (u) => u.user_id
    );

    const { data: matchedResidents, error: resErr } = await supabase
      .schema("core")
      .from("residents")
      .select("resident_id, user_id")
      .in("user_id", userIds)
      .eq("date_of_birth", dobFormatted);

    if (resErr) {
      throw new Error(`Duplicate resident check failed: ${resErr.message}`);
    }

    if (!matchedResidents || matchedResidents.length === 0) return null;

    return (matchedResidents as Array<{ resident_id: string }>)[0].resident_id;
  }, [fullName, dob]);

  // ── Core save logic (called after duplicate check passes) ─────────────────────

  const executeSave = useCallback(async () => {
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const session = localStorage.getItem("respondaCare_session");
      if (!session) throw new Error("No active authenticated session found.");

      const parsedSession = JSON.parse(session) as Record<string, unknown>;
      const resolvedName = fullName.trim() || (parsedSession.name as string) || "Resident";

      // Format DOB as YYYY-MM-DD
      const dobFormatted = new Date(dob).toISOString().slice(0, 10);

      const payload = {
        name: resolvedName,
        age: Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000)),
        gender: "Male",
        barangay: "Brgy. 45, Pasay City",
        address: address.trim(),
        contact: contact.trim(),
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
        vitals: { bp, hr, weight, height, bgLevel },
        notes,
        sample: {
          s: chronic || "None on record",
          a: [drugAllergy, foodAllergy].filter(Boolean).join(", ") || "None",
          m: medications.map((m) => `${m.name} (${m.dose})`).join(", ") || "None",
          p: surgeries || "None",
          l: "N/A",
          e: notes || "N/A",
        },
      };

      const encrypted = await encryptPayload(payload, "barangay45key");

      // Update localStorage
      const cached = localStorage.getItem("respondaCare_residents") || "[]";
      const list = JSON.parse(cached) as Array<Record<string, unknown>>;
      const existing = list.find(
        (r) => typeof r.name === "string" &&
          r.name.toLowerCase() === resolvedName.toLowerCase()
      );

      const record: Record<string, unknown> = {
        id: (existing?.id as string) || `RC-${Math.floor(1000 + Math.random() * 9000)}`,
        name: resolvedName,
        barangay: "Brgy. 45, Pasay City",
        encryptedPayload: encrypted,
        dob: dobFormatted,
        gender: "Male",
        contact: contact.trim(),
        address: address.trim(),
        bloodType,
        vulnerability: chronic ? "High" : "Low",
        lastUpdated: new Date().toISOString().slice(0, 10),
      };

      const existingIdx = list.findIndex(
        (r) => typeof r.name === "string" &&
          r.name.toLowerCase() === resolvedName.toLowerCase()
      );
      if (existingIdx > -1) {
        list[existingIdx] = record;
      } else {
        list.push(record);
      }
      localStorage.setItem("respondaCare_residents", JSON.stringify(list));

      // Audit log entry
      const localLogs = JSON.parse(localStorage.getItem("respondaCare_auditLogs") || "[]") as Array<Record<string, unknown>>;
      localLogs.unshift({
        ts: new Date().toISOString().slice(0, 10),
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        user: resolvedName,
        role: "patient",
        action: "Resident updated own encrypted medical profile",
        resource: "health.records",
        ip: "127.0.0.1",
        dotColor: "bg-orange-400",
      });
      localStorage.setItem("respondaCare_auditLogs", JSON.stringify(localLogs));

      // ── Live Supabase sync ────────────────────────────────────────────────────

      if (!isPlaceholderUrl) {
        const { data: sessionData } = await supabase.auth.getSession();
        const authUser = sessionData?.session?.user;
        if (authUser) {
          // Get or create resident row
          const { data: resData } = await supabase
            .schema("core")
            .from("residents")
            .select("resident_id")
            .eq("user_id", authUser.id)
            .maybeSingle();

          let residentId: string | null = (resData as { resident_id: string } | null)?.resident_id ?? null;

          if (!residentId) {
            const { data: newRes, error: insErr } = await supabase
              .schema("core")
              .from("residents")
              .insert({
                user_id: authUser.id,
                barangay_id: 1,
                address: address.trim(),
                date_of_birth: dobFormatted,
                contact_number: contact.trim(),
                gender: "Male",
                consent_given: true,
                consent_granted: true,
                encrypted_payload: encrypted,
              })
              .select("resident_id")
              .single();

            if (insErr) throw insErr;
            residentId = (newRes as { resident_id: string })?.resident_id ?? null;
          } else {
            const { error: updErr } = await supabase
              .schema("core")
              .from("residents")
              .update({
                encrypted_payload: encrypted,
                address: address.trim(),
                date_of_birth: dobFormatted,
                contact_number: contact.trim(),
                updated_at: new Date().toISOString(),
              })
              .eq("resident_id", residentId);
            if (updErr) throw updErr;
          }

          if (residentId) {
            // Insert health record snapshot
            const { error: recErr } = await supabase
              .schema("health")
              .from("records")
              .insert({
                resident_id: residentId,
                encrypted_vitals: encrypted,
                record_type: "updated",
              });
            if (recErr) throw recErr;

            // ── FIX 3: health.profiles upsert with explicit onConflict ───────────

            const allergiesCombined = [drugAllergy, foodAllergy, envAllergy].filter(Boolean).join(", ");
            const medicationsCombined = medications
              .map((m) => `${m.name} (${m.dose} - ${m.freq})`)
              .join(", ");

            const upsertPayload = {
              resident_id: residentId,
              blood_type: bloodType,
              allergies: allergiesCombined || "None",
              medications: medicationsCombined || "None",
              past_medical_hx: surgeries || "None",
              signs_symptoms: chronic || "None",
              updated_at: new Date().toISOString(),
            };

            const { error: profErr } = await supabase
              .schema("health")
              .from("profiles")
              .upsert(upsertPayload, { onConflict: "resident_id" });

            if (profErr) {
              // Surface error — no silent failures
              console.error("health.profiles upsert failed:", profErr);
              throw new Error(`Failed to update health profile: ${profErr.message}`);
            }

            // ── FIX 3: Post-upsert verification round-trip ────────────────────

            if (import.meta.env.DEV) {
              const { data: verified, error: verifyErr } = await supabase
                .schema("health")
                .from("profiles")
                .select("blood_type, allergies, medications, past_medical_hx, signs_symptoms")
                .eq("resident_id", residentId)
                .maybeSingle();

              if (verifyErr) {
                console.error("[DEV] Post-upsert verification query failed:", verifyErr.message);
              } else if (verified) {
                const checks: Record<string, [string, string]> = {
                  blood_type:     [(verified as Record<string, string>).blood_type,     bloodType],
                  allergies:      [(verified as Record<string, string>).allergies,      allergiesCombined || "None"],
                  medications:    [(verified as Record<string, string>).medications,    medicationsCombined || "None"],
                  past_medical_hx:[(verified as Record<string, string>).past_medical_hx, surgeries || "None"],
                  signs_symptoms: [(verified as Record<string, string>).signs_symptoms, chronic || "None"],
                };
                for (const [field, [actual, expected]] of Object.entries(checks)) {
                  if (actual !== expected) {
                    console.warn(`[DEV] health.profiles field mismatch — ${field}: stored="${actual}" expected="${expected}"`);
                  }
                }
                console.log("[DEV] health.profiles upsert verified ✓", verified);
              }
            }

            // Sync allergy_flags
            await supabase.schema("health").from("allergy_flags").delete().eq("resident_id", residentId);
            const allergens = [
              { name: drugAllergy, type: "drug" },
              { name: foodAllergy, type: "food" },
              { name: envAllergy, type: "environmental" },
            ].filter((a) => a.name?.trim());

            for (const item of allergens) {
              const { error: algErr } = await supabase
                .schema("health")
                .from("allergy_flags")
                .insert({ resident_id: residentId, allergen_name: item.name.trim(), severity: "moderate" });
              if (algErr) console.warn("Failed to insert allergy flag:", algErr.message);
            }

            // Sync medications
            await supabase.schema("health").from("medications").delete().eq("resident_id", residentId);
            for (const med of medications) {
              if (med.name?.trim()) {
                const { error: medErr } = await supabase
                  .schema("health")
                  .from("medications")
                  .insert({
                    resident_id: residentId,
                    drug_name: med.name.trim(),
                    dosage: med.dose || "N/A",
                    frequency: med.freq || "N/A",
                    is_active: true,
                  });
                if (medErr) console.warn("Failed to insert medication:", medErr.message);
              }
            }

            // Audit log
            const { error: auditErr } = await supabase
              .schema("security")
              .from("audit_log")
              .insert({
                action: "UPDATE_HEALTH_RECORD",
                target_table: "health.records",
                target_id: residentId,
                details: { info: "Resident updated own encrypted medical profile" },
              });
            if (auditErr) console.warn("Failed to write audit log:", auditErr.message);
          }
        }
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to save and encrypt enrollment data.");
    } finally {
      setLoading(false);
    }
  }, [
    fullName, dob, address, contact,
    bloodType, chronic, surgeries, smoke,
    drugAllergy, foodAllergy, envAllergy,
    medications, bp, hr, weight, height, bgLevel, notes,
  ]);

  // ── Form submit handler ───────────────────────────────────────────────────────

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!runValidation()) return;

    // Duplicate detection — blocks submit while in-flight
    setIsCheckingDuplicate(true);
    setError("");
    try {
      const duplicateId = await checkDuplicate();
      if (duplicateId) {
        setDuplicateModal({ show: true, duplicateResidentId: duplicateId });
        return;
      }
    } catch (err: unknown) {
      // Surface duplicate-check errors — never swallow silently
      setError(err instanceof Error ? err.message : "Duplicate check failed. Please try again.");
      return;
    } finally {
      setIsCheckingDuplicate(false);
    }

    await executeSave();
  };

  return (
    <div ref={ref} className="bg-[#0f1115] min-h-full p-8 text-white">

      {/* ── Duplicate-detection warning modal ─────────────────────────────────── */}
      {duplicateModal.show && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#161b22] border border-amber-500/30 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <header className="px-6 py-4 bg-amber-950/30 border-b border-amber-500/20 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <h3 className="text-base font-bold text-amber-300">Resident Already Exists</h3>
            </header>
            <div className="p-6 space-y-4">
              <p className="text-sm text-[#9ca3af] leading-relaxed">
                A resident with the name{" "}
                <strong className="text-white">{fullName.trim()}</strong> and date of birth{" "}
                <strong className="text-white">{dob}</strong> already exists in the registry.
              </p>
              <div className="text-xs text-amber-400/80 bg-amber-950/20 border border-amber-500/15 rounded-lg px-4 py-3 font-mono">
                Resident ID:{" "}
                <span className="text-amber-300 break-all">{duplicateModal.duplicateResidentId}</span>
              </div>
              <p className="text-xs text-[#8b949e]">
                Submitting a new enrollment for an existing resident is not allowed. View the
                existing record or cancel to correct the details.
              </p>
            </div>
            <footer className="px-6 py-4 bg-[#1e222a] border-t border-[#30363d] flex gap-3 justify-end">
              <button
                onClick={() => setDuplicateModal({ show: false, duplicateResidentId: null })}
                className="px-4 py-2 rounded-xl bg-[#1a1d23] border border-gray-700 text-gray-300 hover:text-white text-sm font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setDuplicateModal({ show: false, duplicateResidentId: null });
                  navigate("/admin/residents");
                }}
                className="px-4 py-2 rounded-xl bg-[#1e3a5f] hover:bg-[#1e4a7a] border border-blue-500/30 text-blue-300 hover:text-white text-sm font-bold cursor-pointer transition-colors"
              >
                View Existing Record
              </button>
            </footer>
          </div>
        </div>
      )}

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
                      onClick={() => { setShowDropdown(false); navigate("/patient/dashboard?edit=true"); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white hover:bg-[#1a1d23] text-left cursor-pointer transition-colors"
                    >
                      <Pencil className="w-4 h-4" /><span>Edit Personal Info</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        localStorage.removeItem("respondaCare_session");
                        navigate("/");
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-[#1a1d23] text-left border-t border-[#30363d] cursor-pointer transition-colors"
                    >
                      <LogOut className="w-4 h-4" /><span>Logout</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Section tabs */}
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

      {/* Error toast */}
      {error && (
        <div data-animate className="mb-6 p-4 rounded-lg bg-red-950/45 border border-red-500/30 text-sm text-red-300 font-mono flex items-center gap-2">
          <X className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Success toast */}
      {success && (
        <div data-animate className="mb-6 p-4 rounded-lg bg-emerald-950/45 border border-emerald-500/30 text-sm text-emerald-300 font-mono flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          <span>Profile encrypted (AES-256-GCM) and synchronized successfully.</span>
        </div>
      )}

      <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={handleSave}>

        {/* ── FIX 5: Required demographic fields (always visible) ────────────── */}
        <div data-animate className="bg-[#1a1d23] rounded-2xl p-6 border border-gray-800 space-y-4 md:col-span-2">
          <h3 className="font-bold text-white flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4 text-amber-400" /> Personal Details (Required)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              id="full-name"
              label="Full Name"
              placeholder="e.g. Juan Dela Cruz"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              error={validationErrors.fullName}
            />
            <FormInput
              id="dob"
              label="Date of Birth"
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              error={validationErrors.dob}
            />
            <FormInput
              id="contact"
              label="Contact Number"
              placeholder="09XXXXXXXXX or +639XXXXXXXXX"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              error={validationErrors.contact}
            />
            <FormInput
              id="address"
              label="Home Address"
              placeholder="e.g. Zone 3, Barangay 45, Pasay City"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              error={validationErrors.address}
            />
          </div>
        </div>

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
                <FormInput id="new-med-name" placeholder="Medication Name" value={newMedName} onChange={(e) => setNewMedName(e.target.value)} />
                <FormInput id="new-med-dose" placeholder="Dosage (e.g. 10mg)" value={newMedDose} onChange={(e) => setNewMedDose(e.target.value)} />
                <FormInput id="new-med-freq" placeholder="Frequency" value={newMedFreq} onChange={(e) => setNewMedFreq(e.target.value)} />
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

        {/* Navigation buttons */}
        <div data-animate className="md:col-span-2 flex justify-end gap-3 mt-4">
          <Button type="button" variant="ghost" onClick={() => setActiveSectionIdx(Math.max(0, activeSectionIdx - 1))}>Previous</Button>
          {activeSectionIdx < sections.length - 1 ? (
            <Button type="button" onClick={() => setActiveSectionIdx(activeSectionIdx + 1)}>Next Section</Button>
          ) : (
            <Button type="submit" disabled={loading || isCheckingDuplicate}>
              {(loading || isCheckingDuplicate) ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              <span>{isCheckingDuplicate ? "Checking…" : "Save & Encrypt Profile"}</span>
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
