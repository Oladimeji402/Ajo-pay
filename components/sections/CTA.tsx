'use client';

import { Container } from '../ui/Container';
import { Button } from '../ui/Button';
import { motion } from 'motion/react';
import { ArrowRight, ShieldCheck, Smartphone, CheckCircle2, TrendingUp, Users } from 'lucide-react';
import Link from 'next/link';

export const CTA = () => {
    const avatarColors = [
        { bg: '#1B2F6B', text: 'OJ' },
        { bg: '#0F766E', text: 'CE' },
        { bg: '#7c3aed', text: 'IK' },
        { bg: '#0e7490', text: 'BT' },
        { bg: '#b45309', text: 'AU' },
    ];

    return (
        <section className="py-24 lg:py-32 bg-[#F8FAFC] overflow-hidden">
            <Container>
                <motion.div
                    initial={{ opacity: 0, y: 32 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="relative rounded-[2rem] lg:rounded-[2.5rem] overflow-hidden"
                >
                    {/* Background */}
                    <div className="absolute inset-0 bg-[#030d1f]" />
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-emerald/[0.07] rounded-full -mr-48 -mt-64 blur-[120px] pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-primary/[0.12] rounded-full -ml-48 -mb-64 blur-[100px] pointer-events-none" />
                    <div
                        className="absolute inset-0 opacity-[0.025]"
                        style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,1) 0.5px, transparent 0.5px)', backgroundSize: '28px 28px' }}
                    />

                    {/* Content */}
                    <div className="relative z-10 px-8 py-16 md:px-14 lg:px-20 lg:py-20">
                        <div className="grid lg:grid-cols-[1fr_auto] gap-12 lg:gap-20 items-center">

                            {/* ─── Left — Copy ─── */}
                            <div>
                                {/* Live badge */}
                                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-emerald/[0.10] border border-brand-emerald/[0.18] mb-7">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-emerald opacity-75" />
                                        <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-emerald" />
                                    </span>
                                    <span className="text-[12px] font-semibold text-brand-emerald">Join 50,000+ Nigerian Savers</span>
                                </div>

                                <h2 className="text-[2.4rem] sm:text-[3rem] lg:text-[3.5rem] font-extrabold text-white leading-[1.06] tracking-[-0.025em] mb-5">
                                    Your savings goal<br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-emerald via-emerald-400 to-cyan-400">
                                        starts right here.
                                    </span>
                                </h2>

                                <p className="text-slate-400 text-[15.5px] leading-relaxed mb-8 max-w-md">
                                    Create your free account in under 2 minutes, join an Ajo group, and start building your financial future — automatically.
                                </p>

                                {/* CTAs */}
                                <div className="flex flex-col sm:flex-row gap-3 mb-8">
                                    <Link href="/signup" className="w-full sm:w-auto">
                                        <Button
                                            variant="white"
                                            size="lg"
                                            className="w-full sm:w-auto text-[15px] rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-black/30 group font-bold"
                                        >
                                            Create Free Account
                                            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                                        </Button>
                                    </Link>
                                    <Link href="/login" className="w-full sm:w-auto">
                                        <button className="w-full inline-flex items-center justify-center text-[15px] font-semibold px-8 py-4 rounded-2xl text-white/80 hover:text-white bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.10] transition-all">
                                            Sign In
                                        </button>
                                    </Link>
                                </div>

                                {/* Social proof row */}
                                <div className="flex items-center gap-4">
                                    <div className="flex -space-x-2.5">
                                        {avatarColors.map((u, i) => (
                                            <div
                                                key={i}
                                                className="w-8 h-8 rounded-full border-2 border-[#030d1f] flex items-center justify-center text-[9px] font-black text-white"
                                                style={{ backgroundColor: u.bg }}
                                            >
                                                {u.text}
                                            </div>
                                        ))}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-0.5 mb-0.5">
                                            {[...Array(5)].map((_, i) => (
                                                <svg key={i} className="w-2.5 h-2.5 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                                </svg>
                                            ))}
                                        </div>
                                        <p className="text-[11.5px] text-slate-500">Rated 4.9 / 5 by 50k+ users</p>
                                    </div>
                                </div>
                            </div>

                            {/* ─── Right — Trust card ─── */}
                            <div className="w-full lg:w-[300px] flex-shrink-0">
                                <div className="bg-white/[0.05] border border-white/[0.09] rounded-2xl p-6 backdrop-blur-sm">
                                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.12em] mb-4">Why people trust us</p>
                                    <div className="space-y-3 mb-6">
                                        {[
                                            { icon: <ShieldCheck size={15} />, label: 'NDIC Insured Funds', color: 'text-brand-emerald', bg: 'bg-brand-emerald/10' },
                                            { icon: <CheckCircle2 size={15} />, label: 'Zero Hidden Fees', color: 'text-blue-400', bg: 'bg-blue-400/10' },
                                            { icon: <Smartphone size={15} />, label: 'iOS & Android App', color: 'text-purple-400', bg: 'bg-purple-400/10' },
                                            { icon: <TrendingUp size={15} />, label: '99.9% Payout Rate', color: 'text-amber-400', bg: 'bg-amber-400/10' },
                                            { icon: <Users size={15} />, label: 'Verified Group Members', color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center gap-3 p-2.5 bg-white/[0.03] rounded-xl border border-white/[0.05]">
                                                <div className={`w-7 h-7 ${item.bg} rounded-lg flex items-center justify-center flex-shrink-0 ${item.color}`}>
                                                    {item.icon}
                                                </div>
                                                <span className="text-[12.5px] text-slate-300 font-medium">{item.label}</span>
                                                <CheckCircle2 size={11} className="text-brand-emerald ml-auto flex-shrink-0" />
                                            </div>
                                        ))}
                                    </div>

                                    {/* Mini stat */}
                                    <div className="border-t border-white/[0.07] pt-4 grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[1.1rem] font-extrabold text-white">₦2B+</p>
                                            <p className="text-[10px] text-slate-500 mt-0.5">Total saved</p>
                                        </div>
                                        <div>
                                            <p className="text-[1.1rem] font-extrabold text-white">200+</p>
                                            <p className="text-[10px] text-slate-500 mt-0.5">Active groups</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </motion.div>
            </Container>
        </section>
    );
};

