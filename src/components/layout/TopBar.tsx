import type { ReactNode } from "react";
import { Bell, Search } from "lucide-react";

interface TopBarProps {
  title: string;
  actions?: ReactNode;
  showSearch?: boolean;
  searchPlaceholder?: string;
}

export function TopBar({ title, actions, showSearch = true, searchPlaceholder = "Search..." }: TopBarProps) {
  return (
    <header className="flex items-center justify-between px-8 py-4 sticky top-0 bg-[#0c0f16] z-10 border-b border-gray-800/50">
      <h2 className="text-xl font-bold text-white">{title}</h2>
      <div className="flex items-center gap-6">
        {showSearch && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              className="bg-[#1a1d23] border-none rounded-lg pl-10 pr-4 py-2 w-72 text-sm focus:ring-1 focus:ring-[#8b1a1a] placeholder-gray-500 text-white outline-none"
            />
          </div>
        )}
        <div className="flex items-center gap-4">
          <button className="relative text-gray-400 hover:text-white transition-colors">
            <Bell className="w-6 h-6" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-[#e53e3e] rounded-full" />
          </button>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#8b1a1a] to-[#4a0f0f] flex items-center justify-center text-white font-bold text-sm cursor-pointer border border-gray-700">
            A
          </div>
        </div>
        {actions}
      </div>
    </header>
  );
}
