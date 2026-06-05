import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { User, Mail, Phone, MapPin, Heart, Pill, AlertCircle, Save, Loader2 } from "lucide-react";
import { TopBar } from "../../components/layout/TopBar";
import { PageHeader } from "../../components/ui/PageHeader";
import { FormInput, FormTextarea, FormSelect } from "../../components/ui/FormInput";
import { Button } from "../../components/ui/Button";
import { Link, useNavigate } from "react-router-dom";
import { supabase, isPlaceholderUrl } from "../../lib/supabase";
import { encryptPayload } from "../../lib/cryptoUtils";

export default function AddResidentPage() {
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Personal Info States
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("Female");
  const [bloodType, setBloodType] = useState("O+");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [zone, setZone] = useState("Zone 1");

  // Health Info States
  const [conditions, setConditions] = useState("");
  const [allergies, setAllergies] = useState("");
  const [medications, setMedications] = useState("");
  const [vulnerability, setVulnerability] = useState("Low");

  // Emergency Contact States
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyRel, setEmergencyRel] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");

  // Additional Notes State
  const [quickNotes, setQuickNotes] = useState("");

  // Loading state
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-animate]", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.07, ease: "power2.out" });
    }, ref);
    return () => ctx.revert();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !dob || !email.trim()) {
      alert("Validation Error: Please fill in all required fields (First Name, Last Name, Date of Birth, Email).");
      return;
    }

    setLoading(true);

    try {
      const birthYear = new Date(dob).getFullYear();
      const currentYear = new Date().getFullYear();
      const calculatedAge = Math.max(0, currentYear - birthYear);

      // Build payload for encryption
      const payload = {
        name: `${firstName} ${lastName}`,
        age: calculatedAge,
        gender: gender,
        barangay: `Brgy. 45, Pasay City (${zone})`,
        bloodType: bloodType,
        sample: {
          s: conditions || "None on record",
          a: allergies || "None on record",
          m: medications || "None on record",
          p: quickNotes || "None",
        }
      };

      // Encrypt the payload using Barangay45 derivation key
      const encrypted = await encryptPayload(payload, "barangay45key");

      // Fallback local storage sync
      const cached = localStorage.getItem("respondaCare_residents") || "[]";
      const list = JSON.parse(cached);
      const newRecord = {
        name: `${firstName} ${lastName}`,
        barangay: `Brgy. 45, Pasay City (${zone})`,
        encryptedPayload: encrypted,
        age: calculatedAge,
        gender: gender,
        bloodType: bloodType,
        contact: phone || "N/A",
        vulnerability: vulnerability,
        lastUpdated: new Date().toISOString().slice(0, 10)
      };
      list.push(newRecord);
      localStorage.setItem("respondaCare_residents", JSON.stringify(list));

      // Supabase dynamic sync
      if (!isPlaceholderUrl) {
        // Map zone to barangay_id
        let bId = 1; // Brgy 45
        if (zone === "Zone 2") bId = 2; // Brgy 46
        else if (zone === "Zone 3") bId = 3; // San Lorenzo
        else if (zone === "Zone 4") bId = 4; // Plainview

        // 1. Insert security user (auth mock details)
        const { data: userD, error: userErr } = await supabase
          .from("security.users")
          .insert({
            role_id: 3, // patient/resident
            barangay_id: bId,
            full_name: `${firstName} ${lastName}`,
            email: email.trim().toLowerCase(),
            phone: phone
          })
          .select()
          .single();

        if (userErr) throw userErr;

        // 2. Insert core resident
        const { data: resD, error: resErr } = await supabase
          .from("core.residents")
          .insert({
            user_id: userD?.user_id || null,
            barangay_id: bId,
            address: address,
            date_of_birth: dob,
            gender: gender,
            contact_number: phone,
            mobility_status: vulnerability,
            consent_given: true,
            consent_granted: true,
            next_of_kin_name: emergencyName,
            next_of_kin_relationship: emergencyRel,
            next_of_kin_contact_number: emergencyPhone,
            encrypted_payload: encrypted
          })
          .select()
          .single();

        if (resErr) throw resErr;

        // 3. Insert baseline health record
        if (resD) {
          const { error: recordErr } = await supabase
            .from("health.records")
            .insert({
              resident_id: resD.resident_id,
              encrypted_vitals: encrypted,
              record_type: "initial"
            });
          if (recordErr) console.warn("Failed to create initial health record:", recordErr);

          // 4. Log Audit Trail
          await supabase.from("security.audit_log").insert({
            action: "INSERT",
            target_table: "core.residents",
            target_id: resD.resident_id,
            details: { info: `Admin registered resident: ${firstName} ${lastName}` }
          });
        }
      }

      alert("Resident registered and medical profile encrypted successfully.");
      navigate("/admin/residents");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to save and register resident.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={ref} className="flex flex-col h-full bg-[#0c0f16]">
      <TopBar title="Add New Resident" showSearch={false} />
      <div className="px-8 py-6 flex-1 max-w-7xl mx-auto w-full">
        <PageHeader title="Add New Resident" subtitle="Complete all required fields to enroll a new community member." />

        <form className="grid grid-cols-1 lg:grid-cols-3 gap-6" onSubmit={handleSubmit}>
          {/* Personal Info & Health Info */}
          <div data-animate className="lg:col-span-2 space-y-6">
            <div className="bg-[#1a1d23] rounded-2xl p-6 border border-[#2d333b]">
              <h3 className="text-sm font-bold text-[#8b949e] uppercase tracking-widest mb-5 flex items-center gap-2">
                <User className="w-4 h-4" /> Personal Information
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormInput id="add-first-name" label="First Name *" placeholder="Maria" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                  <FormInput id="add-last-name" label="Last Name *" placeholder="Santos" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <FormInput id="add-dob" type="date" label="Date of Birth *" value={dob} onChange={(e) => setDob(e.target.value)} required />
                  <FormSelect id="add-gender" label="Gender" value={gender} onChange={(e) => setGender(e.target.value)}>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </FormSelect>
                  <FormInput id="add-blood" label="Blood Type" placeholder="O+" value={bloodType} onChange={(e) => setBloodType(e.target.value)} />
                </div>
                <FormInput id="add-address" label="Home Address" placeholder="123 Rizal St., Pasay City" icon={<MapPin className="w-4 h-4" />} value={address} onChange={(e) => setAddress(e.target.value)} />
                <div className="grid grid-cols-2 gap-4">
                  <FormInput id="add-phone" type="tel" label="Phone Number" placeholder="+63 9XX XXX XXXX" icon={<Phone className="w-4 h-4" />} value={phone} onChange={(e) => setPhone(e.target.value)} />
                  <FormInput id="add-email" type="email" label="Email Address *" placeholder="maria@example.com" icon={<Mail className="w-4 h-4" />} value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <FormSelect id="add-zone" label="Barangay Zone" value={zone} onChange={(e) => setZone(e.target.value)}>
                  <option value="Zone 1">Zone 1 (Brgy 45)</option>
                  <option value="Zone 2">Zone 2 (Brgy 46)</option>
                  <option value="Zone 3">Zone 3 (San Lorenzo)</option>
                  <option value="Zone 4">Zone 4 (Plainview)</option>
                </FormSelect>
              </div>
            </div>

            {/* Health Info */}
            <div className="bg-[#1a1d23] rounded-2xl p-6 border border-[#2d333b]">
              <h3 className="text-sm font-bold text-[#8b949e] uppercase tracking-widest mb-5 flex items-center gap-2">
                <Heart className="w-4 h-4 text-[#e53e3e]" /> Health Information (Encrypted)
              </h3>
              <div className="space-y-4">
                <FormTextarea id="add-conditions" label="Chronic Conditions" placeholder="Type 1 Diabetes, Hypertension..." rows={3} value={conditions} onChange={(e) => setConditions(e.target.value)} />
                <FormTextarea id="add-allergies" label="Known Allergies" placeholder="Penicillin, Peanuts..." rows={2} value={allergies} onChange={(e) => setAllergies(e.target.value)} />
                <FormTextarea id="add-medications" label="Current Medications" placeholder="Insulin, Lisinopril 10mg..." rows={3} value={medications} onChange={(e) => setMedications(e.target.value)} />
                <FormSelect id="add-vulnerability" label="Vulnerability Classification" value={vulnerability} onChange={(e) => setVulnerability(e.target.value)}>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </FormSelect>
              </div>
            </div>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Emergency Contact */}
            <div data-animate className="bg-[#1a1d23] rounded-2xl p-6 border border-[#2d333b]">
              <h3 className="text-sm font-bold text-[#8b949e] uppercase tracking-widest mb-5 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#ed8936]" /> Emergency Contact
              </h3>
              <div className="space-y-4">
                <FormInput id="ec-name" label="Contact Name" placeholder="Juan Santos" value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} />
                <FormInput id="ec-rel" label="Relationship" placeholder="Spouse" value={emergencyRel} onChange={(e) => setEmergencyRel(e.target.value)} />
                <FormInput id="ec-phone" type="tel" label="Phone Number" placeholder="+63 9XX XXX XXXX" value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} />
              </div>
            </div>

            {/* Quick Notes */}
            <div data-animate className="bg-[#1a1d23] rounded-2xl p-6 border border-[#2d333b]">
              <h3 className="text-sm font-bold text-[#8b949e] uppercase tracking-widest mb-5 flex items-center gap-2">
                <Pill className="w-4 h-4 text-[#48bb78]" /> Quick Notes
              </h3>
              <FormTextarea id="quick-notes" label="Additional Notes" placeholder="Any additional notes for responders..." rows={4} value={quickNotes} onChange={(e) => setQuickNotes(e.target.value)} />
            </div>

            {/* Actions */}
            <div data-animate className="space-y-3">
              <Button fullWidth size="lg" type="submit" disabled={loading}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                <span>Save Resident</span>
              </Button>
              <Link to="/admin/residents" className="block">
                <Button variant="ghost" fullWidth size="md" type="button">Cancel</Button>
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
