'use client';

import { Container } from '../ui/Container';
import { Button } from '../ui/Button';
import { motion } from 'motion/react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

// ─── Ajo Rotation Circle ──────────────────────────────────────────────────────
// Replaces the generic phone mockup with a visual that actually explains
// what Ajo is — a rotating savings circle where each member gets their turn.
const AjoCircle = () => {
    const SIZE = 340;
    const CX = SIZE / 2;
    const CY = SIZE / 2;
    const R = 118;
    const NODE_R = 26;

    const members = [
        { initials: 'OJ', month: 'Jan', status: 'paid' as const },
        { initials: 'CE', month: 'Feb', status: 'paid' as const },
        { initials: 'IK', month: 'Mar', status: 'current' as const },
        { initials: 'AU', month: 'Apr', status: 'upcoming' as const },
        { initials: 'BT', month: 'May', status: 'upcoming' as const },
        { initials: 'ED', month: 'Jun', status: 'upcoming' as const },
    ];

    const positions = members.map((_, i) => ({
        x: CX + R * Math.cos(-Math.PI / 2 + (2 * Math.PI * i) / members.length),
        y: CY + R * Math.sin(-Math.PI / 2 + (2 * Math.PI * i) / members.length),
    }));

    return (
        <div className="relative select-none" style={{ width: SIZE, height: SIZE }}>
            {/* SVG: ring + connector lines */}
            <svg
                width={SIZE}
                height={SIZE}
                viewBox={`0 0 ${SIZE} ${SIZE}`}
                className="absolute inset-0"
            >
                {/* Outer ambient glow ring */}
                <circle cx={CX} cy={CY} r={R + 30} fill="none"
                    stroke="rgba(245,158,11,0.06)" strokeWidth="40" />

                {/* Main orbit ring */}
                <circle cx={CX} cy={CY} r={R} fill="none"
                    stroke="rgba(255,255,255,0.07)" strokeWidth="1" strokeDasharray="4 6" />

                {/* Paid arc (Jan → current Mar) — spans 2 of 6 segments = 120° */}
                <circle cx={CX} cy={CY} r={R} fill="none"
                    stroke="rgba(37,99,235,0.35)" strokeWidth="2.5"
                    strokeDasharray={`${(2 / 6) * 2 * Math.PI * R} ${2 * Math.PI * R}`}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${CX} ${CY})`}
                />

                {/* Connector lines center → each node */}
                {positions.map((pos, i) => (
                    <line
                        key={i}
                        x1={CX} y1={CY}
                        x2={pos.x} y2={pos.y}
                        stroke={members[i].status === 'current'
                            ? 'rgba(245,158,11,0.20)'
                            : members[i].status === 'paid'
                                ? 'rgba(37,99,235,0.15)'
                                : 'rgba(255,255,255,0.04)'}
                        strokeWidth="1"
                    />
                ))}
            </svg>

            {/* Center — pot amount */}
            <div
                className="absolute flex flex-col items-center justify-center rounded-full bg-white/[0.05] border border-white/[0.08] backdrop-blur-sm"
                style={{
                    width: 80, height: 80,
                    left: CX - 40, top: CY - 40,
                }}
            >
                <span className="text-white font-black text-[13px] tracking-tight leading-none">₦600K</span>
                <span className="text-white/35 text-[8px] mt-0.5 uppercase tracking-widest">Group Pot</span>
            </div>

            {/* Member nodes */}
            {members.map((member, i) => {
                const pos = positions[i];
                const isPaid = member.status === 'paid';
                const isCurrent = member.status === 'current';

                return (
                    <div
                        key={i}
                        className="absolute flex flex-col items-center"
                        style={{
                            left: pos.x - NODE_R,
                            top: pos.y - NODE_R,
                            width: NODE_R * 2,
                        }}
                    >
                        {/* Pulsing ring for current */}
                        {isCurrent && (
                            <div
                                className="absolute rounded-full border border-brand-accent/40 animate-ping"
                                style={{
                                    width: NODE_R * 2 + 16,
                                    height: NODE_R * 2 + 16,
                                    top: -8, left: -8,
                                }}
                            />
                        )}

                        {/* Node circle */}
                        <div
                            className="rounded-full flex items-center justify-center text-[10px] font-black relative z-10"
                            style={{
                                width: NODE_R * 2,
                                height: NODE_R * 2,
                                backgroundColor: isCurrent
                                    ? '#F59E0B'
                                    : isPaid
                                        ? 'rgba(37,99,235,0.25)'
                                        : 'rgba(255,255,255,0.06)',
                                border: `1.5px solid ${isCurrent
                                    ? '#F59E0B'
                                    : isPaid
                                        ? 'rgba(37,99,235,0.5)'
                                        : 'rgba(255,255,255,0.10)'}`,
                                color: isCurrent ? '#0F172A' : isPaid ? '#93C5FD' : 'rgba(255,255,255,0.35)',
                            }}
                        >
                            {isPaid ? <CheckCircle2 size={13} /> : member.initials}
                        </div>

                        {/* Month label below node */}
                        <span
                            className="text-[8px] mt-1 font-semibold tracking-wide"
                            style={{
                                color: isCurrent
                                    ? '#F59E0B'
                                    : isPaid
                                        ? 'rgba(147,197,253,0.7)'
                                        : 'rgba(255,255,255,0.20)',
                            }}
                        >
                            {member.month}
                        </span>
                    </div>
                );
            })}

            {/* "Your turn" tooltip on current node */}
            <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, duration: 0.5 }}
                className="absolute bg-brand-accent text-[#0F172A] text-[9px] font-black px-2 py-1 rounded-full whitespace-nowrap shadow-lg shadow-brand-accent/30"
                style={{
                    left: positions[2].x + NODE_R + 6,
                    top: positions[2].y - 12,
                }}
            >
                ← Payout this month
            </motion.div>
        </div>
    );
};

// ─── Hero ──────────────────────────────────────────────────────────────────────
export const Hero = () => {
    return (
        <section className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-[#060F20]">

            {/* Subtle dot grid */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 0.5px, transparent 0.5px)',
                    backgroundSize: '30px 30px',
                }}
            />

            {/* Ambient glow — anchored to hero visual area */}
            <div className="absolute top-1/2 right-[10%] -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-brand-accent/[0.04] blur-[120px] pointer-events-none" />
            <div className="absolute top-1/2 right-[10%] -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-brand-primary/[0.07] blur-[80px] pointer-events-none" />

            <Container className="relative z-10 w-full pt-20 pb-24 lg:pt-28 lg:pb-32">
                <div className="grid lg:grid-cols-[1fr_auto] gap-12 lg:gap-20 items-center">

                    {/* ─── LEFT — Typographic lead ─── */}
                    <motion.div
                        initial={{ opacity: 0, y: 28 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: [0.21, 0.45, 0.27, 0.9] }}
                        className="max-w-[600px]"
                    >
                        {/* Eyebrow */}
                        <motion.div
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.08 }}
                            className="flex items-center gap-2.5 mb-7"
                        >
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-accent opacity-75" />
                                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-accent" />
                            </span>
                            <span className="text-[11px] font-bold tracking-[0.18em] uppercase text-white/40">
                                Rotating savings · Verified groups
                            </span>
                        </motion.div>

                        {/* Headline — tradition (serif italic) meets technology (sans bold) */}
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.14, duration: 0.55 }}
                            className="leading-[0.92] mb-7"
                            style={{ fontSize: 'clamp(3.8rem, 8vw, 6.5rem)' }}
                        >
                            {/* "Ajo," — italic serif: represents the ancient tradition */}
                            <span
                                style={{
                                    fontFamily: 'var(--font-serif)',
                                    fontStyle: 'italic',
                                    fontWeight: 400,
                                    color: '#F59E0B',
                                    letterSpacing: '-0.02em',
                                    display: 'block',
                                }}
                            >
                                Ajo,
                            </span>
                            {/* "automated." — bold geometric sans: represents the technology */}
                            <span
                                style={{
                                    fontFamily: 'var(--font-display)',
                                    fontWeight: 800,
                                    color: '#FFFFFF',
                                    letterSpacing: '-0.04em',
                                    display: 'block',
                                }}
                            >
                                automated.
                            </span>
                        </motion.h1>

                        {/* Supporting line */}
                        <motion.p
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.22 }}
                            className="text-white/50 text-[16px] sm:text-[17px] leading-[1.65] mb-10 max-w-[440px]"
                        >
                            Contribute on schedule, track every naira, receive your payout on time —
                            {' '}<span className="text-white/80">no spreadsheets, no chasing.</span>
                        </motion.p>

                        {/* CTAs */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex flex-col sm:flex-row gap-3 mb-12"
                        >
                            <Link href="/signup" className="w-full sm:w-auto">
                                <button
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-[15px] font-bold px-8 py-4 rounded-2xl group transition-all"
                                    style={{
                                        backgroundColor: '#F59E0B',
                                        color: '#0F172A',
                                        boxShadow: '0 12px 32px rgba(245,158,11,0.25)',
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#FBBF24')}
                                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#F59E0B')}
                                >
                                    Join a Group — Free
                                    <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                                </button>
                            </Link>
                            <a href="#how-it-works" className="w-full sm:w-auto">
                                <button className="w-full inline-flex items-center justify-center text-[15px] font-semibold px-8 py-4 rounded-2xl text-white/60 hover:text-white border border-white/[0.08] hover:border-white/[0.16] bg-transparent transition-all">
                                    How It Works
                                </button>
                            </a>
                        </motion.div>

                        {/* Stats strip — real proof */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.42 }}
                            className="flex flex-wrap items-center gap-6 sm:gap-8"
                        >
                            {[
                                { value: '₦0', label: 'Missed payouts' },
                                { value: '100%', label: 'Verified groups' },
                                { value: 'Live', label: 'Real-time tracking' },
                            ].map((stat, i) => (
                                <div key={i} className={`${i > 0 ? 'pl-6 sm:pl-8 border-l border-white/[0.08]' : ''}`}>
                                    <p className="text-white font-black text-[1.2rem] leading-none tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                                        {stat.value}
                                    </p>
                                    <p className="text-white/35 text-[11px] mt-1 font-medium">{stat.label}</p>
                                </div>
                            ))}
                        </motion.div>
                    </motion.div>

                    {/* ─── RIGHT — Ajo rotation circle ─── */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.7, delay: 0.25, ease: [0.21, 0.45, 0.27, 0.9] }}
                        className="hidden lg:flex flex-col items-center gap-4"
                    >
                        {/* Label above */}
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03]">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse" />
                            <span className="text-[11px] text-white/40 font-semibold tracking-wide">Active rotation · Lagos Techies</span>
                        </div>

                        <AjoCircle />

                        {/* Label below */}
                        <p className="text-[11px] text-white/25 font-medium tracking-wide">
                            6 members · ₦100,000 / month
                        </p>
                    </motion.div>

                </div>
            </Container>

        </section>
    );
};
