'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    ScrollText,
    Users,
    History,
    Settings,
    Banknote,
    Shield,
    LogOut,
    Menu,
    X,
    CalendarDays,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { adminLogout, getAdminEmail } from '@/lib/admin-auth';
import { useRealtimeSubscription } from '@/lib/hooks/useRealtimeSubscription';
import { BrandLogo } from '@/components/ui/BrandLogo';

const LAYOUT_REALTIME_TABLES = ['payouts', 'profiles', 'savings_schemes', 'passbook_payouts'];

function formatBadgeCount(value: number) {
    return value > 99 ? '99+' : String(value);
}

function getPageTitle(pathname: string): string {
    if (pathname === '/admin') return 'Overview';
    const last = pathname.split('/').filter(Boolean).pop() ?? 'Admin';
    return last.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

interface AdminLayoutProps {
    children: ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [adminEmail, setAdminEmail] = useState('');
    const [pendingPayoutsCount, setPendingPayoutsCount] = useState(0);
    const [newUsersTodayCount, setNewUsersTodayCount] = useState(0);
    const { refreshTrigger } = useRealtimeSubscription({
        channelName: 'admin-layout-badges',
        tables: LAYOUT_REALTIME_TABLES,
    });

    useEffect(() => {
        const loadAdminEmail = async () => {
            const email = await getAdminEmail();
            if (email) setAdminEmail(email);
        };
        void loadAdminEmail();
    }, []);

    useEffect(() => {
        const loadBadges = async () => {
            try {
                const [statsRes, usersRes] = await Promise.all([
                    fetch('/api/admin/stats', { cache: 'no-store' }),
                    fetch('/api/admin/users?page=1&pageSize=500', { cache: 'no-store' }),
                ]);
                const [statsJson, usersJson] = await Promise.all([statsRes.json(), usersRes.json()]);
                if (statsRes.ok) setPendingPayoutsCount(Number(statsJson.data?.pendingPayouts ?? 0));
                if (usersRes.ok && Array.isArray(usersJson.data)) {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const count = usersJson.data.filter((user: { created_at?: string }) => {
                        if (!user.created_at) return false;
                        return new Date(user.created_at).getTime() >= today.getTime();
                    }).length;
                    setNewUsersTodayCount(count);
                }
            } catch {
                // non-blocking
            }
        };
        void loadBadges();
    }, [refreshTrigger]);

    const navItems = [
        { name: 'Overview', icon: LayoutDashboard, path: '/admin' },
        { name: 'Users', icon: Users, path: '/admin/users', badge: newUsersTodayCount },
        { name: 'Payouts', icon: Banknote, path: '/admin/payouts', badge: pendingPayoutsCount },
        { name: 'Festive Periods', icon: CalendarDays, path: '/admin/festive-periods' },
        { name: 'Transactions', icon: History, path: '/admin/transactions' },
        { name: 'Audit Log', icon: ScrollText, path: '/admin/audit-log' },
        { name: 'Security', icon: Shield, path: '/admin/security' },
        { name: 'Settings', icon: Settings, path: '/admin/settings' },
    ];

    const toggleMobileMenu = () => setIsMobileMenuOpen((v) => !v);

    const sidebarContent = (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="px-5 py-5 border-b border-white/8">
                <BrandLogo href="/admin" size="sm" />
            </div>

            {/* Nav */}
            <nav className="sidebar-nav flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive =
                        pathname === item.path ||
                        (item.path !== '/admin' && pathname.startsWith(item.path));
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.name}
                            href={item.path}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                                isActive
                                    ? 'bg-white/10 text-white font-medium'
                                    : 'text-slate-400 hover:bg-white/6 hover:text-slate-200 font-normal'
                            }`}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="admin-sidebar-active"
                                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-brand-primary rounded-r-full"
                                />
                            )}
                            <Icon size={16} strokeWidth={isActive ? 2 : 1.75} />
                            <span className="flex-1 truncate">{item.name}</span>
                            {(item.badge ?? 0) > 0 && (
                                <span className="rounded-full bg-brand-primary/80 px-1.5 py-px text-[10px] font-semibold text-white leading-none">
                                    {formatBadgeCount(item.badge ?? 0)}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* User */}
            <div className="px-3 py-3 border-t border-white/8">
                <div className="flex items-center gap-2.5 px-2 py-2 mb-1">
                    <div className="w-7 h-7 bg-white/10 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                        AD
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-white truncate">Administrator</p>
                        {adminEmail && (
                            <p className="text-[10px] text-slate-500 truncate">{adminEmail}</p>
                        )}
                    </div>
                </div>
                <button
                    onClick={adminLogout}
                    className="flex items-center gap-2.5 px-3 py-2 w-full text-slate-500 hover:text-red-400 hover:bg-red-500/8 rounded-lg transition-all duration-150 text-xs"
                >
                    <LogOut size={14} />
                    <span>Sign out</span>
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F5F7FB] flex font-sans">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-56 bg-brand-navy shrink-0 sticky top-0 h-screen z-50">
                {sidebarContent}
            </aside>

            {/* Main */}
            <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
                {/* Header */}
                <header className="h-12 bg-white border-b border-slate-100 flex items-center justify-between px-6 sticky top-0 z-40">
                    <div className="flex items-center gap-3">
                        <button
                            className="lg:hidden p-1.5 text-slate-500 hover:bg-slate-100 rounded-md"
                            onClick={toggleMobileMenu}
                        >
                            <Menu size={18} />
                        </button>
                        <span className="text-sm font-semibold text-brand-navy">
                            {getPageTitle(pathname)}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                        <span className="text-[11px] text-slate-400 font-medium">Live</span>
                    </div>
                </header>

                {/* Page Content */}
                <div className="p-6 md:p-8 max-w-[1400px] mx-auto w-full">
                    {children}
                </div>
            </main>

            {/* Mobile Sidebar */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={toggleMobileMenu}
                            className="fixed inset-0 bg-black/50 z-50 lg:hidden"
                        />
                        <motion.aside
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                            className="fixed top-0 left-0 bottom-0 w-56 bg-brand-navy z-60 flex flex-col lg:hidden"
                        >
                            <button
                                className="absolute top-3.5 right-3.5 p-1.5 text-slate-400 hover:text-white rounded-md"
                                onClick={toggleMobileMenu}
                            >
                                <X size={18} />
                            </button>
                            {sidebarContent}
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};
