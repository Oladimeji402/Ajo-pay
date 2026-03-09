'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    UsersRound,
    History,
    Settings,
    Banknote,
    LogOut,
    Menu,
    X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { adminLogout, getAdminEmail } from '@/lib/admin-auth';
import { useRealtimeSubscription } from '@/lib/hooks/useRealtimeSubscription';

const LAYOUT_REALTIME_TABLES = ['payouts', 'profiles'];

function formatBadgeCount(value: number) {
    return value > 99 ? '99+' : String(value);
}

interface AdminLayoutProps {
    children: ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [adminEmail, setAdminEmail] = useState('admin@ajopay.com');
    const [pendingPayoutsCount, setPendingPayoutsCount] = useState(0);
    const [newUsersTodayCount, setNewUsersTodayCount] = useState(0);
    const { refreshTrigger } = useRealtimeSubscription({
        channelName: 'admin-layout-badges',
        tables: LAYOUT_REALTIME_TABLES,
    });

    useEffect(() => {
        const loadAdminEmail = async () => {
            const email = await getAdminEmail();
            if (email) {
                setAdminEmail(email);
            }
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

                if (statsRes.ok) {
                    setPendingPayoutsCount(Number(statsJson.data?.pendingPayouts ?? 0));
                }

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
                // Keep layout resilient; badges are non-blocking metadata.
            }
        };

        void loadBadges();
    }, [refreshTrigger]);

    const navItems = [
        { name: 'Overview', icon: <LayoutDashboard size={20} />, path: '/admin' },
        { name: 'Users', icon: <Users size={20} />, path: '/admin/users', badge: newUsersTodayCount },
        { name: 'Groups', icon: <UsersRound size={20} />, path: '/admin/groups' },
        { name: 'Payouts', icon: <Banknote size={20} />, path: '/admin/payouts', badge: pendingPayoutsCount },
        { name: 'Transactions', icon: <History size={20} />, path: '/admin/transactions' },
        { name: 'Settings', icon: <Settings size={20} />, path: '/admin/settings' },
    ];

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

    const sidebarContent = (
        <>
            {/* Logo */}
            <div className="p-6 border-b border-white/5">
                <Link href="/admin" className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-linear-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20">
                        <span className="text-white font-bold text-xl">A</span>
                    </div>
                    <div>
                        <span className="text-xl font-bold text-white tracking-tight block">Ajopay</span>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                            <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Admin Panel</span>
                        </div>
                    </div>
                </Link>
            </div>

            {/* Nav Items */}
            <nav className="grow px-4 py-6 space-y-1 overflow-y-auto">
                <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] mb-3">Management</p>
                {navItems.map((item) => {
                    const isActive = pathname === item.path || (item.path !== '/admin' && pathname.startsWith(item.path));
                    return (
                        <Link
                            key={item.name}
                            href={item.path}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`relative flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${isActive
                                ? 'bg-white/10 text-white font-bold'
                                : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                                }`}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="admin-sidebar-active"
                                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-red-500 rounded-r-full"
                                />
                            )}
                            {item.icon}
                            <span className="text-sm">{item.name}</span>
                            {(item.badge ?? 0) > 0 ? (
                                <span className="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                                    {formatBadgeCount(item.badge ?? 0)}
                                </span>
                            ) : null}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer / User Card */}
            <div className="p-4 mt-auto border-t border-white/5 bg-black/20">
                <div className="flex items-center gap-3 mb-4 px-2">
                    <div className="w-9 h-9 bg-slate-700 rounded-full flex items-center justify-center text-white font-bold text-xs ring-2 ring-white/10">
                        AD
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">Administrator</p>
                        <p className="text-[10px] text-slate-500 truncate">{adminEmail}</p>
                    </div>
                </div>
                <button
                    onClick={adminLogout}
                    className="flex items-center gap-3 px-4 py-2.5 w-full text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-200 text-sm font-medium"
                >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                </button>
            </div>
        </>
    );

    return (
        <div className="min-h-screen bg-[#F5F7FB] flex">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex w-70 bg-brand-navy flex-col sticky top-0 h-screen z-50 shadow-2xl">
                {sidebarContent}
            </aside>

            {/* Main Content Area */}
            <main className="grow flex flex-col min-w-0 overflow-x-hidden">
                {/* Header */}
                <header className="h-18 bg-white/80 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between px-6 md:px-10 sticky top-0 z-40">
                    <div className="flex items-center gap-4">
                        <button
                            className="lg:hidden p-2 text-brand-navy hover:bg-slate-100 rounded-lg"
                            onClick={toggleMobileMenu}
                        >
                            <Menu size={24} />
                        </button>
                        <h2 className="text-sm font-bold text-brand-navy uppercase tracking-widest hidden sm:block">
                            Dashboard Central
                        </h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end mr-2">
                            <span className="text-xs font-bold text-brand-navy">Server Status</span>
                            <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                <span className="text-[10px] font-bold text-emerald-500 uppercase">Operational</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="p-6 md:p-10 max-w-400 mx-auto w-full">
                    {children}
                </div>
            </main>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={toggleMobileMenu}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
                        />
                        <motion.aside
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 left-0 bottom-0 w-70 bg-brand-navy flex-col z-60 flex lg:hidden shadow-2xl"
                        >
                            <button
                                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white"
                                onClick={toggleMobileMenu}
                            >
                                <X size={24} />
                            </button>
                            {sidebarContent}
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};
