import type { InputHTMLAttributes, ReactNode } from "react";

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: ReactNode;
  rightElement?: ReactNode;
  error?: string;
}

export function FormInput({
  label,
  icon,
  rightElement,
  error,
  className = "",
  id,
  ...props
}: FormInputProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-semibold text-white"
        >
          {label}
        </label>
      )}
      <div
        className={[
          "relative flex items-center border rounded-lg bg-[#1c2128] transition-all",
          error
            ? "border-red-500 focus-within:ring-1 focus-within:ring-red-500"
            : "border-[#30363d] focus-within:border-[#8b1a1a] focus-within:ring-1 focus-within:ring-[#8b1a1a]",
        ].join(" ")}
      >
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b949e] pointer-events-none">
            {icon}
          </div>
        )}
        <input
          id={id}
          className={[
            "block w-full bg-transparent text-white placeholder-[#8b949e] focus:outline-none sm:text-sm py-3",
            icon ? "pl-10" : "pl-4",
            rightElement ? "pr-10" : "pr-4",
            className,
          ].join(" ")}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b949e]">
            {rightElement}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function FormTextarea({ label, error, id, className = "", ...props }: FormTextareaProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={id} className="block text-sm font-semibold text-white">
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={[
          "block w-full bg-[#1c2128] border rounded-lg px-4 py-3 text-white placeholder-[#8b949e] text-sm focus:outline-none transition-all",
          error
            ? "border-red-500 focus:ring-1 focus:ring-red-500"
            : "border-[#30363d] focus:border-[#8b1a1a] focus:ring-1 focus:ring-[#8b1a1a]",
          className,
        ].join(" ")}
        {...props}
      />
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  children: ReactNode;
}

export function FormSelect({ label, error, id, children, className = "", ...props }: FormSelectProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={id} className="block text-sm font-semibold text-white">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={id}
          className={[
            "block w-full bg-[#1c2128] border rounded-lg px-4 py-3 text-white text-sm focus:outline-none transition-all appearance-none pr-10",
            error
              ? "border-red-500 focus:ring-1 focus:ring-red-500"
              : "border-[#30363d] focus:border-[#8b1a1a] focus:ring-1 focus:ring-[#8b1a1a]",
            className,
          ].join(" ")}
          {...props}
        >
          {children}
        </select>
        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#8b949e]">
          ▼
        </div>
      </div>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}
