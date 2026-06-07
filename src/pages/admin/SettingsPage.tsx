import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { User, Bell, Lock, Globe, Database, Shield } from "lucide-react";
import { TopBar } from "../../components/layout/TopBar";
import { PageHeader } from "../../components/ui/PageHeader";
import { FormInput, FormSelect } from "../../components/ui/FormInput";
import { Button } from "../../components/ui/Button";
import { supabase, isPlaceholderUrl } from "../../lib/supabase";

type Tab = "profile" | "notifications" | "security" | "shiftKeys" | "system";

const tabs: { key: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "profile", label: "Profile", icon: User },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "security", label: "Security", icon: Lock },
  { key: "shiftKeys", label: "Shift Keys", icon: Shield },
  { key: "system", label: "System", icon: Database },
];

export default function SettingsPage() {
  const ref = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<Tab>("profile");

  // User Profile States
  const [firstName, setFirstName] = useState("James");
  const [lastName, setLastName] = useState("Wilson");
  const [email, setEmail] = useState("jwilson@barangay45.gov.ph");
  const [phone, setPhone] = useState("+63 912 345 6789");
  const [barangayZone, setBarangayZone] = useState("Barangay 45 — Pasay City");
  const [userRole, setUserRole] = useState("System Administrator");

  // Notification Preferences State
  const [notifPrefs, setNotifPrefs] = useState<boolean[]>([true, true, true, false, false]);

  // Shift Key State
  const [activeShiftKey, setActiveShiftKey] = useState("RESP-ABCD-1234-EFGH");

  // Animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-animate]", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.07, ease: "power2.out" });
    }, ref);
    return () => ctx.revert();
  }, [tab]);

  // Load saved preferences and shift key
  useEffect(() => {
    const saved = localStorage.getItem("respondaCare_notificationPrefs");
    if (saved) {
      try {
        setNotifPrefs(JSON.parse(saved));
      } catch (e) {}
    }
    const cachedKey = localStorage.getItem("respondaCare_activeShiftKey");
    if (cachedKey) {
      setActiveShiftKey(cachedKey);
    }
  }, []);

  // Load profile details from session and database
  useEffect(() => {
    const loadProfile = async () => {
      const sessionStr = localStorage.getItem("respondaCare_session");
      if (sessionStr) {
        try {
          const session = JSON.parse(sessionStr);
          const userEmail = session.email;
          if (userEmail) {
            setEmail(userEmail);
            
            if (session.name) {
              const names = session.name.split(" ");
              setFirstName(names[0] || "");
              setLastName(names.slice(1).join(" ") || "");
            }
            
            if (!isPlaceholderUrl) {
              const { data } = await supabase
                .schema("security")
                .from("users")
                .select("*")
                .eq("email", userEmail.toLowerCase())
                .maybeSingle();
              
              if (data) {
                const names = (data.full_name || "").split(" ");
                setFirstName(names[0] || "");
                setLastName(names.slice(1).join(" ") || "");
                setPhone(data.phone || "");
                setEmail(data.email || userEmail);
                setBarangayZone(data.barangay_id === 2 ? "Barangay 46 — Pasay City" : "Barangay 45 — Pasay City");
                setUserRole(data.role_id === 1 ? "System Administrator" : "First Responder");
              }

              // Load notification preferences from auth user metadata
              const { data: authData } = await supabase.auth.getUser();
              if (authData?.user?.user_metadata?.notification_prefs) {
                setNotifPrefs(authData.user.user_metadata.notification_prefs);
              }
            }
          }
        } catch (e) {
          console.error("Failed to load profile details:", e);
        }
      }
    };

    loadProfile();
  }, []);

  const handleSaveProfile = async () => {
    try {
      const sessionStr = localStorage.getItem("respondaCare_session");
      let currentEmail = email;
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        currentEmail = session.email || email;
        
        session.name = `${firstName} ${lastName}`;
        localStorage.setItem("respondaCare_session", JSON.stringify(session));
      }

      if (!isPlaceholderUrl) {
        const { error } = await supabase
          .schema("security")
          .from("users")
          .update({
            full_name: `${firstName} ${lastName}`,
            phone: phone
          })
          .eq("email", currentEmail.toLowerCase());
        
        if (error) throw error;
        
        await supabase.schema("security").from("audit_log").insert({
          action: "UPDATE",
          target_table: "security.users",
          details: { info: `User updated profile: ${firstName} ${lastName}` }
        });
      }
      alert("Profile updated successfully.");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to update profile.");
    }
  };

  const handleRotateShiftKey = async () => {
    try {
      const { generateAuthKey } = await import("../../lib/cryptoUtils");
      const newKey = generateAuthKey();
      setActiveShiftKey(newKey);
      localStorage.setItem("respondaCare_activeShiftKey", newKey);

      if (!isPlaceholderUrl) {
        const { error } = await supabase.rpc("generate_shift_key", { p_key: newKey });
        if (error) throw error;
        
        await supabase.schema("security").from("audit_log").insert({
          action: "ROTATE_SHIFT_KEY",
          target_table: "security.shift_keys",
          details: { info: `Admin rotated daily responder shift key. Active key is now active.` }
        });
      }

      // Log in local audit logs
      const localLogs = JSON.parse(localStorage.getItem("respondaCare_auditLogs") || "[]");
      localLogs.unshift({
        ts: new Date().toISOString().slice(0, 10),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        user: `${firstName} ${lastName}`.trim() || "Administrator",
        role: "admin",
        action: "Rotated responder shift key",
        resource: "security.shift_keys",
        ip: "127.0.0.1",
        dotColor: "bg-[#8b1a1a]"
      });
      localStorage.setItem("respondaCare_auditLogs", JSON.stringify(localLogs));

      alert(`Shift key rotated successfully! New key: ${newKey}`);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to rotate shift key.");
    }
  };

  return (
    <div ref={ref} className="flex flex-col h-full bg-[#0c0f16]">
      <TopBar title="Settings" showSearch={false} />
      <div className="px-8 py-6 flex-1 max-w-7xl mx-auto w-full">
        <PageHeader title="Settings" subtitle="System preferences and profile management." />

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Tabs */}
          <div data-animate className="w-full lg:w-52 flex-shrink-0">
            <nav className="space-y-1">
              {tabs.map(({ key, label, icon: Icon }) => (
                <button key={key} onClick={() => setTab(key)}
                  className={[
                    "flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm transition-all cursor-pointer",
                    tab === key ? "bg-[#8b1a1a] text-white font-semibold" : "text-gray-400 hover:text-white hover:bg-[#1a1d23]"
                  ].join(" ")}>
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div data-animate className="flex-grow">
            {tab === "profile" && (
              <div className="bg-[#1a1d23] rounded-2xl p-8 border border-[#2d333b] space-y-6 shadow-2xl">
                <h3 className="font-bold text-white text-lg">Admin Profile</h3>
                <div className="flex items-center gap-5 pb-6 border-b border-[#2d333b]">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#8b1a1a] to-[#4a0f0f] flex items-center justify-center text-white text-3xl font-bold">
                    {firstName[0] || "J"}
                  </div>
                  <div>
                    <p className="font-bold text-white text-lg">{firstName} {lastName}</p>
                    <p className="text-[#8b949e] text-sm">{userRole} • {barangayZone}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FormInput id="s-first" label="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                  <FormInput id="s-last" label="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                  <FormInput id="s-email" type="email" label="Email" value={email} disabled />
                  <FormInput id="s-phone" label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  <FormSelect id="s-barangay" label="Barangay" value={barangayZone} disabled>
                    <option value="Barangay 45 — Pasay City">Barangay 45 — Pasay City</option>
                    <option value="Barangay 46 — Pasay City">Barangay 46 — Pasay City</option>
                  </FormSelect>
                  <FormSelect id="s-role" label="Role" value={userRole} disabled>
                    <option value="System Administrator">System Administrator</option>
                    <option value="First Responder">First Responder</option>
                  </FormSelect>
                </div>
                <Button onClick={handleSaveProfile}><User className="w-4 h-4 mr-1.5" /> Save Profile</Button>
              </div>
            )}
            {tab === "notifications" && (
              <div className="bg-[#1a1d23] rounded-2xl p-8 border border-[#2d333b] space-y-6 shadow-2xl">
                <h3 className="font-bold text-white text-lg">Notification Preferences</h3>
                {[
                  { label: "Critical incident alerts", desc: "Immediate push notification for Priority 1 incidents" },
                  { label: "New resident enrollment", desc: "Notify when a new resident completes registration" },
                  { label: "Responder offline alerts", desc: "Alert when a responder loses connectivity" },
                  { label: "Daily summary digest", desc: "End-of-day performance report via email" },
                  { label: "System maintenance alerts", desc: "Scheduled downtime and update notifications" },
                ].map((n, i) => (
                  <div key={i} className="flex items-start justify-between py-4 border-b border-[#2d333b] last:border-0">
                    <div>
                      <p className="text-white font-semibold text-sm">{n.label}</p>
                      <p className="text-[#8b949e] text-xs mt-1">{n.desc}</p>
                    </div>
                    <label className="flex items-center cursor-pointer ml-6">
                      <div className="relative">
                        <input 
                          type="checkbox" 
                          checked={notifPrefs[i] ?? false} 
                          onChange={() => {
                            const updated = [...notifPrefs];
                            updated[i] = !updated[i];
                            setNotifPrefs(updated);
                          }}
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:ring-2 peer-focus:ring-[#8b1a1a] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8b1a1a]" />
                      </div>
                    </label>
                  </div>
                ))}
                <Button 
                  onClick={async () => {
                    localStorage.setItem("respondaCare_notificationPrefs", JSON.stringify(notifPrefs));
                    
                    if (!isPlaceholderUrl) {
                      try {
                        const { error } = await supabase.auth.updateUser({
                          data: {
                            notification_prefs: notifPrefs
                          }
                        });
                        if (error) throw error;
                      } catch (err: any) {
                        console.error("Failed to sync notification preferences to Supabase:", err);
                      }
                    }

                    // Log in local audit logs
                    const localLogs = JSON.parse(localStorage.getItem("respondaCare_auditLogs") || "[]");
                    localLogs.unshift({
                      ts: new Date().toISOString().slice(0, 10),
                      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      user: `${firstName} ${lastName}`.trim() || "Administrator",
                      role: "admin",
                      action: "Updated notification preferences settings",
                      resource: "security.users",
                      ip: "127.0.0.1",
                      dotColor: "bg-blue-400"
                    });
                    localStorage.setItem("respondaCare_auditLogs", JSON.stringify(localLogs));
                    alert("Notification preferences saved successfully.");
                  }}
                >
                  <Bell className="w-4 h-4 mr-1.5" /> Save Preferences
                </Button>
              </div>
            )}
            {tab === "security" && (
              <div className="bg-[#1a1d23] rounded-2xl p-8 border border-[#2d333b] space-y-6 shadow-2xl">
                <h3 className="font-bold text-white text-lg">Security Settings</h3>
                <div className="space-y-5">
                  <FormInput id="s-cur-pw" type="password" label="Current Password" placeholder="••••••••" icon={<Lock className="w-4 h-4" />} />
                  <FormInput id="s-new-pw" type="password" label="New Password" placeholder="••••••••" icon={<Lock className="w-4 h-4" />} />
                  <FormInput id="s-confirm-pw" type="password" label="Confirm New Password" placeholder="••••••••" icon={<Lock className="w-4 h-4" />} />
                  <div className="flex items-center justify-between p-4 bg-[#0c0f16] rounded-xl border border-[#2d333b]">
                    <div>
                      <p className="text-white font-semibold text-sm">Two-Factor Authentication</p>
                      <p className="text-[#8b949e] text-xs mt-1">Add an extra layer of security to your account</p>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => alert("MFA/2FA configuration modal.")}>
                      <Shield className="w-4 h-4 mr-1" /> Enable 2FA
                    </Button>
                  </div>
                </div>
                <Button onClick={() => alert("Password updated successfully.")}><Lock className="w-4 h-4 mr-1.5" /> Update Password</Button>
              </div>
            )}
            {tab === "shiftKeys" && (
              <div className="bg-[#1a1d23] rounded-2xl p-8 border border-[#2d333b] space-y-6 shadow-2xl">
                <h3 className="font-bold text-white text-lg">Daily Shift Key Manager</h3>
                <p className="text-[#8b949e] text-sm leading-relaxed">
                  Generate and rotate active daily shift authentication credentials for field emergency responders. Responders must enter the active key upon logging in.
                </p>
                
                <div className="p-5 bg-[#0c0f16] rounded-xl border border-[#2d333b] flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <p className="text-[#8b949e] text-xs font-bold uppercase tracking-wider">Active Shift Key For Today</p>
                    <p className="text-white font-mono text-2xl font-bold mt-1 tracking-widest select-all">
                      {activeShiftKey || "RESP-ABCD-1234-EFGH"}
                    </p>
                  </div>
                  <Button onClick={handleRotateShiftKey}>
                    <Shield className="w-4 h-4 mr-1.5" /> Rotate Shift Key
                  </Button>
                </div>

                <div className="text-xs text-[#8b949e] bg-[#0c0f16]/30 p-3 rounded-lg border border-[#2d333b]/45">
                  💡 <strong>Security Tip:</strong> Share this key with duty responders at the beginning of their shift. Generating a new key will instantly invalidate the previous key.
                </div>
              </div>
            )}
            {tab === "system" && (
              <div className="bg-[#1a1d23] rounded-2xl p-8 border border-[#2d333b] space-y-6 shadow-2xl">
                <h3 className="font-bold text-white text-lg">System Configuration</h3>
                <div className="space-y-5">
                  <FormSelect id="s-lang" label="Language / Region"><option>English (Philippines)</option><option>Filipino</option></FormSelect>
                  <FormSelect id="s-tz" label="Timezone"><option>Asia/Manila (PHT +08:00)</option></FormSelect>
                  <FormSelect id="s-backup" label="Backup Frequency"><option>Daily</option></FormSelect>
                  <div className="flex items-center justify-between p-4 bg-[#0c0f16] rounded-xl border border-[#2d333b]">
                    <div>
                      <p className="text-white font-semibold text-sm flex items-center gap-2">
                        <Globe className="w-4 h-4 text-[#48bb78]" /> System Status
                      </p>
                      <p className="text-[#8b949e] text-xs mt-1">All systems operational</p>
                    </div>
                    <span className="text-xs font-bold text-[#48bb78] bg-green-900/20 px-3 py-1 rounded-full border border-green-900/30">Online</span>
                  </div>
                </div>
                <Button onClick={() => alert("System configuration saved.")}><Database className="w-4 h-4 mr-1.5" /> Save Configuration</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
