'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'warning' | 'success';

interface AdminActionButtonProps {
  onClick: () => void;
  icon?: LucideIcon;
  children: React.ReactNode;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const variantStyles = {
  primary: 'bg-brand-navy text-white hover:bg-brand-navy/90 focus:ring-brand-navy/20',
  secondary: 'border border-slate-200 bg-white text-brand-navy hover:bg-slate-50 focus:ring-slate-200',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-600/20',
  warning: 'bg-amber-600 text-white hover:bg-amber-700 focus:ring-amber-600/20',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-600/20',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-xs',
  lg: 'px-5 py-3 text-sm',
};

const iconSizes = {
  sm: 12,
  md: 14,
  lg: 16,
};

export function AdminActionButton({
  onClick,
  icon: Icon,
  children,
  variant = 'primary',
  disabled = false,
  loading = false,
  size = 'md',
  fullWidth = false,
}: AdminActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 rounded-xl font-bold shadow-sm
        transition-all duration-200 hover:-translate-y-0.5 hover:shadow
        active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed
        disabled:hover:translate-y-0 disabled:hover:shadow-sm
        focus:outline-none focus:ring-4
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : ''}
      `}
    >
      {loading ? (
        <span className={`animate-spin rounded-full border-2 border-current border-t-transparent ${size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-4 w-4' : 'h-3.5 w-3.5'}`} />
      ) : Icon ? (
        <Icon size={iconSizes[size]} strokeWidth={2.5} />
      ) : null}
      {children}
    </button>
  );
}
