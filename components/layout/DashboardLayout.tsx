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
    Search,
    ChevronRight,
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
    const [userEmail, setUserEmail] = useState('member@ajopay.com');
    const { showToast } = useToast();

    useEffect(() => {
        const loadUser = async () => {
            const supabase = createSupabaseBrowserClient();
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) return;
            setUserEmail(user.email ?? 'member@ajopay.com');

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

    const userInitial = useMemo(() => userName.trim().charAt(0).toUpperCase() || 'M', [userName]);

    const navItems = [
        { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
        { name: 'Groups', icon: <Users size={20} />, path: '/groups' },
        { name: 'Activity', icon: <History size={20} />, path: '/activity' },
        { name: 'Settings', icon: <Settings size={20} />, path: '/settings' },
    ];

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

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
        <div className="min-h-screen bg-[#F5F7FB] flex flex-col md:flex-row">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-65 bg-brand-navy flex-col sticky top-0 h-screen">
                {/* Logo */}
                <div className="p-6 pb-8">
                    <BrandLogo />
                </div>

                {/* Nav Items */}
                <nav className="grow px-4 space-y-1">
                    <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] mb-3">Menu</p>
                    {navItems.map((item) => {
                        const isActive = pathname === item.path;
                        return (
                            <Link
                                key={item.name}
                                href={item.path}
                                className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                    ? 'bg-white/10 text-white font-bold'
                                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                                    }`}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="sidebar-active"
                                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-brand-emerald rounded-r-full"
                                    />
                                )}
                                {item.icon}
                                <span className="text-sm">{item.name}</span>
                            </Link>
                        );
                    })}

                    {/* Join Group CTA */}
                    <div className="pt-6">
                        <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] mb-3">Quick Action</p>
                        <Link href="/groups" className="w-full flex items-center gap-3 px-4 py-3 bg-linear-to-r from-brand-emerald to-emerald-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-brand-emerald/20 hover:shadow-brand-emerald/40 transition-all duration-200">
                            <Plus size={18} />
                            Join Group
                        </Link>
                    </div>
                </nav>

                {/* User Card at Bottom */}
                <div className="p-4 mx-4 mb-4 bg-white/5 rounded-2xl">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-linear-to-br from-brand-emerald to-emerald-400 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                            {userInitial}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white truncate">{userName}</p>
                            <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-brand-emerald rounded-full animate-pulse"></span>
                                <p className="text-[10px] text-slate-400 font-medium truncate">{userEmail}</p>
                            </div>
                        </div>
                    </div>
                    <button onClick={handleSignOut} className="flex items-center gap-2 px-3 py-2 w-full text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200 text-xs font-medium">
                        <LogOut size={14} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="grow flex flex-col pb-20 md:pb-0 min-w-0">
                {/* Desktop Header */}
                <header className="hidden md:flex h-18 bg-white/80 backdrop-blur-xl border-b border-slate-100 items-center justify-between px-8 sticky top-0 z-30">
                    <div>
                        <h1 className="text-lg font-bold text-brand-navy">
                            {getGreeting()}, {userName} 👋
                        </h1>
                        <p className="text-xs text-brand-gray">Here&apos;s what&apos;s happening with your savings</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Search Bar */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="w-56 pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-100 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary/30 focus:bg-white transition-all"
                            />
                        </div>

                        {/* Notification */}
                        <button className="relative p-2.5 text-brand-gray hover:bg-slate-50 rounded-xl transition-colors">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>

                        {/* Profile Chip */}
                        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-100">
                            <div className="w-9 h-9 bg-linear-to-br from-brand-emerald to-emerald-400 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                {userInitial}
                            </div>
                            <ChevronRight size={14} className="text-slate-300" />
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="p-4 md:p-8">
                    {children}
                </div>
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 flex items-center justify-around px-2 z-50 pb-[env(safe-area-inset-bottom)]" style={{ height: '68px' }}>
                {navItems.map((item, index) => {
                    const isActive = pathname === item.path;
                    if (index === 2) {
                        return (
                            <React.Fragment key="fab-group">
                                {/* Center FAB */}
                                <button className="relative -mt-6 w-12 h-12 bg-linear-to-br from-brand-emerald to-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand-emerald/30 active:scale-95 transition-transform">
                                    <Plus size={22} />
                                </button>
                                <Link
                                    key={item.name}
                                    href={item.path}
                                    className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${isActive ? 'text-brand-emerald' : 'text-slate-400'
                                        }`}
                                >
                                    {item.icon}
                                    <span className="text-[9px] font-bold uppercase tracking-wider">{item.name}</span>
                                    {isActive && <span className="w-1 h-1 bg-brand-emerald rounded-full mt-0.5"></span>}
                                </Link>
                            </React.Fragment>
                        );
                    }
                    return (
                        <Link
                            key={item.name}
                            href={item.path}
                            className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${isActive ? 'text-brand-emerald' : 'text-slate-400'
                                }`}
                        >
                            {item.icon}
                            <span className="text-[9px] font-bold uppercase tracking-wider">{item.name}</span>
                            {isActive && <span className="w-1 h-1 bg-brand-emerald rounded-full mt-0.5"></span>}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
};
