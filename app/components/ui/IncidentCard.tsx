import { ReactNode } from "react";

type IncidentPriority = "critical" | "high" | "medium" | "low" | "resolved";

const borderColors: Record<IncidentPriority, string> = {
  critical: "border-[#e53e3e]",
  high:     "border-[#ed8936]",
  medium:   "border-yellow-500",
  low:      "border-gray-600",
  resolved: "border-[#48bb78]",
};

const iconBgs: Record<IncidentPriority, string> = {
  critical: "bg-red-900/20",
  high:     "bg-orange-900/20",
  medium:   "bg-yellow-900/20",
  low:      "bg-gray-900/20",
  resolved: "bg-green-900/20",
};

const iconColors: Record<IncidentPriority, string> = {
  critical: "text-[#e53e3e]",
  high:     "text-[#ed8936]",
  medium:   "text-yellow-500",
  low:      "text-gray-500",
  resolved: "text-[#48bb78]",
};

const priorityLabels: Record<IncidentPriority, string> = {
  critical: "Critical",
  high:     "High",
  medium:   "Medium",
  low:      "Low",
  resolved: "Resolved",
};

const priorityBadgeColors: Record<IncidentPriority, string> = {
  critical: "bg-[#e53e3e]/20 text-[#e53e3e]",
  high:     "bg-[#ed8936]/20 text-[#ed8936]",
  medium:   "bg-yellow-500/20 text-yellow-500",
  low:      "bg-gray-500/20 text-gray-500",
  resolved: "bg-[#48bb78]/20 text-[#48bb78]",
};

interface IncidentCardProps {
  id?: string;
  title: string;
  location: string;
  time: string;
  priority: IncidentPriority;
  icon: ReactNode;
  responders?: string[];
  opacity?: boolean;
}

export function IncidentCard({
  id,
  title,
  location,
  time,
  priority,
  icon,
  responders = [],
  opacity = false,
}: IncidentCardProps) {
  return (
    <div
      data-animate
      className={[
        "bg-[#25252b]/50 p-4 rounded-xl border-l-4 transition-all hover:bg-[#25252b]/80",
        borderColors[priority],
        opacity ? "opacity-70" : "",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg flex-shrink-0 ${iconBgs[priority]}`}>
          <div className={iconColors[priority]}>{icon}</div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <h4 className="font-bold text-sm text-white truncate">{title}</h4>
            <span
              className={[
                "text-[10px] font-bold px-2 py-0.5 rounded uppercase flex-shrink-0",
                priorityBadgeColors[priority],
              ].join(" ")}
            >
              {priorityLabels[priority]}
            </span>
          </div>
          <p className="text-xs text-[#8b949e] mt-1">
            {location} • {time}
          </p>
          {(id || responders.length > 0) && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {id && (
                <span className="text-[10px] font-mono text-gray-500 bg-[#1a1d23] px-2 py-0.5 rounded">
                  {id}
                </span>
              )}
              {responders.map((r) => (
                <span
                  key={r}
                  className="bg-blue-600 text-[10px] px-1.5 rounded text-white font-bold"
                >
                  {r}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
