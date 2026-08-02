'use client';

import { Container } from '../ui/Container';
import { motion } from 'motion/react';
import { CheckCircle2, ArrowDownLeft, Zap } from 'lucide-react';

// Ghost watermark number — ties each bento cell back to the numbered-step
// language used in How It Works, without repeating the same card shape.
const GhostNumber = ({ n }: { n: string }) => (
    <span
        className="absolute -top-2 right-4 text-[5.5rem] font-black leading-none select-none pointer-events-none"
        style={{ fontFamily: 'var(--font-display)', color: '#F59E0B', opacity: 0.1 }}
    >
        {n}
    </span>
);

// ─── Cell 1: Automation (wide) ────────────────────────────────────────────────
const AutomationCard = () => (
    <div className="relative h-full rounded-2xl border border-white/[0.07] bg-white/[0.05] p-6 lg:p-8 overflow-hidden">
        <GhostNumber n="01" />
        <div className="relative grid sm:grid-cols-2 gap-6 items-center h-full">
            <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-accent mb-3">Automation</p>
                <h3
                    className="text-white text-[1.4rem] leading-tight mb-2"
                    style={{ fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '-0.02em' }}
                >
                    Never miss a contribution
                </h3>
                <p className="text-white/50 text-[14px] leading-relaxed">
                    Set your amount and schedule once. Automatic deductions happen on time — daily, weekly, or monthly.
                </p>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-4 space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/30 mb-1">Contribution Schedule</p>
                {[
                    { label: 'Daily deduction', amount: '₦5,000', on: true },
                    { label: 'Weekly deduction', amount: '₦25,000', on: false },
                    { label: 'Monthly target', amount: '₦100,000', on: true },
                ].map((row, i) => (
                    <div key={i} className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-[12px] font-semibold text-white">{row.label}</p>
                            <p className="text-[11px] text-white/40">{row.amount}</p>
                        </div>
                        <div className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${row.on ? 'bg-brand-accent' : 'bg-white/15'}`}>
                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${row.on ? 'left-[22px]' : 'left-0.5'}`} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

// ─── Cell 2: Digital passbook (tall) ──────────────────────────────────────────
const PassbookCard = () => {
    const cycles = [
        { period: 'Cycle 1', status: 'paid' as const },
        { period: 'Cycle 2', status: 'paid' as const },
        { period: 'Cycle 3', status: 'paid' as const },
        { period: 'Cycle 4', status: 'current' as const },
        { period: 'Cycle 5', status: 'pending' as const },
        { period: 'Cycle 6', status: 'pending' as const },
    ];

    return (
        <div className="relative h-full rounded-2xl border border-white/[0.07] bg-white/[0.05] p-6 lg:p-8 overflow-hidden flex flex-col">
            <GhostNumber n="02" />
            <div className="relative mb-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-accent mb-3">Transparency</p>
                <h3
                    className="text-white text-[1.35rem] leading-tight mb-2"
                    style={{ fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '-0.02em' }}
                >
                    Digital passbook clarity
                </h3>
                <p className="text-white/50 text-[14px] leading-relaxed">
                    See every paid vs. pending cycle in real time — clear records, no guesswork.
                </p>
            </div>

            <div className="relative mt-auto rounded-xl border border-white/[0.08] bg-white/[0.04] p-4">
                <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/30">Passbook · Month 4</p>
                    <p className="text-[11px] font-bold text-brand-accent">₦150,000 saved</p>
                </div>
                {/* Vertical timeline */}
                <div className="space-y-0">
                    {cycles.map((c, i) => (
                        <div key={i} className="flex items-start gap-3">
                            <div className="flex flex-col items-center">
                                <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                                    c.status === 'paid' ? 'bg-brand-primary/25' :
                                    c.status === 'current' ? 'bg-brand-accent/25' : 'bg-white/[0.06]'
                                }`}>
                                    {c.status === 'paid' && <CheckCircle2 size={9} className="text-brand-electric" />}
                                    {c.status === 'current' && <div className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse" />}
                                    {c.status === 'pending' && <div className="w-1 h-1 rounded-full bg-white/20" />}
                                </div>
                                {i < cycles.length - 1 && (
                                    <div className={`w-px flex-1 min-h-[14px] ${c.status === 'paid' ? 'bg-brand-electric/30' : 'bg-white/10'}`} />
                                )}
                            </div>
                            <div className="flex items-center justify-between flex-1 pb-3.5 -mt-0.5">
                                <span className="text-[12px] text-white/50">{c.period}</span>
                                <span className={`text-[11px] font-bold ${
                                    c.status === 'paid' ? 'text-brand-electric' :
                                    c.status === 'current' ? 'text-brand-accent' : 'text-white/20'
                                }`}>
                                    {c.status === 'paid' ? 'Paid' : c.status === 'current' ? 'Due' : 'Pending'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// ─── Cell 3: Instant payouts (wide) ───────────────────────────────────────────
const PayoutCard = () => (
    <div className="relative h-full rounded-2xl border border-white/[0.07] bg-white/[0.05] p-6 lg:p-8 overflow-hidden">
        <GhostNumber n="03" />
        <div className="relative grid sm:grid-cols-2 gap-6 items-center h-full">
            <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-accent mb-3">Instant Payouts</p>
                <h3
                    className="text-white text-[1.4rem] leading-tight mb-2"
                    style={{ fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '-0.02em' }}
                >
                    Money lands in seconds
                </h3>
                <p className="text-white/50 text-[14px] leading-relaxed">
                    When your payout is due, funds transfer instantly to your verified bank account.
                </p>
            </div>

            <div className="space-y-3">
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.15, duration: 0.4 }}
                    className="rounded-xl border border-brand-accent/25 bg-brand-accent/10 p-3.5 flex items-center gap-3"
                >
                    <div className="w-9 h-9 rounded-lg bg-brand-accent/20 flex items-center justify-center flex-shrink-0">
                        <Zap size={16} className="text-brand-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-bold text-white leading-tight">Payout Sent</p>
                        <p className="text-[10px] text-brand-accent/90 mt-0.5">+₦600,000 to Access Bank</p>
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-brand-accent bg-brand-accent/15 px-1.5 py-0.5 rounded flex-shrink-0">
                        Success
                    </span>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.28, duration: 0.4 }}
                    className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-3 flex items-center gap-3"
                >
                    <div className="w-8 h-8 rounded-lg bg-brand-primary/25 flex items-center justify-center flex-shrink-0">
                        <ArrowDownLeft size={13} className="text-brand-electric" />
                    </div>
                    <div className="flex-1">
                        <p className="text-[11px] font-bold text-white">Target Savings Plan</p>
                        <p className="text-[10px] text-white/40">2 min ago</p>
                    </div>
                    <p className="text-[12px] font-bold text-brand-electric">+₦600,000</p>
                </motion.div>
            </div>
        </div>
    </div>
);

// ─── Features section — asymmetric bento ──────────────────────────────────────
export const Features = () => {
    return (
        <section id="features" className="bg-[#1A35D4] relative overflow-hidden py-24 lg:py-32">
            <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-brand-primary/[0.04] rounded-full blur-[120px] -ml-40 -mt-40 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-brand-accent/[0.03] rounded-full blur-[120px] -mr-40 -mb-40 pointer-events-none" />

            <Container className="relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-12 lg:mb-16 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
                >
                    <div>
                        <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-brand-accent mb-4">
                            Features
                        </p>
                        <h2
                            className="text-white leading-[1.06]"
                            style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)' }}
                        >
                            <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400 }}>Built </span>
                            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '-0.03em' }}>around how<br />you actually save.</span>
                        </h2>
                    </div>
                    <p className="text-white/35 text-[14px] leading-relaxed max-w-xs sm:text-right">
                        Every feature exists because a Nigerian saver asked for it.
                    </p>
                </motion.div>

                <div className="bento-features">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-40px' }}
                        transition={{ duration: 0.5 }}
                        className="[grid-area:automation]"
                    >
                        <AutomationCard />
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-40px' }}
                        transition={{ delay: 0.1, duration: 0.5 }}
                        className="[grid-area:passbook]"
                    >
                        <PassbookCard />
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-40px' }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="[grid-area:payout]"
                    >
                        <PayoutCard />
                    </motion.div>
                </div>
            </Container>
        </section>
    );
};
