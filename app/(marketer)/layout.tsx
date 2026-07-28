'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ClipboardList, LayoutDashboard, LogOut, Loader2 } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { BrandLogo } from '@/components/ui/BrandLogo';

type MarketerMe = {
  id: string;
  name: string;
  status: 'pending' | 'active' | 'rejected' | 'inactive';
  referral_code: string;
  rejection_reason?: string | null;
  open_tasks?: number;
};

export default function MarketerLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [marketer, setMarketer] = useState<MarketerMe | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError('');
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.replace('/login?next=/marketer');
          return;
        }

        const res = await fetch('/api/marketer/me', { cache: 'no-store' });
        const json = await res.json();
        if (res.status === 404) {
          setError('No marketer application is linked to this account.');
          setMarketer(null);
          return;
        }
        if (!res.ok) throw new Error(json.error || 'Failed to load marketer profile.');
        setMarketer(json.data as MarketerMe);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load portal.');
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [router]);

  const logout = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-brand-gray">
        <Loader2 className="animate-spin" size={22} />
      </div>
    );
  }

  if (error || !marketer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center space-y-3">
          <BrandLogo href="/" size="sm" />
          <p className="text-sm text-brand-gray">{error || 'Access unavailable.'}</p>
          <div className="flex justify-center gap-3 text-sm">
            <Link href="/marketer/apply" className="font-semibold text-brand-navy underline">Apply</Link>
            <button type="button" onClick={() => void logout()} className="font-semibold text-brand-gray">Sign out</button>
          </div>
        </div>
      </div>
    );
  }

  const isActive = marketer.status === 'active';
  const nav = [
    { name: 'Overview', href: '/marketer', icon: LayoutDashboard },
    { name: 'Tasks', href: '/marketer/tasks', icon: ClipboardList, disabled: !isActive },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-brand-navy">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between gap-3">
          <BrandLogo href="/marketer" size="sm" />
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-sm text-brand-gray">{marketer.name}</span>
            <button
              type="button"
              onClick={() => void logout()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-brand-gray hover:bg-slate-50"
            >
              <LogOut size={13} /> Sign out
            </button>
          </div>
        </div>
        <nav className="mx-auto max-w-5xl px-4 pb-3 flex gap-2">
          {nav.map((item) => {
            const active = pathname === item.href;
            if (item.disabled) {
              return (
                <span
                  key={item.href}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-300"
                  title="Available after approval"
                >
                  <item.icon size={13} /> {item.name}
                </span>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  active ? 'bg-brand-navy text-white' : 'text-brand-gray hover:bg-slate-100'
                }`}
              >
                <item.icon size={13} /> {item.name}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
