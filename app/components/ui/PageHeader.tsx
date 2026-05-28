import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-8" data-animate>
      <div>
        <h1 className="text-4xl font-bold text-white tracking-tight">{title}</h1>
        {subtitle && <p className="text-[#8b949e] mt-2">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3 flex-shrink-0">{actions}</div>}
    </div>
  );
}
