import { Link, useLocation, useNavigate } from "react-router-dom";
import { Radio, History, QrCode, FileText, LogOut, PlusSquare } from "lucide-react";
import { useSidebarAnimation } from "../animations/usePageAnimation";

const navItems = [
  { href: "/responder/dispatch", label: "Active Dispatch", icon: Radio },
  { href: "/responder/history",  label: "Incident History", icon: History },
  { href: "/responder/qr-scan",  label: "QR Scan",         icon: QrCode },
  { href: "/responder/turnover", label: "Turnover Report", icon: FileText },
];

export function ResponderSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const sidebarRef = useSidebarAnimation();

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    localStorage.removeItem("respondaCare_session");
    navigate("/");
  };

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
          <p className="text-[10px] text-[#8b949e] uppercase tracking-widest mt-0.5">Responder Portal</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-2 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = location.pathname.startsWith(href);
          return (
            <Link
              key={href}
              to={href}
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
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-3 text-gray-400 hover:text-white hover:bg-[#1a1d23] rounded-lg transition-colors text-sm text-left cursor-pointer"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </button>
      </div>
    </aside>
  );
}
