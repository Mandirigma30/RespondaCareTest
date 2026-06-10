import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Shield, User, Radio, ArrowRight, PlusSquare } from "lucide-react";

export default function GatewayPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hash = window.location.hash;
    const search = window.location.search;
    if (hash.includes("type=recovery") || search.includes("type=recovery") || hash.includes("access_token")) {
      window.location.href = `/login${search}${hash}`;
    }
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-animate]",
        { opacity: 0, y: 32 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.12, ease: "power2.out" }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen bg-[#0c0f16] text-white flex flex-col">
      {/* Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-8 flex justify-between items-center" data-animate>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#8b1a1a] rounded-lg flex items-center justify-center shadow-lg">
            <PlusSquare className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">RespondaCare</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold tracking-widest text-[#8b949e] uppercase">
          <Shield className="h-4 w-4" />
          <span>Secure Portal</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center px-6 py-12">
        <h1
          data-animate
          className="text-5xl md:text-6xl font-extrabold text-center mb-4 tracking-tight"
        >
          Welcome to RespondaCare
        </h1>
        <p data-animate className="text-[#8b949e] text-center mb-16 max-w-lg">
          Connecting barangay communities with fast, coordinated emergency response.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl">
          {/* Resident Card */}
          <article data-animate className="group hover-lift bg-[#161b22] rounded-2xl overflow-hidden border border-gray-800 flex flex-col shadow-2xl">
            <div
              className="h-64 flex items-center justify-center"
              style={{ background: "linear-gradient(180deg, rgba(61,36,42,1) 0%, rgba(30,20,25,1) 100%)" }}
            >
              <User className="h-24 w-24 text-white opacity-80 group-hover:scale-110 transition-transform duration-300" />
            </div>
            <div className="p-8 flex flex-col flex-grow">
              <div className="mb-4">
                <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-[#f87171]"
                  style={{ background: "rgba(139,26,26,0.2)" }}>
                  Residents
                </span>
              </div>
              <h2 className="text-2xl font-bold mb-4">Resident Portal</h2>
              <p className="text-[#8b949e] leading-relaxed mb-10 flex-grow">
                Access your electronic health records, update emergency contacts, and manage your medical ID for first responders.
              </p>
              <Link
                to="/login"
                className="w-full bg-[#8b1a1a] hover:bg-[#a01e1e] text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors duration-200"
              >
                <span>Login as Patient</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </article>

          {/* Responder Card */}
          <article data-animate className="group hover-lift bg-[#161b22] rounded-2xl overflow-hidden border border-gray-800 flex flex-col shadow-2xl">
            <div
              className="h-64 flex items-center justify-center"
              style={{ background: "linear-gradient(180deg, rgba(61,36,42,1) 0%, rgba(30,20,25,1) 100%)" }}
            >
              <Radio className="h-24 w-24 text-white opacity-80 group-hover:scale-110 transition-transform duration-300" />
            </div>
            <div className="p-8 flex flex-col flex-grow">
              <div className="mb-4">
                <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-[#f87171]"
                  style={{ background: "rgba(139,26,26,0.2)" }}>
                  Emergency Services
                </span>
              </div>
              <h2 className="text-2xl font-bold mb-4">Responder Portal</h2>
              <p className="text-[#8b949e] leading-relaxed mb-10 flex-grow">
                Monitor real-time emergency alerts, view critical patient data in the field, and coordinate response efforts with dispatch.
              </p>
              <Link
                to="/login"
                className="w-full bg-[#8b1a1a] hover:bg-[#a01e1e] text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors duration-200"
              >
                <span>Login as First Responder</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/register/responder"
                className="mt-3 text-center w-full text-xs text-[#8b1a1a] hover:underline font-semibold block"
              >
                New responder? Register here
              </Link>
            </div>
          </article>
        </div>

        {/* Admin Link */}
        <p data-animate className="mt-10 text-sm text-[#8b949e]">
          System Administrator?{" "}
          <Link to="/login" className="text-[#8b1a1a] hover:underline font-semibold">
            Access Command Center
          </Link>
        </p>
      </main>

      {/* Footer */}
      <footer className="w-full py-10 flex flex-col items-center space-y-6" data-animate>
        <nav className="flex items-center gap-6 text-sm text-[#8b949e]">
          <Link to="#" className="hover:text-white transition-colors">Privacy Policy</Link>
          <span className="w-1 h-1 bg-gray-700 rounded-full" />
          <Link to="#" className="hover:text-white transition-colors">Terms of Service</Link>
          <span className="w-1 h-1 bg-gray-700 rounded-full" />
          <Link to="#" className="hover:text-white transition-colors">Help Center</Link>
        </nav>
        <p className="text-[11px] text-gray-600 font-medium tracking-wide uppercase">
          © 2024 RespondaCare. Supporting local Barangay emergency networks.
        </p>
      </footer>
    </div>
  );
}
