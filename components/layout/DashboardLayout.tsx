'use client';

import React, { ReactNode, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    History,
    Settings,
    Bell,
    LogOut,
    Plus,
    ArrowUpRight,
} from 'lucide-react';
import { motion } from 'motion/react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import { notifyError, notifySuccess } from '@/lib/toast';
import { BrandLogo } from '@/components/ui/BrandLogo';

interface DashboardLayoutProps {
    children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
    const pathname = usePathname();
    const router = useRouter();
    const [userName, setUserName] = useState('Member');
    const [userEmail, setUserEmail] = useState('member@subtechajosolution.com');
    const [unreadNotifications, setUnreadNotifications] = useState(0);
    const { showToast } = useToast();

    useEffect(() => {
        const loadUser = async () => {
            const supabase = createSupabaseBrowserClient();
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) return;
            setUserEmail(user.email ?? 'member@subtechajosolution.com');

            const { data: profile } = await supabase
                .from('profiles')
                .select('name')
                .eq('id', user.id)
                .maybeSingle();

            if (profile?.name && profile.name.trim().length > 0) {
                setUserName(profile.name);
            } else if (user.email) {
                setUserName(user.email.split('@')[0]);
            }
        };

        void loadUser();
    }, []);

    useEffect(() => {
        const loadNotifications = async () => {
            try {
                const response = await fetch('/api/notifications?limit=10', { cache: 'no-store' });
                const payload = await response.json();
                if (!response.ok) {
                    return;
                }

                setUnreadNotifications(Number(payload.unreadCount ?? 0));
            } catch {
                // Keep layout resilient if notifications fail to load.
            }
        };

        void loadNotifications();
    }, [pathname]);

    const userInitial = useMemo(() => userName.trim().charAt(0).toUpperCase() || 'M', [userName]);

    const navItems = [
        { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
        { name: 'Groups', icon: <Users size={20} />, path: '/groups' },
        { name: 'Activity', icon: <History size={20} />, path: '/activity' },
        { name: 'Notifications', icon: <Bell size={20} />, path: '/notifications' },
        { name: 'Settings', icon: <Settings size={20} />, path: '/settings' },
    ];

    // Mobile order keeps Join (Groups) in the center slot for easier thumb reach.
    const mobileNavItems = [
        { name: 'Dashboard', mobileLabel: 'Home', icon: <LayoutDashboard size={18} />, path: '/dashboard' },
        { name: 'Activity', mobileLabel: 'Activity', icon: <History size={18} />, path: '/activity' },
        { name: 'Groups', mobileLabel: 'Join', icon: <Users size={18} />, path: '/groups' },
        { name: 'Notifications', mobileLabel: 'Alerts', icon: <Bell size={18} />, path: '/notifications' },
        { name: 'Settings', mobileLabel: 'Settings', icon: <Settings size={18} />, path: '/settings' },
    ];

    const isPathActive = (path: string) => {
        if (path === '/dashboard') return pathname === '/dashboard';
        return pathname.startsWith(path);
    };

    const currentSection = (() => {
        const active = navItems.find((item) => isPathActive(item.path));
        return active?.name ?? 'Dashboard';
    })();

    const sectionHeading = (() => {
        const labels: Record<string, string> = {
            Dashboard: 'Dashboard Command Center',
            Groups: 'Groups Workspace',
            Activity: 'Activity Timeline',
            Notifications: 'Notifications Inbox',
            Settings: 'Account Settings',
        };

        return labels[currentSection] ?? `${currentSection} Workspace`;
    })();

    const handleSignOut = async () => {
        const supabase = createSupabaseBrowserClient();
        const { error } = await supabase.auth.signOut();
        if (error) {
            notifyError(showToast, error, 'Unable to sign out right now. Please try again.');
            return;
        }
        notifySuccess(showToast, 'Signed out successfully.');
        router.push('/login');
        router.refresh();
    };

    return (
        <div className="min-h-screen bg-linear-to-b from-slate-50 via-[#F3F6FA] to-white flex flex-col md:flex-row">
            <aside className="hidden md:flex w-72 shrink-0 sticky top-0 h-screen p-4">
                <div className="relative w-full rounded-3xl border border-slate-200/70 bg-linear-to-b from-brand-navy via-[#172554] to-[#0B223D] text-white overflow-hidden flex flex-col">
                    <div className="absolute -top-16 -right-16 h-44 w-44 rounded-full bg-brand-emerald/20 blur-3xl" />
                    <div className="absolute bottom-8 -left-12 h-40 w-40 rounded-full bg-white/10 blur-3xl" />

                    <div className="relative p-6 pb-5">
                        <BrandLogo />
                        <p className="mt-4 text-[10px] uppercase tracking-[0.2em] text-slate-300 font-semibold">Member Workspace</p>
                    </div>

                    <nav className="relative flex-1 overflow-y-auto px-4">
                        <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">Navigate</p>
                        <div className="space-y-1.5">
                            {navItems.map((item) => {
                                const isActive = isPathActive(item.path);
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.path}
                                        className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${isActive
                                            ? 'bg-white/12 text-white shadow-lg shadow-black/15'
                                            : 'text-slate-300 hover:bg-white/8 hover:text-white'
                                            }`}
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="sidebar-active"
                                                className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-brand-emerald"
                                            />
                                        )}
                                        {item.icon}
                                        <span className="text-sm font-semibold">{item.name}</span>
                                    </Link>
                                );
                            })}
                        </div>

                        <div className="pt-6">
                            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">Actions</p>
                            <div className="space-y-2">
                                <Link href="/groups" className="w-full inline-flex items-center justify-between rounded-xl bg-linear-to-r from-brand-emerald to-emerald-500 px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-emerald/25 hover:shadow-brand-emerald/45 transition-shadow">
                                    Join a Group
                                    <Plus size={16} />
                                </Link>
                                <Link href="/activity" className="w-full inline-flex items-center justify-between rounded-xl border border-white/15 bg-white/8 px-3 py-2.5 text-sm font-semibold text-slate-200 hover:text-white hover:bg-white/12 transition-colors">
                                    Review Activity
                                    <ArrowUpRight size={15} />
                                </Link>
                            </div>
                        </div>
                    </nav>

                    <div className="relative p-4 pt-5 mt-auto">
                        <div className="rounded-2xl border border-white/10 bg-white/8 p-3.5">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="h-10 w-10 rounded-full bg-linear-to-br from-brand-emerald to-emerald-400 text-white font-bold text-sm grid place-items-center">
                                    {userInitial}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-white truncate">{userName}</p>
                                    <p className="text-[10px] text-slate-300 truncate">{userEmail}</p>
                                </div>
                            </div>
                            <button onClick={handleSignOut} className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 hover:text-red-200 hover:border-red-300/30 hover:bg-red-400/10 transition-colors">
                                <LogOut size={14} />
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            <main className="grow min-w-0 pb-24 md:pb-0">
                <header className="hidden md:flex sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl px-8 py-4 items-center justify-between">
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-gray">{currentSection}</p>
                        <h1 className="text-lg font-semibold text-brand-navy">{sectionHeading}</h1>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link href="/notifications" className="relative inline-flex items-center justify-center h-10 w-10 rounded-xl border border-slate-200 bg-white text-brand-gray hover:text-brand-navy hover:bg-slate-50 transition-colors">
                            <Bell size={18} />
                            {unreadNotifications > 0 && (
                                <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-brand-emerald px-1.5 py-0.5 text-center text-[10px] font-bold text-white">
                                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                                </span>
                            )}
                        </Link>
                        <Link href="/groups" className="inline-flex items-center gap-2 rounded-xl bg-brand-navy px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-brand-primary transition-colors">
                            <Plus size={15} />
                            Join Group
                        </Link>
                    </div>
                </header>

                <header className="md:hidden sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-xl px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-gray">{currentSection}</p>
                            <p className="text-sm font-semibold text-brand-navy truncate">{sectionHeading}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Link href="/notifications" className="relative inline-flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 bg-white text-brand-gray">
                                <Bell size={16} />
                                {unreadNotifications > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-emerald" />}
                            </Link>
                            <button
                                onClick={handleSignOut}
                                className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 bg-white text-brand-gray hover:text-red-600 hover:border-red-200 transition-colors"
                                title="Sign Out"
                            >
                                <LogOut size={16} />
                            </button>
                        </div>
                    </div>
                </header>

                <div className="p-4 md:p-8">
                    {children}
                </div>
            </main>

            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 p-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
                <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-xl shadow-xl shadow-slate-300/30 px-2 py-2">
                    <div className="grid grid-cols-5 items-end gap-1">
                        {mobileNavItems.map((item) => {
                            const isActive = isPathActive(item.path);
                            const isPrimary = item.path === '/groups';

                            if (isPrimary) {
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.path}
                                        className={`-mt-5 flex flex-col items-center gap-0.5 rounded-xl px-1.5 py-2 text-[9px] font-bold transition-all ${isActive
                                            ? 'bg-linear-to-b from-brand-emerald to-emerald-500 text-white shadow-lg shadow-brand-emerald/35'
                                            : 'bg-linear-to-b from-brand-navy to-brand-primary text-white shadow-md shadow-slate-400/35'
                                            }`}
                                    >
                                        <Plus size={16} />
                                        <span className="uppercase tracking-[0.05em] leading-none whitespace-nowrap">{item.mobileLabel}</span>
                                    </Link>
                                );
                            }

                            return (
                                <Link
                                    key={item.name}
                                    href={item.path}
                                    className={`relative flex flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[9px] font-semibold transition-colors ${isActive ? 'text-brand-navy' : 'text-slate-400'}`}
                                >
                                    {item.icon}
                                    {item.path === '/notifications' && unreadNotifications > 0 && (
                                        <span className="absolute right-1 top-0 h-1.5 w-1.5 rounded-full bg-brand-emerald" />
                                    )}
                                    <span className="uppercase tracking-[0.04em] leading-none whitespace-nowrap">{item.mobileLabel}</span>
                                    {isActive && <span className="h-1 w-1 rounded-full bg-brand-emerald" />}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </nav>
        </div>
    );
};
