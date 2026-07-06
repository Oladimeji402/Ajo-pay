'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface AdminInfoCardProps {
  title: string;
  icon?: LucideIcon;
  iconColor?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  variant?: 'default' | 'warning' | 'danger' | 'success' | 'info';
}

const variantStyles = {
  default: {
    border: 'border-slate-200',
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-600',
  },
  warning: {
    border: 'border-amber-200',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
  },
  danger: {
    border: 'border-red-200',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
  },
  success: {
    border: 'border-emerald-200',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
  },
  info: {
    border: 'border-blue-200',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
};

export function AdminInfoCard({
  title,
  icon: Icon,
  iconColor,
  children,
  actions,
  variant = 'default',
}: AdminInfoCardProps) {
  const styles = variantStyles[variant];

  return (
    <div className={`rounded-xl border ${styles.border} bg-white p-4 shadow-sm`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {Icon && (
            <div className={`grid h-7 w-7 place-items-center rounded-lg ${styles.iconBg}`}>
              <Icon size={14} className={iconColor || styles.iconColor} strokeWidth={2.5} />
            </div>
          )}
          <h3 className="text-sm font-bold text-brand-navy">{title}</h3>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

interface InfoRowProps {
  label: string;
  value: React.ReactNode;
  variant?: 'default' | 'highlight';
}

export function InfoRow({ label, value, variant = 'default' }: InfoRowProps) {
  const isHighlight = variant === 'highlight';

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 ${
        isHighlight ? 'bg-gradient-to-r from-slate-50 to-white' : 'bg-slate-50'
      }`}
    >
      <span className="text-xs text-brand-gray">{label}</span>
      <span className={`text-xs font-bold ${isHighlight ? 'text-brand-navy' : 'text-slate-700'}`}>
        {value}
      </span>
    </div>
  );
}

interface InfoGridProps {
  children: React.ReactNode;
  columns?: 2 | 3;
}

export function InfoGrid({ children, columns = 3 }: InfoGridProps) {
  return (
    <div className={`grid gap-3 ${columns === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}`}>
      {children}
    </div>
  );
}

interface InfoItemProps {
  label: string;
  value: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

export function InfoItem({ label, value, variant = 'default' }: InfoItemProps) {
  const variantClasses = {
    default: 'border-slate-200 bg-slate-50',
    success: 'border-emerald-100 bg-emerald-50/60',
    warning: 'border-amber-100 bg-amber-50/60',
    danger: 'border-red-100 bg-red-50/60',
  };

  return (
    <div className={`rounded-xl border ${variantClasses[variant]} p-3`}>
      <p className="text-xs text-brand-gray">{label}</p>
      <p className="mt-1 font-bold text-brand-navy">{value}</p>
    </div>
  );
}
