"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { User, Mail, Lock, Phone, BadgeCheck, PlusSquare, Shield, ArrowRight } from "lucide-react";
import { FormInput, FormSelect } from "../../components/ui/FormInput";

export default function ResponderRegisterPage() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-animate]", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.55, stagger: 0.08, ease: "power2.out" });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={ref} className="min-h-screen bg-[#0d1117] text-white flex flex-col">
      <header className="w-full px-6 py-4 flex justify-between items-center" data-animate>
        <Link href="/" className="flex items-center gap-2">
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
          <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-2 gap-4">
              <FormInput id="fr-first-name" label="First Name" placeholder="Maria" icon={<User className="h-4 w-4" />} />
              <FormInput id="fr-last-name" label="Last Name" placeholder="Santos" icon={<User className="h-4 w-4" />} />
            </div>
            <FormInput id="fr-email" type="email" label="Official Email" placeholder="m.santos@redcross.org.ph" icon={<Mail className="h-4 w-4" />} />
            <FormInput id="fr-phone" type="tel" label="Phone / Radio Number" placeholder="+63 9XX XXX XXXX" icon={<Phone className="h-4 w-4" />} />
            <FormInput id="fr-badge" label="Badge / Employee ID" placeholder="RC-MNLA-0042" icon={<BadgeCheck className="h-4 w-4" />} />
            <FormSelect id="fr-unit" label="Unit / Organization">
              <option value="">Select your unit...</option>
              <option>Philippine Red Cross — Manila Chapter</option>
              <option>Barangay Health Emergency Response Team</option>
              <option>Bureau of Fire Protection</option>
              <option>Philippine National Police — Health Unit</option>
            </FormSelect>
            <FormSelect id="fr-role" label="Responder Role">
              <option value="">Select your role...</option>
              <option>Paramedic</option>
              <option>EMT</option>
              <option>BHW (Barangay Health Worker)</option>
              <option>Field Coordinator</option>
            </FormSelect>
            <FormInput id="fr-password" type="password" label="Password" placeholder="Create a strong password" icon={<Lock className="h-4 w-4" />} />

            <div className="flex items-start gap-3 pt-2">
              <input type="checkbox" id="fr-dpa" className="mt-1 accent-[#8b1a1a]" />
              <label htmlFor="fr-dpa" className="text-xs text-[#8b949e] leading-relaxed">
                I certify my credentials are accurate and consent to data processing under{" "}
                <Link href="#" className="text-[#8b1a1a] hover:underline">RA 10173</Link>.
              </label>
            </div>

            <Link href="/responder/dispatch"
              className="w-full flex items-center justify-center gap-2 bg-[#8b1a1a] hover:bg-[#a01e1e] text-white font-bold py-4 rounded-lg transition-colors">
              <span>Submit for Verification</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </form>
        </section>

        <p data-animate className="mt-8 text-sm text-[#8b949e]">
          Already registered?{" "}
          <Link href="/login" className="text-[#8b1a1a] font-semibold hover:underline">Sign In</Link>
        </p>
      </main>
    </div>
  );
}
