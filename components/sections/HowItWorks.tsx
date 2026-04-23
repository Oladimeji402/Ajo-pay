'use client';

import { Container } from '../ui/Container';
import { motion } from 'motion/react';
import { UserPlus, Search, CreditCard, Wallet } from 'lucide-react';

const steps = [
    {
        number: '01',
        title: 'Create your account',
        description: 'Sign up in under 2 minutes. Quick KYC keeps your account secure.',
        icon: UserPlus,
    },
    {
        number: '02',
        title: 'Create your savings plan',
        description: 'Create target plans or general plans across daily, weekly, or monthly frequency.',
        icon: Search,
    },
    {
        number: '03',
        title: 'Automate contributions',
        description: 'Link your bank account, set a schedule — we handle the rest.',
        icon: CreditCard,
    },
    {
        number: '04',
        title: 'Track and withdraw on schedule',
        description: 'Monitor contributions in passbook and process payouts with clear bank account records.',
        icon: Wallet,
    },
];

export const HowItWorks = () => {
    return (
        <section
            id="how-it-works"
            className="py-24 lg:py-32 relative overflow-hidden"
            style={{ backgroundColor: '#FAFAF7' }}
        >
            {/* Faint amber glow — top center */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-brand-accent/[0.04] blur-[80px] pointer-events-none" />

            <Container className="relative z-10">

                {/* Section label */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-14 lg:mb-20"
                >
                    <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-brand-accent mb-4">
                        How It Works
                    </p>
                    <h2
                        className="text-brand-navy leading-[1.04] max-w-md"
                        style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)' }}
                    >
                        <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400 }}>Four steps </span>
                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '-0.03em' }}>to your first savings win.</span>
                    </h2>
                </motion.div>

                {/* Steps — horizontal on desktop, vertical on mobile */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4 relative">

                    {/* Connecting line — desktop only */}
                    <div className="hidden lg:block absolute top-[28px] left-[calc(12.5%+8px)] right-[calc(12.5%+8px)] h-px bg-gradient-to-r from-transparent via-brand-accent/20 to-transparent pointer-events-none" />

                    {steps.map((step, i) => {
                        const Icon = step.icon;
                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-40px' }}
                                transition={{ delay: i * 0.1, duration: 0.5 }}
                                className="relative group"
                            >
                                {/* Step number — the dominant visual element */}
                                <div className="relative flex items-center gap-4 mb-6">
                                    <div
                                        className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-[13px] tracking-widest flex-shrink-0 transition-all duration-300 group-hover:scale-105"
                                        style={{
                                            fontFamily: 'var(--font-display)',
                                            backgroundColor: i === 0 ? '#F59E0B' : 'rgba(15,23,42,0.06)',
                                            color: i === 0 ? '#0F172A' : 'rgba(15,23,42,0.35)',
                                            border: i === 0 ? 'none' : '1px solid rgba(15,23,42,0.08)',
                                        }}
                                    >
                                        {step.number}
                                    </div>

                                    {/* Icon */}
                                    <div className="w-9 h-9 rounded-xl bg-brand-navy/[0.06] flex items-center justify-center text-brand-navy/40 group-hover:text-brand-navy/70 transition-colors">
                                        <Icon size={17} />
                                    </div>
                                </div>

                                <h3
                                    className="font-bold text-brand-navy text-[16px] mb-2 leading-tight"
                                    style={{ fontFamily: 'var(--font-display)' }}
                                >
                                    {step.title}
                                </h3>
                                <p className="text-brand-gray text-[13.5px] leading-relaxed">
                                    {step.description}
                                </p>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Bottom footnote */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                    className="mt-14 pt-8 border-t border-brand-navy/[0.06] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                    <p className="text-[13px] text-brand-gray">
                        No hidden fees. No manual tracking. Clear savings history.
                    </p>
                    <a
                        href="/signup"
                        className="inline-flex items-center gap-1.5 text-[13px] font-bold text-brand-navy hover:text-brand-accent transition-colors"
                    >
                        Start saving
                        <span className="text-brand-accent">→</span>
                    </a>
                </motion.div>

            </Container>
        </section>
    );
};
