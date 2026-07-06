'use client';

import React from 'react';
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  Eye,
  Flag,
  Shield,
  Star,
  TrendingUp,
  XCircle,
  FileQuestion,
  LucideIcon,
} from 'lucide-react';

export type FlagType =
  | 'high_value'
  | 'high_risk'
  | 'vip'
  | 'suspicious'
  | 'verified'
  | 'trusted'
  | 'watch_list'
  | 'fraud_alert'
  | 'compliance_review'
  | 'kyc_pending'
  | 'custom';

interface UserFlagBadgeProps {
  flagType: FlagType;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

type FlagConfig = {
  icon: LucideIcon;
  label: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
};

const flagConfigs: Record<FlagType, FlagConfig> = {
  high_value: {
    icon: TrendingUp,
    label: 'High Value',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
  },
  high_risk: {
    icon: AlertTriangle,
    label: 'High Risk',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
  },
  vip: {
    icon: Star,
    label: 'VIP',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200',
  },
  suspicious: {
    icon: Eye,
    label: 'Suspicious',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-200',
  },
  verified: {
    icon: CheckCircle2,
    label: 'Verified',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
  },
  trusted: {
    icon: Shield,
    label: 'Trusted',
    bgColor: 'bg-teal-50',
    textColor: 'text-teal-700',
    borderColor: 'border-teal-200',
  },
  watch_list: {
    icon: Eye,
    label: 'Watch List',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
  },
  fraud_alert: {
    icon: XCircle,
    label: 'Fraud Alert',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
  },
  compliance_review: {
    icon: FileQuestion,
    label: 'Compliance Review',
    bgColor: 'bg-indigo-50',
    textColor: 'text-indigo-700',
    borderColor: 'border-indigo-200',
  },
  kyc_pending: {
    icon: Award,
    label: 'KYC Pending',
    bgColor: 'bg-slate-50',
    textColor: 'text-slate-700',
    borderColor: 'border-slate-200',
  },
  custom: {
    icon: Flag,
    label: 'Custom',
    bgColor: 'bg-slate-50',
    textColor: 'text-slate-700',
    borderColor: 'border-slate-200',
  },
};

const sizeClasses = {
  sm: {
    container: 'px-2 py-1 text-[10px]',
    icon: 10,
  },
  md: {
    container: 'px-2.5 py-1 text-[10px]',
    icon: 11,
  },
  lg: {
    container: 'px-3 py-1.5 text-xs',
    icon: 12,
  },
};

export function UserFlagBadge({ flagType, label, size = 'md', showIcon = true }: UserFlagBadgeProps) {
  const config = flagConfigs[flagType];
  const Icon = config.icon;
  const displayLabel = label || config.label;
  const sizeConfig = sizeClasses[size];

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-lg border font-bold uppercase tracking-wider
        ${config.bgColor} ${config.textColor} ${config.borderColor}
        ${sizeConfig.container}
      `}
    >
      {showIcon && <Icon size={sizeConfig.icon} strokeWidth={2.5} />}
      {displayLabel}
    </span>
  );
}
