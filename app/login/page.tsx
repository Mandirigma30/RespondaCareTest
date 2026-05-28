"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { Eye, EyeOff, Lock, User, Shield, PlusSquare, ArrowRight } from "lucide-react";
import { FormInput } from "../components/ui/FormInput";

export default function LoginPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [role, setRole] = useState<"patient" | "responder" | "admin">("patient");
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-animate]",
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.55, stagger: 0.08, ease: "power2.out" }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const roleDestinations: Record<string, string> = {
    patient: "/patient/dashboard",
    responder: "/responder/dispatch",
    admin: "/admin/dashboard",
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-[#0d1117] text-white flex flex-col">
      {/* Header */}
      <header className="w-full px-6 py-4 flex justify-between items-center" data-animate>
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-[#8b1a1a] p-1.5 rounded-md">
            <PlusSquare className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">RespondaCare</span>
        </Link>
        <div className="flex items-center gap-2 text-[#8b949e] text-xs font-semibold tracking-widest uppercase">
          <Shield className="h-4 w-4" />
          <span>Secure Portal</span>
        </div>
      </header>

      {/* Main */}
      <main className="flex-grow flex flex-col items-center justify-center px-4 py-12">
        <h1 data-animate className="text-3xl font-bold mb-10 tracking-tight">Welcome Back</h1>

        {/* Login Card */}
        <section
          data-animate
          className="w-full max-w-[540px] rounded-2xl p-8 md:p-10"
          style={{
            border: "1px solid #30363d",
            background: "linear-gradient(180deg, #161b22 0%, #0d1117 100%)",
          }}
        >
          {/* Role Selector */}
          <div className="flex bg-[#0d1117] p-1 rounded-lg mb-8">
            {(["patient", "responder", "admin"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={[
                  "flex-1 py-2 text-sm font-medium rounded-md transition-colors capitalize",
                  role === r ? "bg-[#8b1a1a] text-white shadow-sm" : "text-[#8b949e]",
                ].join(" ")}
              >
                {r === "responder" ? "First Responder" : r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>

          {/* Form */}
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <FormInput
              id="email"
              type="email"
              label={role === "responder" ? "Official Email" : "Email Address"}
              placeholder="Enter your email"
              icon={<User className="h-5 w-5" />}
            />
            <FormInput
              id="password"
              type={showPw ? "text" : "password"}
              label="Password"
              placeholder="••••••••"
              icon={<Lock className="h-5 w-5" />}
              rightElement={
                <button type="button" onClick={() => setShowPw((v) => !v)}>
                  {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              }
            />
            <div className="flex justify-end">
              <Link href="#" className="text-xs text-[#8b1a1a] hover:underline font-medium">Forgot password?</Link>
            </div>
            <Link
              href={roleDestinations[role]}
              className="w-full flex items-center justify-center gap-2 bg-[#8b1a1a] hover:bg-[#a01e1e] text-white font-bold py-4 px-4 rounded-lg transition-colors shadow-lg shadow-red-900/20 group"
            >
              <span>Sign In to Portal</span>
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </form>
        </section>

        <p data-animate className="mt-8 text-sm text-[#8b949e]">
          First time here?{" "}
          <Link href="/register" className="text-[#8b1a1a] font-semibold hover:underline">
            Create an account
          </Link>
        </p>
      </main>

      {/* Footer */}
      <footer className="w-full py-10 flex flex-col items-center space-y-6" data-animate>
        <nav className="flex gap-8 text-[#8b949e] text-sm">
          <Link href="#" className="hover:text-white transition-colors">Support</Link>
          <Link href="#" className="hover:text-white transition-colors">Help Centers</Link>
          <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
        </nav>
        <p className="text-[#8b949e] text-xs">© 2024 RespondaCare Healthcare Systems. All rights reserved.</p>
      </footer>
    </div>
  );
}
