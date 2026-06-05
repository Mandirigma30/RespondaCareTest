import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { Bell, Search, LogOut, Settings, ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TopBarProps {
  title: string;
  actions?: ReactNode;
  showSearch?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
}

export function TopBar({
  title,
  actions,
  showSearch = true,
  searchPlaceholder = "Search...",
  searchValue = "",
  onSearchChange,
}: TopBarProps) {
  const navigate = useNavigate();
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [userName, setUserName] = useState("User");
  const [userRole, setUserRole] = useState("BHW");

  useEffect(() => {
    const session = localStorage.getItem("respondaCare_session");
    if (session) {
      try {
        const parsed = JSON.parse(session);
        if (parsed.name) setUserName(parsed.name);
        if (parsed.role) setUserRole(parsed.role);
      } catch (e) {}
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("respondaCare_session");
    navigate("/");
  };

  return (
    <header className="flex items-center justify-between px-8 py-4 sticky top-0 bg-[#0c0f16] z-50 border-b border-gray-800/50">
      <h2 className="text-xl font-bold text-white">{title}</h2>
      <div className="flex items-center gap-6">
        {showSearch && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="bg-[#1a1d23] border-none rounded-lg pl-10 pr-4 py-2 w-72 text-sm focus:ring-1 focus:ring-[#8b1a1a] placeholder-gray-500 text-white outline-none"
            />
          </div>
        )}
        
        <div className="flex items-center gap-4 relative">
          {/* Notifications Toggle */}
          <button 
            onClick={() => { setShowNotif(!showNotif); setShowProfile(false); }}
            className="relative text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <Bell className="w-6 h-6" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-[#e53e3e] rounded-full" />
          </button>

          {showNotif && (
            <div className="absolute right-12 top-10 w-80 bg-[#161b22] border border-gray-800 rounded-xl shadow-2xl p-4 z-50 text-white text-xs space-y-3">
              <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                <span className="font-bold text-gray-300">Community Alerts</span>
                <span className="text-[10px] text-red-400 font-bold uppercase animate-pulse">1 Active</span>
              </div>
              <div className="flex gap-2.5 items-start">
                <ShieldAlert className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-bold text-white">Emergency Broadcast</p>
                  <p className="text-[#8b949e] mt-0.5">Heavy precipitation has triggered alert monitoring for low levels of Zone 3.</p>
                </div>
              </div>
            </div>
          )}

          {/* Profile Dropdown */}
          <div className="relative">
            <div 
              onClick={() => { setShowProfile(!showProfile); setShowNotif(false); }}
              className="w-9 h-9 rounded-full bg-gradient-to-br from-[#8b1a1a] to-[#4a0f0f] flex items-center justify-center text-white font-bold text-sm cursor-pointer border border-gray-700"
            >
              {userName.charAt(0).toUpperCase()}
            </div>

            {showProfile && (
              <div className="absolute right-0 top-11 w-48 bg-[#161b22] border border-gray-800 rounded-xl shadow-2xl overflow-hidden z-50 text-white text-xs">
                <div className="p-3 border-b border-gray-800">
                  <p className="font-bold text-white truncate">{userName}</p>
                  <p className="text-[10px] text-[#8b949e] uppercase font-semibold mt-0.5">{userRole}</p>
                </div>
                <div className="py-1">
                  <button 
                    onClick={() => {
                      setShowProfile(false);
                      if (userRole === "admin") navigate("/admin/settings");
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white hover:bg-[#1a1d23] text-left cursor-pointer"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-[#1a1d23] text-left border-t border-gray-800 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        {actions}
      </div>
    </header>
  );
}

