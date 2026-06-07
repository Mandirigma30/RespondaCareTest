import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { User, Mail, Lock, Phone, BadgeCheck, PlusSquare, Shield, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { FormInput, FormSelect } from "../components/ui/FormInput";
import { supabase, isPlaceholderUrl } from "../lib/supabase";

export default function RegisterResponderPage() {
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Input states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [badge, setBadge] = useState("");
  const [unit, setUnit] = useState("");
  const [responderRole, setResponderRole] = useState("");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);

  // Status states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-animate]", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.55, stagger: 0.08, ease: "power2.out" });
    }, ref);
    return () => ctx.revert();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password || !responderRole) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!consent) {
      setError("You must certify your credentials and consent to data processing.");
      return;
    }

    setLoading(true);

    try {
      // Map user metadata role: BHW selection gets "bhw", others get "responder"
      let metadataRole = "responder";
      if (responderRole.includes("BHW") || responderRole.toLowerCase().includes("health worker")) {
        metadataRole = "bhw";
      }

      if (isPlaceholderUrl) {
        // Mock register flow
        localStorage.setItem(
          "respondaCare_session",
          JSON.stringify({
            role: metadataRole,
            email: email.trim().toLowerCase(),
            name: `${firstName} ${lastName}`,
            live: false
          })
        );
        navigate(metadataRole === "bhw" ? "/admin/dashboard" : "/responder/dispatch");
      } else {
        // Supabase register flow
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password: password,
          options: {
            data: {
              full_name: `${firstName} ${lastName}`,
              role: metadataRole,
              phone: phone,
              badge: badge,
              unit: unit,
              responder_role: responderRole
            }
          }
        });

        if (signUpError) throw signUpError;

        if (data.user) {
          const session = (await supabase.auth.getSession()).data.session;

          localStorage.setItem(
            "respondaCare_session",
            JSON.stringify({
              role: metadataRole,
              email: email.trim().toLowerCase(),
              name: `${firstName} ${lastName}`,
              auth_uid: data.user.id,
              live: true
            })
          );

          if (!session) {
            alert("Registration successful! If email confirmation is enabled, please verify your email before logging in.");
          }

          navigate(metadataRole === "bhw" ? "/admin/dashboard" : "/responder/dispatch");
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={ref} className="min-h-screen bg-[#0d1117] text-white flex flex-col">
      <header className="w-full px-6 py-4 flex justify-between items-center" data-animate>
        <Link to="/" className="flex items-center gap-2">
          <div className="bg-[#8b1a1a] p-1.5 rounded-md"><PlusSquare className="h-6 w-6 text-white" /></div>
          <span className="text-xl font-bold tracking-tight">RespondaCare</span>
        </Link>
        <div className="flex items-center gap-2 text-[#8b949e] text-xs font-semibold tracking-widest uppercase">
          <Shield className="h-4 w-4" /><span>Responder Registration</span>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center px-4 py-12">
        <div data-animate className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight">First Responder Registration</h1>
          <p className="text-[#8b949e] mt-2 text-sm">For Red Cross and Emergency Personnel — verification required</p>
        </div>

        <section data-animate className="w-full max-w-[580px] rounded-2xl p-8 md:p-10"
          style={{ border: "1px solid #30363d", background: "linear-gradient(180deg, #161b22 0%, #0d1117 100%)" }}>
          
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-950/45 border border-[#a01e1e] text-sm text-red-300 flex items-center gap-2 font-mono">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <FormInput 
                id="fr-first-name" 
                label="First Name" 
                placeholder="Maria" 
                icon={<User className="h-4 w-4" />} 
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
              <FormInput 
                id="fr-last-name" 
                label="Last Name" 
                placeholder="Santos" 
                icon={<User className="h-4 w-4" />} 
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
            <FormInput 
              id="fr-email" 
              type="email" 
              label="Official Email" 
              placeholder="m.santos@redcross.org.ph" 
              icon={<Mail className="h-4 w-4" />} 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <FormInput 
              id="fr-phone" 
              type="tel" 
              label="Phone / Radio Number" 
              placeholder="+63 9XX XXX XXXX" 
              icon={<Phone className="h-4 w-4" />} 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <FormInput 
              id="fr-badge" 
              label="Badge / Employee ID" 
              placeholder="RC-MNLA-0042" 
              icon={<BadgeCheck className="h-4 w-4" />} 
              value={badge}
              onChange={(e) => setBadge(e.target.value)}
            />
            <FormSelect 
              id="fr-unit" 
              label="Unit / Organization"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              required
            >
              <option value="">Select your unit...</option>
              <option value="Philippine Red Cross — Manila Chapter">Philippine Red Cross — Manila Chapter</option>
              <option value="Barangay Health Emergency Response Team">Barangay Health Emergency Response Team</option>
              <option value="Bureau of Fire Protection">Bureau of Fire Protection</option>
              <option value="Philippine National Police — Health Unit">Philippine National Police — Health Unit</option>
            </FormSelect>
            <FormSelect 
              id="fr-role" 
              label="Responder Role"
              value={responderRole}
              onChange={(e) => setResponderRole(e.target.value)}
              required
            >
              <option value="">Select your role...</option>
              <option value="Paramedic">Paramedic</option>
              <option value="EMT">EMT</option>
              <option value="BHW (Barangay Health Worker)">BHW (Barangay Health Worker)</option>
              <option value="Field Coordinator">Field Coordinator</option>
            </FormSelect>
            <FormInput 
              id="fr-password" 
              type="password" 
              label="Password" 
              placeholder="Create a strong password" 
              icon={<Lock className="h-4 w-4" />} 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="flex items-start gap-3 pt-2">
              <input 
                type="checkbox" 
                id="fr-dpa" 
                className="mt-1 accent-[#8b1a1a]" 
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              <label htmlFor="fr-dpa" className="text-xs text-[#8b949e] leading-relaxed">
                I certify my credentials are accurate and consent to data processing under{" "}
                <Link to="#" className="text-[#8b1a1a] hover:underline">RA 10173</Link>.
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#8b1a1a] hover:bg-[#a01e1e] text-white font-bold py-4 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <span>Submit for Verification</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>
        </section>

        <p data-animate className="mt-8 text-sm text-[#8b949e]">
          Already registered?{" "}
          <Link to="/login" className="text-[#8b1a1a] font-semibold hover:underline">Sign In</Link>
        </p>
      </main>
    </div>
  );
}
