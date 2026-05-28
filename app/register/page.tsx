"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { User, Mail, Lock, Phone, PlusSquare, Shield, ArrowRight } from "lucide-react";
import { FormInput, FormSelect } from "../components/ui/FormInput";

export default function RegisterPage() {
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
          <Shield className="h-4 w-4" /><span>Secure Registration</span>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center px-4 py-12">
        <div data-animate className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight">Create Your Account</h1>
          <p className="text-[#8b949e] mt-2 text-sm">Join the RespondaCare community health network</p>
        </div>

        <section data-animate className="w-full max-w-[580px] rounded-2xl p-8 md:p-10"
          style={{ border: "1px solid #30363d", background: "linear-gradient(180deg, #161b22 0%, #0d1117 100%)" }}>
          <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-2 gap-4">
              <FormInput id="first-name" label="First Name" placeholder="Juan" icon={<User className="h-4 w-4" />} />
              <FormInput id="last-name" label="Last Name" placeholder="dela Cruz" icon={<User className="h-4 w-4" />} />
            </div>
            <FormInput id="reg-email" type="email" label="Email Address" placeholder="juan@example.com" icon={<Mail className="h-4 w-4" />} />
            <FormInput id="reg-phone" type="tel" label="Phone Number" placeholder="+63 9XX XXX XXXX" icon={<Phone className="h-4 w-4" />} />
            <FormSelect id="barangay" label="Barangay">
              <option value="">Select your barangay...</option>
              <option>Barangay 45 — Tondo</option>
              <option>Barangay 46 — Tondo</option>
              <option>Barangay 47 — Tondo</option>
            </FormSelect>
            <FormInput id="reg-password" type="password" label="Password" placeholder="Create a strong password" icon={<Lock className="h-4 w-4" />} />
            <FormInput id="confirm-password" type="password" label="Confirm Password" placeholder="Re-enter password" icon={<Lock className="h-4 w-4" />} />

            <div className="flex items-start gap-3 pt-2">
              <input type="checkbox" id="dpa-consent" className="mt-1 accent-[#8b1a1a]" />
              <label htmlFor="dpa-consent" className="text-xs text-[#8b949e] leading-relaxed">
                I consent to the processing of my personal data under{" "}
                <Link href="#" className="text-[#8b1a1a] hover:underline">RA 10173 (Data Privacy Act)</Link>{" "}
                for the purpose of barangay health emergency coordination.
              </label>
            </div>

            <Link href="/patient/dashboard"
              className="w-full flex items-center justify-center gap-2 bg-[#8b1a1a] hover:bg-[#a01e1e] text-white font-bold py-4 rounded-lg transition-colors">
              <span>Create Account</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </form>
        </section>

        <p data-animate className="mt-8 text-sm text-[#8b949e]">
          Already registered?{" "}
          <Link href="/login" className="text-[#8b1a1a] font-semibold hover:underline">Sign In</Link>
        </p>
        <p data-animate className="mt-2 text-sm text-[#8b949e]">
          First Responder?{" "}
          <Link href="/register/responder" className="text-[#8b1a1a] font-semibold hover:underline">Register as First Responder</Link>
        </p>
      </main>
    </div>
  );
}
