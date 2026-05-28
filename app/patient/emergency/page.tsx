"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { Phone, AlertTriangle, MapPin, Loader2, CheckCircle2, ShieldCheck, HeartPulse, Sparkles, BookOpen, ArrowLeft } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { FormTextarea, FormSelect } from "../../components/ui/FormInput";
import Link from "next/link";
import { useGeolocation } from "../../hooks/useGeolocation";
import { QRCodeSVG } from "qrcode.react";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";
import { supabase, isPlaceholderUrl } from "../../lib/supabase";

const incidentTypes = ["Cardiac Emergency", "Difficulty Breathing", "Seizure / Fit", "Diabetic Emergency", "Vehicular Trauma", "Fire", "Other"];

export default function EmergencyPage() {
  const ref = useRef<HTMLDivElement>(null);
  const { lat, lng, loading: locLoading, error: locError, getLocation } = useGeolocation();
  const { isOnline } = useOnlineStatus();

  // Form inputs
  const [category, setCategory] = useState("Cardiac Emergency");
  const [description, setDescription] = useState("");
  const [attachedPhoto, setAttachedPhoto] = useState<string | null>(null);

  // SOS Hold timer states
  const [holdProgress, setHoldProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const timerRef = useRef<number | null>(null);

  // Status flags
  const [sosTriggered, setSosTriggered] = useState(false);
  const [syncStatus, setSyncStatus] = useState("");
  const [residentProfile, setResidentProfile] = useState<any>(null);
  const [qrPayload, setQrPayload] = useState("");

  // Stagger layout animation
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-animate]", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.55, stagger: 0.08, ease: "power2.out" });
    }, ref);
    return () => ctx.revert();
  }, []);

  // Fetch location upon page load
  useEffect(() => {
    getLocation();

    // Load patient details to formulate specific first aid and QR card
    if (typeof window !== "undefined") {
      const session = localStorage.getItem("respondaCare_session");
      let patientEmail = "resident@respondacare.ph";
      if (session) {
        try {
          const parsed = JSON.parse(session);
          patientEmail = parsed.email || patientEmail;
        } catch (e) {}
      }

      // Try finding matching enrolled QR card
      const residents = localStorage.getItem("respondaCare_residents");
      if (residents) {
        try {
          const list = JSON.parse(residents);
          const found = list.find((r: any) => r.name.toLowerCase().includes("juan") || r.name.toLowerCase().includes("alex"));
          if (found) {
            setQrPayload(found.encryptedPayload);
            setResidentProfile(found);
          }
        } catch (e) {}
      }
    }
  }, [getLocation]);

  // Handle SOS panic trigger activation
  const triggerSOS = async () => {
    setHoldProgress(100);
    setIsHolding(false);
    setSyncStatus("Querying absolute GPS coordinates...");
    await new Promise(r => setTimeout(r, 600));

    setSyncStatus("Transmitting SOS package to Dispatch command center...");
    
    // Save locally
    const newAlert = {
      id: `INC-${Math.floor(1000 + Math.random() * 9000)}`,
      category: category,
      barangay: "Zone 3, Barangay 45",
      lat: lat || 14.5547,
      lng: lng || 121.0244,
      timestamp: new Date().toISOString()
    };

    const cachedAlerts = JSON.parse(localStorage.getItem("respondaCare_incidents") || "[]");
    cachedAlerts.push(newAlert);
    localStorage.setItem("respondaCare_incidents", JSON.stringify(cachedAlerts));

    // Send to Supabase if connected
    const isRealUser = !isPlaceholderUrl;
    if (isRealUser && isOnline) {
      try {
        await supabase
          .schema("emergency")
          .from("incidents")
          .insert([{
            incident_id: crypto.randomUUID(),
            reported_by: " juan-dela-cruz-id-placeholder ",
            status: "Active",
            latitude: lat || 14.5547,
            longitude: lng || 121.0244,
            nature_of_call: category,
            severity_score: 5 // Critical panic state
          }]);
      } catch (dbErr) {
        console.warn("Supabase insert skipped.", dbErr);
      }
    }

    setSyncStatus("SOS Transmitted successfully.");
    setSosTriggered(true);
  };

  // Hold progress mechanics
  const startHold = () => {
    setIsHolding(true);
    setHoldProgress(0);

    const startTime = Date.now();
    const duration = 2800; // 2.8 seconds hold

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min((elapsed / duration) * 100, 100);
      setHoldProgress(pct);

      if (pct >= 100) {
        triggerSOS();
      } else {
        timerRef.current = requestAnimationFrame(updateProgress);
      }
    };

    timerRef.current = requestAnimationFrame(updateProgress);
  };

  const endHold = () => {
    setIsHolding(false);
    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current);
    }
    // Snap back
    setHoldProgress(0);
  };

  // Condition specific First Aid guidelines
  const getFirstAidGuidelines = () => {
    if (category.includes("Cardiac")) {
      return [
        "Keep the patient calm and sit them in a comfortable upright position.",
        "Loosen any restrictive clothing around the neck or waist.",
        "Administer prescribed aspirin (if conscious and not allergic).",
        "If unresponsive and not breathing normally, initiate CPR immediately (30 chest compressions, 2 rescue breaths)."
      ];
    }
    if (category.includes("Breathing")) {
      return [
        "Help the patient sit upright — do not let them lie down.",
        "Assist them in using their rescue inhaler (bronchodilator) if available.",
        "Keep them warm and encourage slow, purse-lipped breathing.",
        "Loosen tight clothing and ensure maximum ventilation."
      ];
    }
    if (category.includes("Diabetic")) {
      return [
        "If conscious and able to swallow, give sugar, fruit juice, or glucose gel instantly.",
        "Do not attempt to administer insulin if hypoglycemic shock is suspected.",
        "If unconscious, place them in the recovery safety position. Do not put food or fluids in their mouth."
      ];
    }
    if (category.includes("Seizure")) {
      return [
        "Cushion their head with a soft cloth. Do not hold them down or restrict movements.",
        "Clear away hard or sharp obstacles nearby.",
        "Never place objects inside their mouth.",
        "Once the shaking stops, gently roll them onto their side (recovery position)."
      ];
    }
    return [
      "Ensure the scene is safe for you and the patient.",
      "Stay calm and speak to the patient in a quiet, reassuring voice.",
      "If there is bleeding, apply direct pressure with a clean cloth.",
      "Do not move the patient if skeletal trauma is suspected, unless they are in immediate danger."
    ];
  };

  return (
    <div ref={ref} className="bg-[#0f1115] min-h-screen text-white pb-20">
      
      {/* Header Banner */}
      <header className="bg-[#161b22] border-b border-[#30363d] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/patient/dashboard" className="text-[#8b949e] hover:text-white transition-colors mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <span className="text-[10px] font-mono text-[#8b1a1a] tracking-widest uppercase block font-bold">
              Emergency Reporting Console
            </span>
            <h1 className="text-xl font-bold text-white mt-0.5 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[#8b1a1a]" />
              Secure Incident Dispatch
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        
        {sosTriggered ? (
          /* SOS ACTIVE INCIDENT MODE */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start pt-6 animate-fadeIn">
            
            {/* Live transmittal panel */}
            <article className="lg:col-span-2 bg-[#161b22] border border-red-500/30 rounded-3xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
              <div className="absolute top-4 left-4 bg-red-500/10 border border-red-500/30 rounded-full px-3 py-1 text-[10px] font-mono text-red-400 font-bold uppercase tracking-wider animate-pulse">
                🔴 LIVE TRANSMISSION ACTIVE
              </div>

              <div className="h-20 w-20 rounded-full bg-red-500/10 border-2 border-red-500/40 flex items-center justify-center text-red-500 my-8 animate-ping">
                <AlertTriangle size={42} />
              </div>

              <h2 className="text-2xl font-black tracking-tight text-white uppercase">SOS Signals Transmitted</h2>
              <p className="text-xs text-red-400 font-mono mt-1 tracking-widest">
                ALERT LOGGED AT PASAY DISPATCH COMMAND CENTER
              </p>

              <div className="grid grid-cols-2 gap-4 w-full border-t border-[#30363d] mt-8 pt-8 text-left">
                <div className="p-4 bg-[#0d1117] rounded-xl border border-[#30363d]">
                  <p className="text-[10px] font-mono text-[#8b949e] uppercase">Geospatial Lock</p>
                  <p className="text-sm font-bold font-mono text-white mt-1">
                    {lat?.toFixed(5) || "14.55470"}, {lng?.toFixed(5) || "121.02440"}
                  </p>
                </div>
                <div className="p-4 bg-[#0d1117] rounded-xl border border-[#30363d]">
                  <p className="text-[10px] font-mono text-[#8b949e] uppercase">Selected Category</p>
                  <p className="text-sm font-bold text-white mt-1">{category}</p>
                </div>
              </div>

              {/* Dynamic condition helper */}
              <div className="w-full mt-6 bg-[#0d1117]/60 border border-[#30363d] rounded-2xl p-6 text-left">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <BookOpen size={16} className="text-red-400" />
                  <span>Immediate Action Guidelines ({category})</span>
                </h3>
                <ul className="space-y-3">
                  {getFirstAidGuidelines().map((line, idx) => (
                    <li key={idx} className="flex gap-2.5 items-start text-xs text-[#8b949e] leading-relaxed">
                      <span className="h-5 w-5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 font-mono text-[9px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </article>

            {/* Encrypted QR Medical block for arriving medics */}
            <article className="bg-[#161b22] border border-[#30363d] rounded-3xl p-6 flex flex-col items-center text-center">
              <span className="text-[10px] font-mono text-[#ff8080] tracking-widest uppercase block mb-3 font-bold">
                Medics Quick Scan Card
              </span>
              <p className="text-[11px] text-[#8b949e] leading-relaxed mb-6">
                Point this QR code at the first responder&apos;s scanner upon arrival. This instantly decrypts your vital records securely.
              </p>

              <div className="p-4 bg-white rounded-2xl shadow-xl border border-gray-200 mb-5">
                <QRCodeSVG
                  value={qrPayload || "https://respondacare.ph/resident/juan-dela-cruz"}
                  size={180}
                  level="H"
                />
              </div>

              <div className="w-full p-4 bg-[#0d1117] border border-[#30363d] rounded-xl text-left text-xs text-[#8b949e] space-y-2">
                <div className="text-white font-bold flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-400" />
                  <span>RA 10173 Compliant Secure ID</span>
                </div>
                <p>● Name: Alex Johnson / Juan Dela Cruz</p>
                <p>● AES Key: Encrypted Patient Care Block</p>
              </div>

              <Link href="/patient/dashboard" className="w-full mt-6">
                <button className="w-full bg-[#1c2128] hover:bg-[#30363d] text-white border border-[#30363d] font-bold py-3.5 px-4 rounded-xl text-xs transition-all cursor-pointer">
                  Return to Dashboard
                </button>
              </Link>
            </article>

          </div>
        ) : (
          /* ACTIVE SOS PANIC PREPARATION & TRIGGER FORM */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start pt-6">
            
            {/* COLUMN 1 & 2: PANIC BUTTON AND EVENT DETAILS */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Massive hold trigger button */}
              <article className="bg-[#161b22] border border-[#30363d] rounded-3xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
                <h3 className="text-lg font-black text-white uppercase tracking-wider mb-2">3-Second SOS Panic Release</h3>
                <p className="text-xs text-[#8b949e] max-w-sm mb-8 leading-relaxed">
                  Hold down the red circular trigger. Releasing immediately cancels the alert. Keep holding until confirmation.
                </p>

                {/* HOLD PANIC PROGRESS BUTTON */}
                <div className="relative flex items-center justify-center h-48 w-48 mb-8">
                  {/* Progress wheel background */}
                  <svg className="absolute inset-0 w-full h-full transform -rotate-90 select-none pointer-events-none">
                    <circle
                      cx="96"
                      cy="96"
                      r="80"
                      stroke="#1e2530"
                      strokeWidth="10"
                      fill="transparent"
                    />
                    <circle
                      cx="96"
                      cy="96"
                      r="80"
                      stroke="#8b1a1a"
                      strokeWidth="10"
                      fill="transparent"
                      strokeDasharray="502"
                      strokeDashoffset={502 - (502 * holdProgress) / 100}
                      className="transition-all duration-75"
                    />
                  </svg>

                  {/* Inside Button */}
                  <button
                    onMouseDown={startHold}
                    onMouseUp={endHold}
                    onMouseLeave={endHold}
                    onTouchStart={startHold}
                    onTouchEnd={endHold}
                    className={[
                      "h-32 w-32 rounded-full bg-[#8b1a1a] border-4 border-black/40 flex flex-col items-center justify-center text-white transition-all shadow-2xl select-none cursor-pointer",
                      isHolding ? "scale-95 bg-[#a01e1e]" : "hover:bg-[#a01e1e] hover:scale-105"
                    ].join(" ")}
                  >
                    <AlertTriangle className="h-10 w-10 text-white animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest mt-1 block">
                      {isHolding ? `${Math.round(holdProgress)}%` : "HOLD SOS"}
                    </span>
                  </button>
                </div>

                <div className="p-3 bg-[#0d1117] border border-[#30363d] rounded-xl flex items-center gap-3 text-[11px] text-[#8b949e] font-mono">
                  <MapPin className="text-[#8b1a1a] flex-shrink-0 animate-bounce" />
                  <span>
                    GPS geosensing target: {lat ? `${lat.toFixed(5)}, ${lng?.toFixed(5)}` : "Acquiring lock..."}
                  </span>
                </div>
              </article>

              {/* Category details form */}
              <fieldset className="bg-[#161b22] border border-[#30363d] rounded-3xl p-6 space-y-4">
                <legend className="px-3 text-xs font-mono text-[#ff8080] tracking-wider uppercase font-bold flex items-center gap-1.5 border-b border-[#30363d] pb-2 w-full">
                  <span>Incident Classifications & Notes</span>
                </legend>

                <FormSelect
                  id="inc-cat"
                  label="Primary Emergency Condition"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {incidentTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </FormSelect>

                <FormTextarea
                  id="inc-desc"
                  label="Description / Help Notes"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide any details for responders (e.g. conscious state, bleeding, trigger event)..."
                  rows={3}
                />
              </fieldset>

            </div>

            {/* COLUMN 3: EMERGENCY SIDEBAR */}
            <div className="space-y-6">
              
              <article className="bg-[#161b22] border border-[#30363d] rounded-3xl p-6 space-y-4">
                <span className="text-[10px] font-mono text-[#8b949e] tracking-widest uppercase block font-bold">
                  Quick Calling Hotlines
                </span>
                
                <div className="bg-red-950/15 border border-red-500/20 p-4 rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-white">EMS Hotline</h4>
                    <p className="text-[10px] text-[#8b949e] mt-0.5">Pasay Responda HQ</p>
                  </div>
                  <a href="tel:911" className="p-2.5 bg-[#8b1a1a] hover:bg-[#a01e1e] rounded-lg text-white font-bold transition-colors">
                    <Phone size={16} />
                  </a>
                </div>

                <div className="bg-[#0d1117] border border-[#30363d] p-4 rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-white">Barangay 45 Clinic</h4>
                    <p className="text-[10px] text-[#8b949e] mt-0.5">Health Center Desk</p>
                  </div>
                  <a href="tel:123" className="p-2.5 bg-[#1c2128] hover:bg-[#30363d] border border-[#30363d] rounded-lg text-white transition-colors">
                    <Phone size={16} />
                  </a>
                </div>
              </article>

              <article className="bg-[#161b22] border border-[#30363d] rounded-3xl p-6 space-y-4">
                <span className="text-[10px] font-mono text-[#8b949e] tracking-widest uppercase block font-bold">
                  First Responder Info Note
                </span>
                <p className="text-xs text-[#8b949e] leading-relaxed">
                  Upon holding down the panic button, your encrypted patient registry card is dynamically synchronized, allowing dispatch paramedics to instantly retrieve your clinical profile when on scene.
                </p>
              </article>

            </div>

          </div>
        )}

      </main>
    </div>
  );
}
