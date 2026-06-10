import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { Download, Pill, AlertTriangle, Loader2, Pencil, Plus, X, UserCircle, CheckCircle2, LogOut } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { QRCodeCanvas } from "qrcode.react";
import jsPDF from "jspdf";
import { supabase, isPlaceholderUrl } from "../../lib/supabase";

interface EmergencyContact {
  name: string;
  rel: string;
  phone: string;
}

export default function PatientDashboardPage() {
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [qrPayload, setQrPayload] = useState("");
  const [patientName, setPatientName] = useState("");
  const [decryptedProfile, setDecryptedProfile] = useState<any>(null);
  const [patientId, setPatientId] = useState("RC-8829-X");

  // Edit Personal Info modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editContact, setEditContact] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editDob, setEditDob] = useState("");
  const [editGender, setEditGender] = useState("Male");
  const [editSaving, setEditSaving] = useState(false);
  const [editSuccess, setEditSuccess] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Trigger Edit Info modal if ?edit=true query param is present
  useEffect(() => {
    if (searchParams.get("edit") === "true") {
      setShowEditModal(true);
      setEditSuccess(false);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Dynamic Emergency Contacts
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContactName, setNewContactName] = useState("");
  const [newContactRel, setNewContactRel] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");  
  // Stagger entry animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-animate]", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.55, stagger: 0.08, ease: "power2.out" });
    }, ref);
    return () => ctx.revert();
  }, []);

  // Sync user details and medical card
  useEffect(() => {
    const loadUser = async () => {
      let currentName = "";
      let sessionUserId = "";
      let trimmedEmail = "";

      // 1. Prioritize localStorage session details
      const session = localStorage.getItem("respondaCare_session");
      if (session) {
        try {
          const parsed = JSON.parse(session);
          if (parsed.name && parsed.name !== "Alex Johnson") {
            currentName = parsed.name;
            sessionUserId = parsed.auth_uid;
          }
          if (parsed.email) {
            trimmedEmail = parsed.email.trim().toLowerCase();
          }
        } catch (e) {}
      }

      // 2. Fall back to Supabase auth user if no session in localStorage
      const { data: authData } = await supabase.auth.getUser();
      if (!currentName && authData?.user) {
        currentName =
          authData.user.user_metadata?.full_name ||
          authData.user.user_metadata?.name ||
          authData.user.email ||
          "";
        sessionUserId = authData.user.id;
      }
      if (authData?.user?.email) {
        trimmedEmail = authData.user.email.trim().toLowerCase();
      }

      if (currentName) {
        setPatientName(currentName);
        setEditName(currentName);
      }

      // Load personal info from localStorage
      const personalKey = `respondaCare_personal_${trimmedEmail || "guest"}`;
      const storedPersonal = localStorage.getItem(personalKey);
      if (storedPersonal) {
        try {
          const p = JSON.parse(storedPersonal);
          setEditContact(p.contact || "");
          setEditAddress(p.address || "");
          setEditDob(p.dob || "");
          setEditGender(p.gender || "Male");
        } catch (e) {}
      }

      // Load emergency contacts from localStorage
      const contactsKey = `respondaCare_ec_${trimmedEmail || "guest"}`;
      const storedContacts = localStorage.getItem(contactsKey);
      if (storedContacts) {
        try {
          setEmergencyContacts(JSON.parse(storedContacts));
        } catch (e) {}
      } else {
        // Default placeholder contacts
        setEmergencyContacts([
          { name: "Sarah Johnson", rel: "Spouse", phone: "(555) 012-3456" },
          { name: "Dr. Michael Chen", rel: "Primary MD", phone: "(555) 987-6543" },
        ]);
      }

      // 3. Find encrypted medical card: try Database query first, then fallback to local storage
      let foundPayload = "";
      let isSyncedInSupabase = false;

      if (sessionUserId) {
        const { data: resData, error: checkError } = await supabase
          .schema("core")
          .from("residents")
          .select("resident_id, encrypted_payload, address, date_of_birth, gender, contact_number")
          .eq("user_id", sessionUserId)
          .maybeSingle();
        
        if (checkError) {
          console.error("Error checking core.residents:", checkError);
        }

        if (resData) {
          if (resData.address) setEditAddress(resData.address);
          if (resData.date_of_birth) setEditDob(resData.date_of_birth);
          if (resData.gender) setEditGender(resData.gender);
          if (resData.contact_number) setEditContact(resData.contact_number);

          if (resData.encrypted_payload) {
            foundPayload = resData.encrypted_payload;
            isSyncedInSupabase = true;
          }
          if (resData.resident_id) {
            setPatientId("RC-" + resData.resident_id.substring(0, 6).toUpperCase());
          }
        }
      }

      // If not found in database, try localStorage
      if (!foundPayload && currentName) {
        const residents = localStorage.getItem("respondaCare_residents");
        if (residents) {
          try {
            const list = JSON.parse(residents);
            const found = list.find((r: any) =>
              r.name.toLowerCase() === currentName.toLowerCase() ||
              r.name.toLowerCase().includes(currentName.toLowerCase())
            );
            if (found) {
              foundPayload = found.encryptedPayload;
              if (found.id) {
                setPatientId(found.id);
              }
            }
          } catch (e) {}
        }
      }

      // If still no payload, auto-generate it
      if (!foundPayload) {
        const defaultRaw = {
          name: currentName || "Pedro Penduko",
          age: 34,
          gender: "Male",
          barangay: "Brgy. 45, Pasay City",
          bloodType: "O+",
          chronic: "Type 1 Diabetes",
          surgeries: "Appendectomy 2019",
          smoke: "Non-smoker",
          allergies: {
            drug: "Penicillin",
            food: "Peanuts",
            environmental: ""
          },
          medications: [
            { name: "Humalog KwikPen", dose: "As needed based on BG levels", freq: "As needed" },
            { name: "Lisinopril", dose: "10mg Tablet - Once daily", freq: "Daily" }
          ],
          vitals: {
            bp: "120/80",
            hr: "72",
            weight: "70",
            height: "165",
            bgLevel: "98"
          },
          notes: "Suspected hypoglycemic shock",
          sample: {
            s: "Type 1 Diabetes, Lisinopril medication",
            a: "Penicillin, Peanuts",
            m: "Humalog KwikPen, Lisinopril 10mg",
            p: "Hypertension, Type 1 Diabetes",
            l: "Lunch at 12:30 PM",
            e: "Suspected hypoglycemic shock"
          }
        };

        const { encryptPayload } = await import("../../lib/cryptoUtils");
        foundPayload = await encryptPayload(defaultRaw, "barangay45key");
        
        const randomId = `RC-${Math.floor(1000 + Math.random() * 9000)}`;
        setPatientId(randomId);

        // Save to localStorage under respondaCare_residents
        const cached = localStorage.getItem("respondaCare_residents") || "[]";
        const list = JSON.parse(cached);
        const record = {
          id: randomId,
          name: currentName,
          barangay: "Brgy. 45, Pasay City",
          encryptedPayload: foundPayload,
          dob: "1992-04-12",
          gender: "Male",
          contact: "+63 917 123 4567",
          address: "Zone 3, Barangay 45, Pasay City",
          bloodType: "O+",
          vulnerability: "High",
          lastUpdated: new Date().toISOString().slice(0, 10),
        };
        list.push(record);
        localStorage.setItem("respondaCare_residents", JSON.stringify(list));
      }

      // If we are authenticated but not synced in Supabase, perform database insertion
      if (authData?.user && !isSyncedInSupabase) {
        try {
          const { data: newRes, error: insertError } = await supabase
            .schema("core")
            .from("residents")
            .insert({
              user_id: authData.user.id,
              barangay_id: 1, // default barangay ID 1
              address: "Zone 3, Barangay 45, Pasay City",
              date_of_birth: "1992-04-12",
              gender: "Male",
              contact_number: "+63 917 123 4567",
              mobility_status: "High",
              consent_given: true,
              consent_granted: true,
              encrypted_payload: foundPayload
            })
            .select()
            .single();

          if (insertError) {
            console.error("Error inserting core.residents:", insertError);
          }

          if (newRes) {
            if (newRes.resident_id) {
              setPatientId("RC-" + newRes.resident_id.substring(0, 6).toUpperCase());
            }
            // Also create initial health record
            const { error: recordError } = await supabase
              .schema("health")
              .from("records")
              .insert({
                resident_id: newRes.resident_id,
                encrypted_vitals: foundPayload,
                record_type: "initial"
              });
            
            if (recordError) {
              console.error("Error inserting health.records:", recordError);
            }
          }
        } catch (e) {
          console.error("Failed to automatically initialize database resident record:", e);
        }
      }

      // 4. Decrypt and set state
      if (foundPayload) {
        setQrPayload(foundPayload);
        const { decryptPayload } = await import("../../lib/cryptoUtils");
        try {
          const decrypted = await decryptPayload(foundPayload, "barangay45key");
          setDecryptedProfile(decrypted);
        } catch (err) {
          console.error("Failed to decrypt profile", err);
        }
      }
    };
    loadUser();
  }, []);

  // ── Personal Info helpers ────────────────────────────────────────────────
  const handleSavePersonalInfo = async () => {
    setEditSaving(true);
    try {
      const session = localStorage.getItem("respondaCare_session");
      let sessionEmail = "guest";
      if (session) {
        try {
          const p = JSON.parse(session);
          // Update name in session
          p.name = editName.trim() || p.name;
          sessionEmail = p.email || "guest";
          localStorage.setItem("respondaCare_session", JSON.stringify(p));
        } catch (e) {}
      }
      setPatientName(editName.trim() || patientName);

      const personalKey = `respondaCare_personal_${sessionEmail}`;
      localStorage.setItem(personalKey, JSON.stringify({
        contact: editContact,
        address: editAddress,
        dob: editDob,
        gender: editGender,
      }));

      // Sync to Supabase if live
      if (!isPlaceholderUrl) {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user) {
          await supabase
            .schema("core")
            .from("residents")
            .update({
              contact_number: editContact,
              address: editAddress,
              date_of_birth: editDob || undefined,
              gender: editGender,
            })
            .eq("user_id", authData.user.id);
          await supabase
            .schema("security")
            .from("users")
            .update({ full_name: editName.trim() })
            .eq("auth_uid", authData.user.id);
        }
      }

      setEditSuccess(true);
      setTimeout(() => { setEditSuccess(false); setShowEditModal(false); }, 1500);
    } catch (e) {
      console.error("Failed to save personal info", e);
    } finally {
      setEditSaving(false);
    }
  };

  // ── Emergency Contact helpers ────────────────────────────────────────────
  const persistContacts = (contacts: EmergencyContact[]) => {
    const session = localStorage.getItem("respondaCare_session");
    let sessionEmail = "guest";
    if (session) { try { sessionEmail = JSON.parse(session).email || "guest"; } catch (e) {} }
    localStorage.setItem(`respondaCare_ec_${sessionEmail}`, JSON.stringify(contacts));
  };

  const handleAddContact = () => {
    if (!newContactName.trim()) return;
    const updated = [...emergencyContacts, {
      name: newContactName.trim(),
      rel: newContactRel.trim() || "Contact",
      phone: newContactPhone.trim() || "N/A",
    }];
    setEmergencyContacts(updated);
    persistContacts(updated);
    setNewContactName(""); setNewContactRel(""); setNewContactPhone("");
    setShowAddContact(false);
  };

  const handleRemoveContact = (idx: number) => {
    const updated = emergencyContacts.filter((_, i) => i !== idx);
    setEmergencyContacts(updated);
    persistContacts(updated);
  };

  const handleDownloadPdf = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: [100, 150] });
    
    const canvas = document.querySelector("#qr-code-container canvas") as HTMLCanvasElement;
    const qrDataUrl = canvas ? canvas.toDataURL("image/png") : "";

    // Brand Header
    doc.setFillColor(139, 26, 26);
    doc.rect(0, 0, 100, 20, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("RespondaCare", 50, 10, { align: "center" });
    
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text("EMERGENCY MEDICAL ID CARD", 50, 15, { align: "center" });

    // Name
    doc.setTextColor(15, 17, 21);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(patientName, 50, 32, { align: "center" });

    // QR Image
    if (qrDataUrl) {
      doc.addImage(qrDataUrl, "PNG", 25, 40, 50, 50);
    }

    // Metadata details
    doc.setTextColor(100, 110, 120);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(`Verify Secure ID: ${patientId}`, 50, 100, { align: "center" });
    doc.text("Barangay 45, Pasay City", 50, 105, { align: "center" });

    // Compliance text
    doc.setFillColor(245, 245, 245);
    doc.rect(0, 132, 100, 18, "F");
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(6);
    doc.text("RA 10173 Philippine Data Privacy Act Compliant", 50, 138, { align: "center" });
    doc.text("Encrypted PII block derived client-side via WebCrypto.", 50, 142, { align: "center" });
    doc.text("Triage use only.", 50, 145, { align: "center" });

    doc.save(`RespondaCare_ID_${patientName.replace(/\s+/g, "_")}.pdf`);
  };

  // Helper to format allergies
  const getAllergiesString = () => {
    if (!decryptedProfile) return "None on record";
    const { drug, food, environmental } = decryptedProfile.allergies || {};
    const items = [drug, food, environmental].filter(Boolean);
    return items.join(", ") || "None on record";
  };

  return (
    <div ref={ref} className="bg-[#0f1115] min-h-full pb-12 text-white">
          {/* Top Header */}
          <header className="p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-50" data-animate>
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">Welcome back, {patientName.split(" ")[0]}</h1>
              <p className="text-[#9ca3af] text-sm">Your health overview and emergency tools are ready.</p>
            </div>
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
                            setShowEditModal(true);
                            setEditSuccess(false);
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

      <div className="px-8 pb-8 flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto w-full">
        {/* Main Column */}
        <div className="flex-grow space-y-8 lg:max-w-4xl">
          {/* Emergency Card */}
          <section data-animate className="bg-[#1a1d23] p-8 rounded-3xl border border-gray-800 relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-white mb-2">Need immediate help?</h2>
              <p className="text-[#9ca3af] text-sm max-w-md">Report an emergency to alert your primary care team and emergency contacts instantly.</p>
            </div>
            <Link to="/patient/emergency" className="relative z-10 flex items-center gap-4 bg-[#8b1a1a] hover:bg-[#a01e1e] transition-colors px-6 py-4 rounded-2xl shadow-xl shadow-red-900/20 group pulse-glow">
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
              <h2 className="text-xl font-bold text-white">Health Profile (RA 10173 Sealed)</h2>
              <Link to="/patient/enrollment" className="text-[#8b1a1a] text-sm font-semibold hover:underline">Edit Profile</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {[
                { label: "Blood Type",         value: decryptedProfile?.bloodType || "O+" },
                { label: "Allergies",          value: getAllergiesString() },
                { label: "Chronic Conditions", value: decryptedProfile?.chronic || "None on record" },
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
                {(decryptedProfile?.medications || [
                  { name: "Humalog KwikPen", dose: "As needed based on BG levels", freq: "As needed" },
                  { name: "Lisinopril",       dose: "10mg Tablet - Once daily", freq: "Daily" },
                ]).map((med: any) => (
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
                    <span className="px-3 py-1 bg-green-500/10 text-green-500 text-[10px] font-bold uppercase rounded-full border border-green-500/20">{med.freq || "Daily"}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Right Column */}
        <div className="w-full lg:w-80 space-y-8 flex-shrink-0">
          
          {/* Digital QR ID Card */}
          <section data-animate className="bg-[#1a1d23] p-6 rounded-3xl border border-gray-800">
            <p className="text-[10px] font-bold text-[#9ca3af] tracking-widest uppercase mb-4">Digital QR ID Card</p>
            <div className="relative bg-[#0f1115] p-5 rounded-2xl border border-dashed border-gray-700 flex flex-col items-center mb-6">
              <div className="w-full bg-white rounded-xl p-5 flex flex-col items-center">
                
                {/* Real interactive QR code */}
                {qrPayload ? (
                  <div id="qr-code-container" className="p-3 bg-white border border-gray-200 rounded-lg mb-4 flex items-center justify-center shadow-md">
                    <QRCodeCanvas
                      value={qrPayload}
                      size={120}
                      level="H"
                    />
                  </div>
                ) : (
                  <div className="w-full bg-gray-100 h-28 rounded-lg mb-4 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                )}
                
                <p className="text-[9px] font-mono font-bold text-gray-400 tracking-widest uppercase mt-2">
                  Verify Secure ID: {patientId}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <Button variant="primary" fullWidth onClick={handleDownloadPdf}>
                <Download className="h-5 w-5" /> Download QR Card
              </Button>
            </div>
          </section>

          {/* Emergency Contacts */}
          <section data-animate className="bg-[#1a1d23] p-6 rounded-3xl border border-gray-800">
            <div className="flex justify-between items-center mb-5">
              <p className="text-[10px] font-bold text-[#9ca3af] tracking-widest uppercase">Emergency Contacts</p>
              <button
                onClick={() => setShowAddContact(true)}
                className="flex items-center gap-1 text-[10px] font-bold text-[#8b1a1a] hover:text-red-400 transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            </div>

            {/* Add Contact Form */}
            {showAddContact && (
              <div className="mb-4 p-4 bg-[#0f1115]/60 rounded-xl border border-gray-700 space-y-3">
                <p className="text-[10px] font-bold text-[#8b949e] uppercase tracking-widest">New Contact</p>
                <input
                  type="text" placeholder="Full Name" value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  className="w-full bg-[#0d1117] border border-[#30363d] focus:border-[#8b1a1a] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none transition-colors"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text" placeholder="Relationship" value={newContactRel}
                    onChange={(e) => setNewContactRel(e.target.value)}
                    className="bg-[#0d1117] border border-[#30363d] focus:border-[#8b1a1a] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none transition-colors"
                  />
                  <input
                    type="tel" placeholder="Phone Number" value={newContactPhone}
                    onChange={(e) => setNewContactPhone(e.target.value)}
                    className="bg-[#0d1117] border border-[#30363d] focus:border-[#8b1a1a] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none transition-colors"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={handleAddContact} className="flex-1 bg-[#8b1a1a] hover:bg-[#a01e1e] text-white text-xs font-bold py-2 rounded-lg transition-colors cursor-pointer">Save Contact</button>
                  <button onClick={() => setShowAddContact(false)} className="px-4 text-xs text-[#8b949e] hover:text-white border border-[#30363d] rounded-lg transition-colors cursor-pointer">Cancel</button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {emergencyContacts.length === 0 && (
                <p className="text-xs text-[#8b949e] text-center py-3">No emergency contacts added yet.</p>
              )}
              {emergencyContacts.map((c, idx) => (
                <div key={idx} className="flex items-center gap-4 group">
                  <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white">
                    {c.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-white text-sm truncate">{c.name}</h4>
                    <p className="text-[11px] text-[#9ca3af]">{c.rel} • {c.phone}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveContact(idx)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-red-600 hover:text-red-400 transition-all cursor-pointer flex-shrink-0"
                    title="Remove contact"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>

      {/* ── Edit Personal Info Modal ────────────────────────────────── */}
      {showEditModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowEditModal(false); }}
        >
          <div
            className="w-full max-w-md rounded-2xl p-8 shadow-2xl"
            style={{ border: "1px solid #30363d", background: "linear-gradient(180deg,#1a1d23 0%,#0f1115 100%)" }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <UserCircle className="h-6 w-6 text-[#8b1a1a]" />
                <h2 className="text-lg font-bold text-white">Edit Personal Information</h2>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-[#8b949e] hover:text-white transition-colors cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            {editSuccess && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-950/45 border border-emerald-500/30 text-sm text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> Saved successfully!
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#8b949e] mb-1.5 uppercase tracking-wider">Full Name</label>
                <input
                  type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-[#0d1117] border border-[#30363d] focus:border-[#8b1a1a] rounded-lg px-3 py-2.5 text-sm text-white outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#8b949e] mb-1.5 uppercase tracking-wider">Contact Number</label>
                <input
                  type="tel" value={editContact} onChange={(e) => setEditContact(e.target.value)}
                  placeholder="+63 917 000 0000"
                  className="w-full bg-[#0d1117] border border-[#30363d] focus:border-[#8b1a1a] rounded-lg px-3 py-2.5 text-sm text-white outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#8b949e] mb-1.5 uppercase tracking-wider">Home Address</label>
                <input
                  type="text" value={editAddress} onChange={(e) => setEditAddress(e.target.value)}
                  placeholder="Street, Barangay, City"
                  className="w-full bg-[#0d1117] border border-[#30363d] focus:border-[#8b1a1a] rounded-lg px-3 py-2.5 text-sm text-white outline-none transition-colors"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#8b949e] mb-1.5 uppercase tracking-wider">Date of Birth</label>
                  <input
                    type="date" value={editDob} onChange={(e) => setEditDob(e.target.value)}
                    className="w-full bg-[#0d1117] border border-[#30363d] focus:border-[#8b1a1a] rounded-lg px-3 py-2.5 text-sm text-white outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#8b949e] mb-1.5 uppercase tracking-wider">Gender</label>
                  <select
                    value={editGender} onChange={(e) => setEditGender(e.target.value)}
                    className="w-full bg-[#0d1117] border border-[#30363d] focus:border-[#8b1a1a] rounded-lg px-3 py-2.5 text-sm text-white outline-none transition-colors cursor-pointer"
                  >
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 py-3 rounded-xl border border-[#30363d] bg-[#1c2128] hover:bg-[#30363d] text-sm font-semibold text-[#8b949e] hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePersonalInfo}
                disabled={editSaving}
                className="flex-1 flex items-center justify-center gap-2 bg-[#8b1a1a] hover:bg-[#a01e1e] text-white font-bold py-3 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                {editSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                <span>{editSaving ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

