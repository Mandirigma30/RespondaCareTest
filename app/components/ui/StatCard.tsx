"use client";
import { ReactNode } from "react";
import { useCountUp } from "../animations/useCountUp";

interface StatCardProps {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  icon: ReactNode;
  iconBg: string;
  trend?: string;
  trendColor?: "green" | "red" | "gray";
  badge?: string;
}

const trendColorMap = {
  green: "text-[#48bb78]",
  red: "text-[#e53e3e]",
  gray: "text-gray-400",
};

export function StatCard({
  label,
  value,
  prefix = "",
  suffix = "",
  icon,
  iconBg,
  trend,
  trendColor = "gray",
  badge,
}: StatCardProps) {
  const { display } = useCountUp(value, 1.4, prefix, suffix);

  return (
    <div
      data-animate
      className="bg-[#1a1d23] p-6 rounded-xl border border-white/5 hover-lift"
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 rounded-lg ${iconBg}`}>{icon}</div>
        {trend && (
          <div className={`flex items-center text-sm font-medium ${trendColorMap[trendColor]}`}>
            {trend}
          </div>
        )}
        {badge && !trend && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">{badge}</span>
        )}
      </div>
      <p className="text-[#8b949e] text-sm">{label}</p>
      <p className="text-4xl font-bold mt-1">{display}</p>
    </div>
  );
}
