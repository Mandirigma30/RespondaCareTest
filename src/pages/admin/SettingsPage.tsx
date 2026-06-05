import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { User, Bell, Lock, Globe, Database, Shield } from "lucide-react";
import { TopBar } from "../../components/layout/TopBar";
import { PageHeader } from "../../components/ui/PageHeader";
import { FormInput, FormSelect } from "../../components/ui/FormInput";
import { Button } from "../../components/ui/Button";

type Tab = "profile" | "notifications" | "security" | "system";

const tabs: { key: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "profile", label: "Profile", icon: User },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "security", label: "Security", icon: Lock },
  { key: "system", label: "System", icon: Database },
];

export default function SettingsPage() {
  const ref = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<Tab>("profile");
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo("[data-animate]", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.07, ease: "power2.out" });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={ref} className="flex flex-col h-full bg-[#0c0f16]">
      <TopBar title="Settings" showSearch={false} />
      <div className="px-8 py-6 flex-1 max-w-7xl mx-auto w-full">
        <PageHeader title="Settings" subtitle="System preferences and profile management." />

        <div className="flex gap-8">
          {/* Tabs */}
          <div data-animate className="w-52 flex-shrink-0">
            <nav className="space-y-1">
              {tabs.map(({ key, label, icon: Icon }) => (
                <button key={key} onClick={() => setTab(key)}
                  className={["flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm transition-all",
                    tab === key ? "bg-[#8b1a1a] text-white font-semibold" : "text-gray-400 hover:text-white hover:bg-[#1a1d23]"
                  ].join(" ")}>
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div data-animate className="flex-1">
            {tab === "profile" && (
              <div className="bg-[#1a1d23] rounded-2xl p-8 border border-[#2d333b] space-y-6">
                <h3 className="font-bold text-white text-lg">Admin Profile</h3>
                <div className="flex items-center gap-5 pb-6 border-b border-[#2d333b]">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#8b1a1a] to-[#4a0f0f] flex items-center justify-center text-white text-3xl font-bold">J</div>
                  <div>
                    <p className="font-bold text-white text-lg">James Wilson</p>
                    <p className="text-[#8b949e] text-sm">System Administrator • Barangay 45</p>
                    <Button variant="secondary" size="sm" className="mt-2">Change Photo</Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <FormInput id="s-first" label="First Name" defaultValue="James" />
                  <FormInput id="s-last" label="Last Name" defaultValue="James" />
                  <FormInput id="s-email" type="email" label="Email" defaultValue="jwilson@barangay45.gov.ph" />
                  <FormInput id="s-phone" label="Phone" defaultValue="+63 912 345 6789" />
                  <FormSelect id="s-barangay" label="Barangay">
                    <option>Barangay 45 — Tondo</option>
                    <option>Barangay 46 — Tondo</option>
                  </FormSelect>
                  <FormSelect id="s-role" label="Role">
                    <option>System Administrator</option>
                    <option>Dispatcher</option>
                  </FormSelect>
                </div>
                <Button><User className="w-4 h-4" /> Save Profile</Button>
              </div>
            )}
            {tab === "notifications" && (
              <div className="bg-[#1a1d23] rounded-2xl p-8 border border-[#2d333b] space-y-6">
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
                        <input type="checkbox" defaultChecked={i < 3} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:ring-2 peer-focus:ring-[#8b1a1a] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8b1a1a]" />
                      </div>
                    </label>
                  </div>
                ))}
                <Button><Bell className="w-4 h-4" /> Save Preferences</Button>
              </div>
            )}
            {tab === "security" && (
              <div className="bg-[#1a1d23] rounded-2xl p-8 border border-[#2d333b] space-y-6">
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
                    <Button variant="secondary" size="sm"><Shield className="w-4 h-4" /> Enable 2FA</Button>
                  </div>
                </div>
                <Button><Lock className="w-4 h-4" /> Update Password</Button>
              </div>
            )}
            {tab === "system" && (
              <div className="bg-[#1a1d23] rounded-2xl p-8 border border-[#2d333b] space-y-6">
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
                <Button><Database className="w-4 h-4" /> Save Configuration</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
