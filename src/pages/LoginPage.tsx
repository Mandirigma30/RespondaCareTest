import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { gsap } from "gsap";
import { Eye, EyeOff, Lock, User, Shield, PlusSquare, ArrowRight, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { FormInput } from "../components/ui/FormInput";
import { supabase, isPlaceholderUrl } from "../lib/supabase";

// Sandbox credential map: email → role
const SANDBOX_USERS: Record<string, { role: "patient" | "responder" | "admin"; name: string; secret: string }> = {
  "admin@respondacare.ph":     { role: "admin",     name: "Dispatch Admin", secret: "JBSWY3DPEHPK3PXP" }, // Hello! in base32
  "responder@respondacare.ph": { role: "responder", name: "Medic Unit Alpha", secret: "MFRGGZDFMZTWQ2LK" }, // Responder in base32
  "resident@respondacare.ph":  { role: "patient",   name: "Juan Dela Cruz", secret: "" },
};

const SANDBOX_PASSWORD = "password123";

// Helper functions for client-side WebCrypto TOTP validation
function base32tohex(base32: string) {
  const base32chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  let hex = "";
  for (let i = 0; i < base32.length; i++) {
    const val = base32chars.indexOf(base32.charAt(i).toUpperCase());
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }
  for (let i = 0; i + 4 <= bits.length; i += 4) {
    const chunk = bits.substr(i, 4);
    hex = hex + parseInt(chunk, 2).toString(16);
  }
  return hex;
}

async function hex2buf(hex: string): Promise<Uint8Array> {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

async function getTOTPAtTime(secretBase32: string, time: number): Promise<string> {
  try {
    const keyHex = base32tohex(secretBase32);
    const keyBytes = await hex2buf(keyHex);
    const timeHex = time.toString(16).padStart(16, '0');
    const timeBytes = await hex2buf(timeHex);

    const cryptoKey = await window.crypto.subtle.importKey(
      "raw",
      keyBytes as any,
      { name: "HMAC", hash: { name: "SHA-1" } },
      false,
      ["sign"]
    );

    const signature = await window.crypto.subtle.sign(
      "HMAC",
      cryptoKey,
      timeBytes as any
    );

    const hmac = new Uint8Array(signature);
    const offset = hmac[hmac.length - 1] & 0xf;
    const otp = (
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff)
    ) % 1000000;

    return otp.toString().padStart(6, '0');
  } catch (err) {
    console.error("TOTP derivation error", err);
    return "";
  }
}

async function verifyTOTP(secretBase32: string, code: string): Promise<boolean> {
  const cleanSecret = secretBase32.replace(/=/g, "").replace(/\s/g, "");
  const epoch = Math.round(new Date().getTime() / 1000.0);
  const time = Math.floor(epoch / 30);
  
  for (let i = -1; i <= 1; i++) {
    const calcCode = await getTOTPAtTime(cleanSecret, time + i);
    if (calcCode === code) return true;
  }
  return false;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // State variables
  const [role, setRole] = useState<"patient" | "responder" | "admin" >("patient");
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Credentials, 2: MFA TOTP, 3: Shift Key
  const [shiftKey, setShiftKey] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [detectedRole, setDetectedRole] = useState<"patient" | "responder" | "admin" | null>(null);
  const [currentOtpCode, setCurrentOtpCode] = useState("");

  // Forgot Password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotStatus, setForgotStatus] = useState<"idle" | "sent" | "error">("idle");
  const [forgotError, setForgotError] = useState("");

  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setForgotError("Please enter your email address.");
      return;
    }
    setForgotLoading(true);
    setForgotError("");
    try {
      if (!isPlaceholderUrl) {
        const { error: resetErr } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
          redirectTo: `${window.location.origin}/login`,
        });
        if (resetErr) throw resetErr;
      }
      // Sandbox: just pretend it worked
      setForgotStatus("sent");
    } catch (err: any) {
      setForgotError(err.message || "Failed to send reset email.");
      setForgotStatus("error");
    } finally {
      setForgotLoading(false);
    }
  };

  // References for OTP fields focus management
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (step === 2) {
      const trimmedEmail = email.trim().toLowerCase();
      const sandboxUser = SANDBOX_USERS[trimmedEmail];
      if (sandboxUser && sandboxUser.secret) {
        const updateOtp = async () => {
          const epoch = Math.round(new Date().getTime() / 1000.0);
          const time = Math.floor(epoch / 30);
          const code = await getTOTPAtTime(sandboxUser.secret, time);
          setCurrentOtpCode(code);
        };
        updateOtp();
        const interval = setInterval(updateOtp, 1000);
        return () => clearInterval(interval);
      }
    }
  }, [step, email]);

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

  // Focus the first OTP box when transitioning to step 2
  useEffect(() => {
    if (step === 2 && otpRefs.current[0]) {
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    }
  }, [step]);

  // Handle credentials check (Step 1)
  const handleCredentialSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please fill in all credential fields.");
      return;
    }

    setLoading(true);
    // Simulate natural networking latency
    await new Promise((resolve) => setTimeout(resolve, 800));

    try {
      const trimmedEmail = email.trim().toLowerCase();
      const sandboxUser = SANDBOX_USERS[trimmedEmail];
      const isSandboxUser = sandboxUser && password === SANDBOX_PASSWORD;
      const isRealUser = !isPlaceholderUrl;

      if (isRealUser) {
        try {
          const { data: sbData, error: sbError } = await supabase.auth.signInWithPassword({
            email: trimmedEmail,
            password: password,
          });
          if (sbError) throw sbError;

          // Fetch the user's real name from security.users table
          if (sbData?.user) {
            const { data: userData } = await supabase
              .schema("security")
              .from("users")
              .select("full_name, role_id")
              .eq("auth_uid", sbData.user.id)
              .maybeSingle();

            // Map role_id to role string
            const roleMap: Record<number, "patient" | "responder" | "admin"> = {
              1: "admin", 2: "admin", 3: "patient", 4: "responder", 5: "responder"
            };
            const realRole = userData?.role_id ? (roleMap[userData.role_id] || role) : role;
            const realName = userData?.full_name || sbData.user.user_metadata?.full_name || sbData.user.email || trimmedEmail;

            // Clear stale offline demo data
            localStorage.removeItem("respondaCare_session");
            localStorage.removeItem("respondaCare_residents");

            // Save live session
            localStorage.setItem(
              "respondaCare_session",
              JSON.stringify({
                role: realRole,
                email: trimmedEmail,
                name: realName,
                auth_uid: sbData.user.id,
                live: true
              })
            );

            setDetectedRole(realRole);
            setSuccess(true);
            await new Promise((r) => setTimeout(r, 600));
            
            if (realRole === "patient") {
              navigate("/patient/dashboard");
            } else {
              setStep(2); // Proceed to MFA
            }
            return;
          }
        } catch (err: any) {
          // Fallback: check if the user exists in our security.users table with the matching password
          try {
            const { data: dbUser, error: dbErr } = await supabase
              .schema("security")
              .from("users")
              .select("user_id, full_name, role_id, password_hash")
              .eq("email", trimmedEmail)
              .maybeSingle();

            if (!dbErr && dbUser && dbUser.password_hash === password) {
              const roleMap: Record<number, "patient" | "responder" | "admin"> = {
                1: "admin", 2: "admin", 3: "patient", 4: "responder", 5: "responder"
              };
              const realRole = roleMap[dbUser.role_id] || role;
              const realName = dbUser.full_name;

              // Clear any stale active Supabase Auth session token
              await supabase.auth.signOut().catch(() => {});

              localStorage.removeItem("respondaCare_session");
              localStorage.removeItem("respondaCare_residents");

              localStorage.setItem(
                "respondaCare_session",
                JSON.stringify({
                  role: realRole,
                  email: trimmedEmail,
                  name: realName,
                  auth_uid: dbUser.user_id,
                  live: true
                })
              );

              setDetectedRole(realRole);
              setSuccess(true);
              await new Promise((r) => setTimeout(r, 600));

              if (realRole === "patient") {
                navigate("/patient/dashboard");
              } else {
                setStep(2); // Proceed to MFA
              }
              return;
            }
          } catch (e) {
            console.error("Database fallback auth failed:", e);
          }

          if (!isSandboxUser) {
            throw err;
          }
        }
      }

      // Offline mock / Sandbox fallback
      if (isSandboxUser) {
        // Store detected role for routing
        const finalRole = sandboxUser?.role || role;
        setDetectedRole(finalRole);

        // Residents (patients) bypass MFA and go straight to dashboard
        if (finalRole === "patient") {
          localStorage.setItem(
            "respondaCare_session",
            JSON.stringify({
              role: "patient",
              email: trimmedEmail,
              name: sandboxUser?.name || trimmedEmail,
              live: false
            })
          );
          setSuccess(true);
          await new Promise((r) => setTimeout(r, 600));
          navigate("/patient/dashboard");
        } else {
          setStep(2); // Proceed to MFA
        }
      } else {
        setError(
          "Invalid credentials. Demo logins: admin@respondacare.ph | responder@respondacare.ph | resident@respondacare.ph (Password: password123)"
        );
      }
    } catch (err: any) {
      setError(err.message || "Authentication error. Please check credentials.");
    } finally {
      setLoading(false);
    }
  };

  // Handle MFA OTP entry change
  const handleOtpChange = (index: number, val: string) => {
    const cleanVal = val.replace(/[^0-9]/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = cleanVal;
    setOtp(newOtp);

    // Auto-advance focus to next input
    if (cleanVal !== "" && index < 5 && otpRefs.current[index + 1]) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspaces in OTP entry
  const handleOtpKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && otp[index] === "" && index > 0 && otpRefs.current[index - 1]) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // Handle MFA check (Step 2)
  const handleMfaSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    const token = otp.join("");
    if (token.length !== 6) {
      setError("Please enter the full 6-digit verification code.");
      return;
    }

    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    try {
      const trimmedEmail = email.trim().toLowerCase();
      const sandboxUser = SANDBOX_USERS[trimmedEmail];
      const finalRole = detectedRole || sandboxUser?.role || "responder";
      const isRealUser = !isPlaceholderUrl;

      let isVerified = false;
      if (sandboxUser && sandboxUser.secret) {
        isVerified = await verifyTOTP(sandboxUser.secret, token);
      } else {
        isVerified = token === "123456" || isRealUser;
      }

      if (isVerified || isRealUser) {
        if (finalRole === "responder") {
          setStep(3);
        } else {
          // Save session with role mapping
          localStorage.setItem(
            "respondaCare_session",
            JSON.stringify({
              role: finalRole,
              email: trimmedEmail,
              name: sandboxUser?.name || trimmedEmail,
              live: isRealUser
            })
          );

          setSuccess(true);
          await new Promise((resolve) => setTimeout(resolve, 600));
          navigate("/admin/dashboard");
        }
      } else {
        setError("Invalid security token. Please enter the correct Authenticator code.");
      }
    } catch (err: any) {
      setError(err.message || "MFA validation failed.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Shift Key validation (Step 3)
  const handleShiftKeySubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!shiftKey.trim()) {
      setError("Please enter the active shift authentication key.");
      return;
    }

    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));

    try {
      const trimmedEmail = email.trim().toLowerCase();
      const sandboxUser = SANDBOX_USERS[trimmedEmail];
      const isRealUser = !isPlaceholderUrl;

      let isValid = false;
      if (isRealUser) {
        const { data, error: rpcError } = await supabase
          .rpc("verify_shift_key", { p_key: shiftKey.trim() });
        if (rpcError) throw rpcError;
        isValid = !!data;
      } else {
        isValid = shiftKey.trim() === "RESP-ABCD-1234-EFGH";
      }

      if (isValid) {
        // Save session with role mapping
        localStorage.setItem(
          "respondaCare_session",
          JSON.stringify({
            role: "responder",
            email: trimmedEmail,
            name: sandboxUser?.name || "Field Responder",
            live: isRealUser
          })
        );

        setSuccess(true);
        await new Promise((resolve) => setTimeout(resolve, 600));
        navigate("/responder/dispatch");
      } else {
        setError("Invalid shift key. Please contact the administrator to get today's active shift key.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to validate shift key.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-[#0d1117] text-white flex flex-col">
      {/* Header */}
      <header className="w-full px-6 py-4 flex justify-between items-center" data-animate>
        <Link to="/" className="flex items-center gap-2">
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
        <h1 data-animate className="text-3xl font-bold mb-10 tracking-tight">
          {step === 1 ? "Welcome Back" : "Security Verification"}
        </h1>

        {/* Login Card */}
        <section
          data-animate
          className="w-full max-w-[540px] rounded-2xl p-8 md:p-10 shadow-2xl"
          style={{
            border: "1px solid #30363d",
            background: "linear-gradient(180deg, #161b22 0%, #0d1117 100%)",
          }}
        >
          {/* Status Alerts */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-950/45 border border-[#a01e1e] text-sm text-red-300 font-mono">
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 rounded-lg bg-emerald-950/45 border border-emerald-500/30 text-sm text-emerald-300 font-mono flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 animate-pulse" />
              <span>Session Authorized. Initializing...</span>
            </div>
          )}

          {step === 1 ? (
            /* STEP 1: CREDENTIALS FLOW */
            <>
              {/* Role Selector */}
              <div className="flex bg-[#0d1117] p-1 rounded-lg mb-8 border border-white/[0.04]">
                {(["patient", "responder", "admin"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setRole(r);
                      setError("");
                    }}
                    className={[
                      "flex-1 py-2 text-sm font-medium rounded-md transition-colors capitalize cursor-pointer",
                      role === r ? "bg-[#8b1a1a] text-white shadow-md" : "text-[#8b949e] hover:text-[#c5c5d5]",
                    ].join(" ")}
                  >
                    {r === "responder" ? "First Responder" : r === "patient" ? "Resident" : "Admin"}
                  </button>
                ))}
              </div>

              {/* Form */}
              <form className="space-y-6" onSubmit={handleCredentialSubmit}>
                <FormInput
                  id="email"
                  type="email"
                  label={role === "responder" ? "Official Email" : role === "admin" ? "Admin Username" : "Email Address"}
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon={<User className="h-5 w-5" />}
                  required
                />
                <FormInput
                  id="password"
                  type={showPw ? "text" : "password"}
                  label="Password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={<Lock className="h-5 w-5" />}
                  rightElement={
                    <button type="button" onClick={() => setShowPw((v) => !v)} className="cursor-pointer">
                      {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  }
                  required
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => { setShowForgotModal(true); setForgotEmail(email); setForgotStatus("idle"); setForgotError(""); }}
                    className="text-xs text-[#8b1a1a] hover:underline font-medium cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading || success}
                  className="w-full flex items-center justify-center gap-2 bg-[#8b1a1a] hover:bg-[#a01e1e] text-white font-bold py-4 px-4 rounded-lg transition-colors shadow-lg shadow-red-900/20 group cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>{role === "patient" ? "Access Portal" : "Continue to MFA"}</span>
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : step === 2 ? (
            /* STEP 2: TOTP MFA FLOW */
            <form onSubmit={handleMfaSubmit} className="space-y-6">
              <div className="text-center space-y-2">
                <p className="text-sm text-[#8b949e] leading-relaxed">
                  Enter the 6-digit TOTP verification token from your authenticator app.
                </p>
                {email.trim().toLowerCase() in SANDBOX_USERS && SANDBOX_USERS[email.trim().toLowerCase()].secret ? (
                  <div className="p-3 bg-[#0d1117] rounded-lg border border-white/[0.04] text-xs text-[#8b949e] space-y-1">
                    <p>
                      MFA Secret: <span className="text-white font-mono font-bold select-all">{SANDBOX_USERS[email.trim().toLowerCase()].secret}</span>
                    </p>
                    <p>
                      Current Active OTP: <span className="text-emerald-400 font-mono font-bold">{currentOtpCode || "calculating..."}</span>
                    </p>
                  </div>
                ) : (
                  <p className="text-xs font-mono text-[#8b949e]">
                    Sandbox Code: <span className="text-[#ff5555] font-bold">123456</span>
                  </p>
                )}
              </div>

              {/* 6 OTP Boxes */}
              <div className="flex justify-between gap-2 max-w-[280px] mx-auto py-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      otpRefs.current[index] = el;
                    }}
                    id={`otp-box-${index}`}
                    type="text"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-10 h-12 bg-[#0d1117] border border-[#30363d] focus:border-[#8b1a1a] focus:ring-1 focus:ring-[#8b1a1a] rounded text-center text-lg font-mono font-bold text-white outline-none transition-all"
                  />
                ))}
              </div>

              <div className="space-y-3 pt-2">
                <button
                  type="submit"
                  disabled={loading || success || otp.join("").length !== 6}
                  className="w-full flex items-center justify-center gap-2 bg-[#8b1a1a] hover:bg-[#a01e1e] text-white font-bold py-4 px-4 rounded-lg transition-colors shadow-lg shadow-red-900/20 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <span>Verify & Access Portal</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full flex items-center justify-center gap-2 text-[#8b949e] hover:text-white text-xs font-semibold py-2 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Credentials</span>
                </button>
              </div>
            </form>
          ) : (
            /* STEP 3: SHIFT KEY FLOW */
            <form onSubmit={handleShiftKeySubmit} className="space-y-6">
              <div className="text-center space-y-2">
                <p className="text-sm text-[#8b949e] leading-relaxed">
                  Responders must enter today's active daily shift key to authorize dispatch operations.
                </p>
              </div>

              <FormInput
                id="shiftKey"
                type="text"
                label="Active Shift Key"
                placeholder="RESP-XXXX-XXXX-XXXX"
                value={shiftKey}
                onChange={(e) => setShiftKey(e.target.value)}
                icon={<Shield className="h-5 w-5" />}
                required
              />

              <div className="space-y-3 pt-2">
                <button
                  type="submit"
                  disabled={loading || success || !shiftKey.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-[#8b1a1a] hover:bg-[#a01e1e] text-white font-bold py-4 px-4 rounded-lg transition-colors shadow-lg shadow-red-900/20 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <span>Validate Shift & Begin Duty</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full flex items-center justify-center gap-2 text-[#8b949e] hover:text-white text-xs font-semibold py-2 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to TOTP</span>
                </button>
              </div>
            </form>
          )}
        </section>

        {step === 1 && role !== "admin" && (
          <p data-animate className="mt-8 text-sm text-[#8b949e]">
            First time here?{" "}
            <Link
              to={role === "responder" ? "/register/responder" : "/register"}
              className="text-[#8b1a1a] font-semibold hover:underline"
            >
              Create an account
            </Link>
          </p>
        )}

        {/* Forgot Password Modal */}
        {showForgotModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowForgotModal(false); }}
          >
            <div
              className="w-full max-w-md rounded-2xl p-8 shadow-2xl"
              style={{ border: "1px solid #30363d", background: "linear-gradient(180deg,#161b22 0%,#0d1117 100%)" }}
            >
              {forgotStatus === "sent" ? (
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                    <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                  </div>
                  <h2 className="text-lg font-bold text-white">Reset Link Sent</h2>
                  <p className="text-sm text-[#8b949e] leading-relaxed">
                    {isPlaceholderUrl
                      ? "Sandbox mode — no real email was sent. In production, check your inbox for the password reset link."
                      : `A password reset link has been sent to ${forgotEmail}. Check your inbox.`}
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="w-full mt-2 bg-[#8b1a1a] hover:bg-[#a01e1e] text-white font-bold py-3 px-4 rounded-lg transition-colors cursor-pointer"
                  >
                    Back to Login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold text-white">Reset Password</h2>
                    <p className="text-sm text-[#8b949e] mt-1">Enter your account email and we'll send you a reset link.</p>
                  </div>

                  {forgotError && (
                    <div className="p-3 rounded-lg bg-red-950/45 border border-[#a01e1e] text-sm text-red-300 font-mono">
                      ⚠️ {forgotError}
                    </div>
                  )}

                  <FormInput
                    id="forgot-email"
                    type="email"
                    label="Email Address"
                    placeholder="your@email.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    icon={<User className="h-5 w-5" />}
                    required
                  />

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(false)}
                      className="flex-1 py-3 rounded-lg border border-[#30363d] bg-[#1c2128] hover:bg-[#30363d] text-sm font-semibold text-[#8b949e] hover:text-white transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="flex-1 flex items-center justify-center gap-2 bg-[#8b1a1a] hover:bg-[#a01e1e] text-white font-bold py-3 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {forgotLoading ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /><span>Sending...</span></>
                      ) : (
                        <span>Send Reset Link</span>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full py-10 flex flex-col items-center space-y-6" data-animate>
        <nav className="flex gap-8 text-[#8b949e] text-sm">
          <Link to="#" className="hover:text-white transition-colors">
            Support
          </Link>
          <Link to="#" className="hover:text-white transition-colors">
            Help Centers
          </Link>
          <Link to="#" className="hover:text-white transition-colors">
            Privacy
          </Link>
        </nav>
        <p className="text-[#8b949e] text-xs">© 2024 RespondaCare Healthcare Systems. All rights reserved.</p>
      </footer>
    </div>
  );
}
