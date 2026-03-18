'use client';

import { Container } from '../ui/Container';
import { Button } from '../ui/Button';
import { motion } from 'motion/react';
import {
    ArrowRight,
    Users,
    ShieldCheck,
    TrendingUp,
    Bell,
    Eye,
    ArrowUpRight,
    ArrowDownLeft,
    LayoutGrid,
    ChevronRight,
    Star,
} from 'lucide-react';
import Link from 'next/link';

// ─── Phone Mockup ────────────────────────────────────────────────────────────
const PhoneMockup = () => (
    <div className="relative w-full flex justify-center items-center select-none">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-72 rounded-full bg-brand-primary/15 blur-[80px]" />
        </div>

        <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            className="relative z-10 w-[220px] rounded-[2.5rem] bg-[#0F172A] overflow-hidden"
            style={{
                border: '6px solid #1e2d4a',
                boxShadow: '0 25px 60px rgba(27,47,107,0.35), 0 8px 24px rgba(0,0,0,0.25)',
            }}
        >
            {/* Dynamic Island */}
            <div className="flex justify-center pt-2 pb-0.5">
                <div className="w-16 h-4 rounded-full bg-black flex items-center justify-center gap-1">
                    <div className="w-1 h-1 rounded-full bg-[#1a1a1a]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#111]" />
                </div>
            </div>

            <div className="bg-[#F8FAFC] flex flex-col rounded-b-[2rem] overflow-hidden">
                {/* Status Bar */}
                <div className="flex items-center justify-between px-3 py-1">
                    <span className="text-[8px] font-bold text-[#0F172A]">9:41</span>
                    <div className="flex items-center gap-1">
                        <div className="flex gap-[2px] items-end h-2">
                            {[3, 5, 7, 8].map((h, i) => (
                                <div key={i} className="w-[2px] rounded-sm bg-[#0F172A]" style={{ height: `${h}px` }} />
                            ))}
                        </div>
                        <div className="flex items-center ml-0.5">
                            <div className="w-4 h-2 rounded-sm border border-[#0F172A] flex items-center p-[1px]">
                                <div className="w-3/4 h-full bg-[#0F766E] rounded-sm" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* App Header */}
                <div className="flex items-center justify-between px-3 py-1.5">
                    <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-emerald to-emerald-400 flex items-center justify-center text-[8px] font-bold text-white">
                            F
                        </div>
                        <div>
                            <p className="text-[7px] text-[#64748b] leading-none">Welcome back,</p>
                            <p className="text-[9px] font-bold text-[#0F172A] leading-tight">Franklyn</p>
                        </div>
                    </div>
                    <div className="w-5 h-5 bg-white rounded-full shadow-sm border border-[#E2E8F0] flex items-center justify-center relative">
                        <Bell size={9} className="text-[#0F172A]" />
                        <span className="absolute top-0 right-0 w-1 h-1 bg-red-500 rounded-full border border-white" />
                    </div>
                </div>

                {/* Balance Card */}
                <div className="mx-3 mb-1.5 rounded-xl bg-gradient-to-br from-[#1B2F6B] to-[#0F172A] p-2.5 text-white relative overflow-hidden">
                    <div className="absolute -top-4 -right-4 w-12 h-12 bg-white/10 rounded-full blur-xl" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-1 mb-0.5">
                            <span className="text-[7px] opacity-80 font-medium">Total Balance</span>
                            <Eye size={7} className="opacity-60" />
                        </div>
                        <p className="text-[15px] font-bold tracking-tight mb-1.5">₦1,250,000</p>
                        <div className="flex items-center gap-1 bg-white/10 rounded-md px-1.5 py-0.5 w-fit">
                            <TrendingUp size={7} className="text-[#4ade80]" />
                            <span className="text-[7px] font-bold text-[#4ade80]">+12.4% this month</span>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="mx-3 mb-1.5 grid grid-cols-3 gap-1.5">
                    {[
                        { icon: <Users size={10} />, label: 'Groups', bg: 'bg-[#E8EEF8]', color: 'text-[#1B2F6B]' },
                        { icon: <ArrowUpRight size={10} />, label: 'Send', bg: 'bg-[#f0fdf4]', color: 'text-[#0F766E]' },
                        { icon: <LayoutGrid size={10} />, label: 'More', bg: 'bg-[#faf5ff]', color: 'text-[#7c3aed]' },
                    ].map((a, i) => (
                        <div key={i} className={`${a.bg} rounded-lg py-2 flex flex-col items-center gap-0.5`}>
                            <div className={`${a.color}`}>{a.icon}</div>
                            <span className="text-[7px] font-bold text-[#0F172A]">{a.label}</span>
                        </div>
                    ))}
                </div>

                {/* Transaction List */}
                <div className="mx-3 bg-white rounded-lg p-2 shadow-sm border border-[#E2E8F0]">
                    <div className="flex items-center justify-between mb-1">
                        <p className="text-[8px] font-bold text-[#0F172A]">Recent Activity</p>
                        <span className="text-[7px] font-bold text-[#0F766E] flex items-center gap-0.5">
                            See All <ChevronRight size={7} />
                        </span>
                    </div>
                    {[
                        { label: 'Lagos Techies Ajo', sub: 'Oct 12', amount: '−₦50,000', credit: false },
                        { label: 'Family Savings', sub: 'Sep 28', amount: '+₦450,000', credit: true },
                    ].map((tx, i) => (
                        <div key={i} className="flex items-center justify-between py-1 border-b border-[#F1F5F9] last:border-0">
                            <div className="flex items-center gap-1.5">
                                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${tx.credit ? 'bg-[#0F766E]/10' : 'bg-[#1B2F6B]/10'}`}>
                                    {tx.credit ? <ArrowDownLeft size={8} className="text-[#0F766E]" /> : <ArrowUpRight size={8} className="text-[#1B2F6B]" />}
                                </div>
                                <div>
                                    <p className="text-[7px] font-bold text-[#0F172A] leading-none">{tx.label}</p>
                                    <p className="text-[6px] text-[#94a3b8]">{tx.sub}</p>
                                </div>
                            </div>
                            <p className={`text-[7px] font-bold ${tx.credit ? 'text-[#0F766E]' : 'text-[#0F172A]'}`}>{tx.amount}</p>
                        </div>
                    ))}
                </div>

                {/* Bottom Nav */}
                <div className="mx-3 mt-1.5 mb-1.5 flex items-center justify-around py-1.5">
                    {[
                        { icon: <LayoutGrid size={9} />, label: 'Home', active: true },
                        { icon: <Users size={9} />, label: 'Groups', active: false },
                        { icon: <TrendingUp size={9} />, label: 'Activity', active: false },
                        { icon: <ShieldCheck size={9} />, label: 'Settings', active: false },
                    ].map((item) => (
                        <div key={item.label} className="flex flex-col items-center gap-0.5">
                            <div className={`w-5 h-5 rounded-md flex items-center justify-center ${item.active ? 'bg-brand-emerald/10 text-brand-emerald' : 'text-[#94a3b8]'}`}>
                                {item.icon}
                            </div>
                            <span className={`text-[5px] font-bold ${item.active ? 'text-brand-emerald' : 'text-[#94a3b8]'}`}>{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    </div>
);

// ─── Hero Section ────────────────────────────────────────────────────────────
export const Hero = () => {
    return (
        <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#030d1f]">

            {/* ─── Background orbs + grid ─── */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-[20%] -right-[8%] w-[60%] h-[70%] rounded-full bg-brand-emerald/[0.09] blur-[130px]" />
                <div className="absolute -bottom-[25%] -left-[8%] w-[55%] h-[65%] rounded-full bg-brand-primary/[0.12] blur-[130px]" />
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 0.5px, transparent 0.5px)',
                        backgroundSize: '28px 28px',
                    }}
                />
            </div>

            <Container className="relative z-10 w-full pt-20 pb-28 lg:pt-24 lg:pb-36">
                <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">

                    {/* ─── LEFT — Copy ─── */}
                    <motion.div
                        initial={{ opacity: 0, y: 36 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, ease: [0.21, 0.45, 0.27, 0.9] }}
                    >
                        {/* Live badge */}
                        <motion.div
                            initial={{ opacity: 0, x: -16 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.15 }}
                            className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-brand-emerald/[0.10] border border-brand-emerald/[0.18] mb-8"
                        >
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-emerald opacity-75" />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-emerald" />
                            </span>
                            <span className="text-[12.5px] font-semibold text-brand-emerald">
                                Over ₦2 Billion saved across Nigeria
                            </span>
                        </motion.div>

                        {/* Headline */}
                        <motion.h1
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.65 }}
                            className="text-[2.75rem] sm:text-[3.2rem] lg:text-[3.75rem] xl:text-[4.2rem] font-extrabold leading-[1.06] tracking-[-0.028em] mb-6"
                        >
                            <span className="text-white">Save Together</span>
                            <span className="text-white/20">.</span>
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-emerald via-emerald-400 to-cyan-400">
                                Grow Together
                            </span>
                            <span className="text-white/20">.</span>
                        </motion.h1>

                        {/* Subtitle */}
                        <motion.p
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.28 }}
                            className="text-slate-400 text-[16px] sm:text-[17px] leading-[1.75] mb-10 max-w-[500px]"
                        >
                            The modern platform for Nigeria&apos;s trusted{' '}
                            <span className="text-white font-medium">Ajo savings tradition</span>.
                            Automate contributions, track every naira, and receive payouts reliably — all from your phone.
                        </motion.p>

                        {/* CTAs */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35 }}
                            className="flex flex-col sm:flex-row gap-3 mb-12"
                        >
                            <Link href="/signup" className="w-full sm:w-auto">
                                <Button
                                    size="lg"
                                    className="w-full sm:w-auto text-[15px] rounded-2xl bg-brand-emerald hover:bg-brand-emerald-hover shadow-xl shadow-brand-emerald/30 border-0 group justify-center"
                                >
                                    Start Saving — It&apos;s Free
                                    <ArrowRight size={16} className="ml-2 group-hover:translate-x-0.5 transition-transform" />
                                </Button>
                            </Link>
                            <a href="#how-it-works" className="w-full sm:w-auto">
                                <button className="w-full inline-flex items-center justify-center text-[15px] font-semibold px-8 py-4 rounded-2xl text-white/80 hover:text-white bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.10] transition-all">
                                    See How It Works
                                </button>
                            </a>
                        </motion.div>

                        {/* Social proof */}
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.43 }}
                            className="flex items-center gap-4"
                        >
                            <div className="flex -space-x-2.5">
                                {[
                                    { initials: 'OJ', color: '#1B2F6B' },
                                    { initials: 'CE', color: '#0F766E' },
                                    { initials: 'IK', color: '#7c3aed' },
                                    { initials: 'AU', color: '#0e7490' },
                                    { initials: 'BT', color: '#b45309' },
                                ].map((u, i) => (
                                    <div
                                        key={i}
                                        className="w-8 h-8 rounded-full border-2 border-[#030d1f] flex items-center justify-center text-[9px] font-black text-white"
                                        style={{ backgroundColor: u.color }}
                                    >
                                        {u.initials}
                                    </div>
                                ))}
                            </div>
                            <div>
                                <div className="flex items-center gap-0.5 mb-0.5">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={11} className="fill-amber-400 text-amber-400" />
                                    ))}
                                    <span className="text-[12px] font-bold text-white ml-1">4.9</span>
                                </div>
                                <p className="text-[12px] text-slate-500">Trusted by 50,000+ Nigerian savers</p>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* ─── RIGHT — Phone + Floating Cards ─── */}
                    <motion.div
                        initial={{ opacity: 0, y: 36 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.22 }}
                        className="relative flex justify-center items-center min-h-[540px] lg:min-h-[600px]"
                    >
                        {/* Glow behind phone */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-80 h-80 rounded-full bg-brand-emerald/[0.18] blur-[90px]" />
                            <div className="absolute w-56 h-56 rounded-full bg-brand-primary/[0.18] blur-[80px]" />
                        </div>

                        {/* Floating card — Payout received */}
                        <motion.div
                            initial={{ opacity: 0, x: -28, y: 10 }}
                            animate={{ opacity: 1, x: 0, y: 0 }}
                            transition={{ delay: 0.9, duration: 0.55 }}
                            style={{ animation: 'float-y 5s ease-in-out infinite' }}
                            className="absolute top-[6%] -left-2 lg:-left-10 z-20 bg-white rounded-2xl p-3.5 shadow-2xl shadow-black/50 w-52"
                        >
                            <div className="flex items-center gap-2.5 mb-2">
                                <div className="w-9 h-9 bg-brand-emerald/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <TrendingUp size={16} className="text-brand-emerald" />
                                </div>
                                <div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Payout Received</p>
                                    <p className="text-[15px] font-extrabold text-slate-900 leading-tight">+₦450,000</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-brand-emerald animate-pulse flex-shrink-0" />
                                <p className="text-[10px] text-slate-400">Family Savings · Just now</p>
                            </div>
                        </motion.div>

                        {/* Floating card — Group progress */}
                        <motion.div
                            initial={{ opacity: 0, x: 28, y: 10 }}
                            animate={{ opacity: 1, x: 0, y: 0 }}
                            transition={{ delay: 1.1, duration: 0.55 }}
                            style={{ animation: 'float-y 6s ease-in-out infinite 1.5s' }}
                            className="absolute bottom-[16%] -right-2 lg:-right-8 z-20 bg-white rounded-2xl p-3.5 shadow-2xl shadow-black/50 w-[200px]"
                        >
                            <div className="flex items-center gap-2.5 mb-2.5">
                                <div className="w-9 h-9 bg-brand-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <Users size={16} className="text-brand-primary" />
                                </div>
                                <div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Lagos Techies</p>
                                    <p className="text-[12px] font-extrabold text-slate-900 leading-tight">8 / 10 paid ✓</p>
                                </div>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: '80%' }}
                                    transition={{ delay: 1.6, duration: 1, ease: 'easeOut' }}
                                    className="h-full bg-gradient-to-r from-brand-primary to-brand-emerald rounded-full"
                                />
                            </div>
                        </motion.div>

                        {/* Floating chip — Security */}
                        <motion.div
                            initial={{ opacity: 0, x: -22 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 1.3, duration: 0.5 }}
                            className="absolute top-[50%] -left-2 lg:-left-10 z-20 bg-white rounded-2xl p-2.5 shadow-xl shadow-black/30 flex items-center gap-2 border border-slate-100"
                        >
                            <div className="w-7 h-7 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                <ShieldCheck size={13} className="text-amber-500" />
                            </div>
                            <div>
                                <p className="text-[11px] font-bold text-slate-900 leading-tight">Bank-Grade Security</p>
                                <p className="text-[9px] text-slate-400">256-bit SSL · Always on</p>
                            </div>
                        </motion.div>

                        <PhoneMockup />
                    </motion.div>

                </div>
            </Container>

            {/* ─── Stats bar at the bottom ─── */}
            <div className="absolute bottom-0 left-0 right-0 border-t border-white/[0.07]">
                <Container>
                    <div className="grid grid-cols-2 md:grid-cols-4">
                        {[
                            { value: '₦2B+', label: 'Total Saved' },
                            { value: '50K+', label: 'Active Savers' },
                            { value: '200+', label: 'Active Groups' },
                            { value: '4.9★', label: 'App Rating' },
                        ].map((stat, i) => (
                            <div
                                key={i}
                                className={`flex flex-col items-center py-5 ${i < 3 ? 'border-r border-white/[0.07]' : ''}`}
                            >
                                <span className="text-[1.35rem] lg:text-[1.5rem] font-extrabold text-white tracking-tight">{stat.value}</span>
                                <span className="text-[11px] text-slate-500 mt-0.5">{stat.label}</span>
                            </div>
                        ))}
                    </div>
                </Container>
            </div>

        </section>
    );
};
