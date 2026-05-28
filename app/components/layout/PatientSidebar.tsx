"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, User, BookOpen, QrCode, Bell, AlertTriangle, LogOut, PlusSquare } from "lucide-react";
import { useSidebarAnimation } from "../animations/usePageAnimation";

const navItems = [
  { href: "/patient/dashboard",  label: "Dashboard",       icon: LayoutGrid },
  { href: "/patient/enrollment", label: "My Profile",      icon: User },
  { href: "/patient/education",  label: "Health Education", icon: BookOpen },
  { href: "/patient/qr-scan",   label: "Scan",            icon: QrCode },
  { href: "/patient/notifications", label: "Notifications", icon: Bell },
];

export function PatientSidebar() {
  const pathname = usePathname();
  const sidebarRef = useSidebarAnimation();

  return (
    <aside
      ref={sidebarRef}
      className="w-64 bg-[#121418] border-r border-gray-800 flex flex-col flex-shrink-0 h-screen sticky top-0"
    >
      {/* Logo */}
      <div className="p-6 flex items-center gap-3" data-sidebar-item>
        <div className="w-10 h-10 bg-[#8b1a1a] rounded-lg flex items-center justify-center flex-shrink-0">
          <PlusSquare className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-bold text-lg text-[#e53e3e] leading-none">RespondaCare</h2>
          <p className="text-[10px] text-[#8b949e] uppercase tracking-widest mt-0.5">Patient Portal</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="mt-4 flex-grow px-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              data-sidebar-item
              className={[
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all",
                active
                  ? "text-white font-medium"
                  : "text-[#9ca3af] hover:bg-gray-800 hover:text-white",
              ].join(" ")}
              style={active ? {
                background: "linear-gradient(90deg, rgba(139,29,29,0.8) 0%, rgba(139,29,29,0.15) 100%)",
                borderRight: "4px solid #ef4444",
              } : {}}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">{label}</span>
            </Link>
          );
        })}

        {/* Emergency Action */}
        <div className="pt-6">
          <p className="text-[10px] font-bold text-[#8b949e] tracking-widest uppercase px-4 mb-2">Active Actions</p>
          <Link
            href="/patient/emergency"
            data-sidebar-item
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-950/20 transition-all text-sm font-semibold"
          >
            <AlertTriangle className="w-5 h-5" />
            Report Incident
          </Link>
        </div>
      </nav>

      {/* Support Status */}
      <div className="p-4">
        <div className="bg-[#1a1d23]/50 rounded-xl p-4 border border-gray-800">
          <p className="text-[10px] font-bold text-[#8b949e] tracking-widest uppercase mb-2">Support Status</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium text-white">Responders Online</span>
          </div>
        </div>
        <Link href="/" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white transition-colors text-sm mt-2">
          <LogOut className="w-4 h-4" />
          Logout
        </Link>
      </div>
    </aside>
  );
}
