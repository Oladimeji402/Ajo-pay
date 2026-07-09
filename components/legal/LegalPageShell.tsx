import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { ReactNode } from 'react';

type LegalPageShellProps = {
  title: string;
  intro: string;
  lastUpdated: string;
  children: ReactNode;
};

export function LegalPageShell({ title, intro, lastUpdated, children }: LegalPageShellProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/signup" className="inline-flex items-center gap-2 font-semibold text-brand-navy transition-colors hover:text-brand-primary">
          <ArrowLeft size={16} /> Back to sign up
        </Link>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 sm:p-6">
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-brand-accent">
          <ShieldCheck size={16} /> Legal documentation
        </div>
        <h2 className="mt-3 text-[1.8rem] leading-tight text-brand-navy">{title}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{intro}</p>
        <p className="mt-4 text-xs font-medium uppercase tracking-[0.2em] text-slate-400">Last updated: {lastUpdated}</p>
      </div>

      <div className="space-y-4">{children}</div>
    </div>
  );
}
