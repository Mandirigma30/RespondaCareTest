import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
  fullWidth?: boolean;
}

const variantClasses = {
  primary:
    "bg-[#8b1a1a] hover:bg-[#a01e1e] text-white shadow-lg shadow-red-900/20",
  secondary:
    "bg-[#8b1a1a]/20 border border-[#8b1a1a] text-[#e53e3e] hover:bg-[#8b1a1a]/30",
  ghost:
    "text-gray-400 hover:text-white hover:bg-white/5",
  danger:
    "bg-[#e53e3e] hover:bg-red-500 text-white shadow-lg shadow-red-500/20",
};

const sizeClasses = {
  sm: "px-3 py-1.5 text-xs rounded-lg",
  md: "px-5 py-3 text-sm rounded-xl",
  lg: "px-6 py-4 text-base rounded-xl",
};

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#8b1a1a] focus:ring-offset-2 focus:ring-offset-[#0c0f16] disabled:opacity-50 disabled:cursor-not-allowed",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? "w-full" : "",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
