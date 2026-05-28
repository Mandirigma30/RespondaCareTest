import { ReactNode } from "react";

type BadgeVariant = "red" | "blue" | "green" | "orange" | "yellow" | "gray" |
  "dispatcher" | "admin" | "responder" | "automated" | "critical" | "high" | "medium" | "low" | "resolved";

const variants: Record<BadgeVariant, string> = {
  red:         "bg-red-900/20 text-red-400 border-red-900/30",
  blue:        "bg-blue-900/20 text-blue-400 border-blue-900/30",
  green:       "bg-green-900/20 text-green-400 border-green-900/30",
  orange:      "bg-orange-900/20 text-orange-400 border-orange-900/30",
  yellow:      "bg-yellow-900/20 text-yellow-400 border-yellow-900/30",
  gray:        "bg-gray-800/50 text-gray-400 border-gray-700/30",
  dispatcher:  "bg-blue-900/20 text-blue-400 border-blue-800/30",
  admin:       "bg-purple-900/20 text-purple-400 border-purple-800/30",
  responder:   "bg-emerald-900/20 text-emerald-400 border-emerald-800/30",
  automated:   "bg-gray-800/30 text-gray-500 border-gray-700/20",
  critical:    "bg-red-900/20 text-red-400 border-red-900/30",
  high:        "bg-orange-900/20 text-orange-400 border-orange-900/30",
  medium:      "bg-yellow-900/20 text-yellow-400 border-yellow-900/30",
  low:         "bg-gray-800/50 text-gray-400 border-gray-700/30",
  resolved:    "bg-green-900/20 text-green-400 border-green-900/30",
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

export function Badge({ variant = "gray", children, className = "" }: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wide border",
        variants[variant],
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}
