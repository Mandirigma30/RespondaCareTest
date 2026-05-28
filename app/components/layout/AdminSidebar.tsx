"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid, Users, Map, Activity, FileText, ClipboardList,
  Settings, LogOut, PlusSquare,
} from "lucide-react";
import { useSidebarAnimation } from "../animations/usePageAnimation";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard",         icon: LayoutGrid },
  { href: "/admin/residents", label: "Resident Directory", icon: Users },
  { href: "/admin/map",       label: "Map",               icon: Map },
  { href: "/admin/health-records", label: "Health Records", icon: Activity },
  { href: "/admin/reports",   label: "Reports",           icon: FileText },
  { href: "/admin/audit-log", label: "Audit Log",         icon: ClipboardList },
  { href: "/admin/settings",  label: "Settings",          icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const sidebarRef = useSidebarAnimation();

  return (
    <aside
      ref={sidebarRef}
      className="w-64 bg-[#0c0f16] border-r border-gray-800 flex flex-col flex-shrink-0 h-screen sticky top-0"
    >
      {/* Logo */}
      <div className="p-6 flex items-center gap-3" data-sidebar-item>
        <div className="bg-[#8b1a1a] p-1.5 rounded-md flex-shrink-0">
          <PlusSquare className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-bold text-lg tracking-tight text-white leading-none">RespondaCare</h2>
          <p className="text-[10px] text-[#8b949e] uppercase tracking-widest mt-0.5">Command Center</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/admin/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              data-sidebar-item
              className={[
                "flex items-center px-4 py-3 rounded-lg text-sm transition-all",
                active
                  ? "bg-[#8b1a1a] text-white font-semibold"
                  : "text-gray-400 hover:text-white hover:bg-[#1a1d23]",
              ].join(" ")}
            >
              <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-800" data-sidebar-item>
        <Link
          href="/"
          className="flex items-center w-full px-4 py-3 text-gray-400 hover:text-white transition-colors text-sm"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </Link>
      </div>
    </aside>
  );
}
