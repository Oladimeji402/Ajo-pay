'use client';

import { Container } from '../ui/Container';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const CTA = () => {
    return (
        <section
            className="py-20 lg:py-24 relative overflow-hidden"
            style={{ backgroundColor: '#0D1A6E' }}
        >
            {/* Soft top edge — separates from content above */}
            <div className="absolute inset-x-0 top-0 h-px bg-white/[0.08]" />

            {/* Texture — subtle light dots on navy */}
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.04]"
                style={{
                    backgroundImage: 'radial-gradient(rgba(255,255,255,1) 0.5px, transparent 0.5px)',
                    backgroundSize: '28px 28px',
                }}
            />

            {/* Ambient glow — soft brand lift, not a second color block */}
            <div
                className="absolute -top-24 right-0 w-72 h-72 rounded-full pointer-events-none"
                style={{ backgroundColor: 'rgba(26,53,212,0.35)', filter: 'blur(80px)' }}
            />
            <div
                className="absolute -bottom-20 -left-10 w-64 h-64 rounded-full pointer-events-none"
                style={{ backgroundColor: 'rgba(245,166,35,0.08)', filter: 'blur(70px)' }}
            />

            <Container className="relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.55 }}
                    className="flex flex-col lg:flex-row lg:items-end gap-10 lg:gap-14 max-w-3xl"
                >
                    {/* Left — headline */}
                    <div className="flex-1 min-w-0">
                        <h2
                            className="leading-[1.0] mb-3"
                            style={{
                                fontSize: 'clamp(2.4rem, 5vw, 3.8rem)',
                                color: '#FFFFFF',
                            }}
                        >
                            <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400 }}>Ready</span>
                            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '-0.03em' }}> to start</span>
                            <br />
                            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '-0.03em' }}>your plan?</span>
                        </h2>
                        <p
                            className="text-[17px] font-semibold mb-2.5"
                            style={{
                                fontFamily: 'var(--font-display)',
                                color: 'rgba(255,255,255,0.88)',
                                letterSpacing: '-0.01em',
                            }}
                        >
                            Create your account today
                        </p>
                        <p
                            className="text-[15px] leading-relaxed mb-8 max-w-sm"
                            style={{ color: 'rgba(255,255,255,0.50)' }}
                        >
                            Create your free account, set up target or general savings, and track payouts with full clarity.
                        </p>

                        {/* CTAs */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Link href="/signup">
                                <button
                                    className="inline-flex items-center justify-center gap-2 text-[15px] font-bold px-8 py-4 rounded-2xl group transition-all"
                                    style={{
                                        backgroundColor: '#F5A623',
                                        color: '#6B3C00',
                                        boxShadow: '0 8px 24px rgba(245,162,35,0.30)',
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#FBBF24')}
                                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#F5A623')}
                                >
                                    Join Free
                                    <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                                </button>
                            </Link>
                            <Link href="/login">
                                <button
                                    className="inline-flex items-center justify-center text-[15px] font-semibold px-8 py-4 rounded-2xl transition-all"
                                    style={{
                                        color: 'rgba(255,255,255,0.70)',
                                        border: '1.5px solid rgba(255,255,255,0.18)',
                                        backgroundColor: 'transparent',
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.color = '#FFFFFF';
                                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.color = 'rgba(255,255,255,0.70)';
                                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)';
                                    }}
                                >
                                    Sign In
                                </button>
                            </Link>
                        </div>
                    </div>

                    {/* Right — proof stats, sits close as support to the ask */}
                    <div className="flex flex-row lg:flex-col gap-6 lg:gap-5 shrink-0 lg:pb-1">
                        {[
                            { value: '₦0', label: 'Missed payouts, ever' },
                            { value: '2 Types', label: 'Target and general savings' },
                            { value: 'Free', label: 'No hidden fees, ever' },
                        ].map((stat, i) => (
                            <div
                                key={i}
                                className={`${i > 0 ? 'border-l lg:border-l-0 lg:border-t pl-6 lg:pl-0 lg:pt-5' : ''}`}
                                style={{ borderColor: 'rgba(255,255,255,0.10)' }}
                            >
                                <p
                                    className="text-[1.75rem] font-black leading-none tracking-tight"
                                    style={{
                                        fontFamily: 'var(--font-display)',
                                        color: '#FFFFFF',
                                    }}
                                >
                                    {stat.value}
                                </p>
                                <p
                                    className="text-[12px] mt-1.5 font-medium whitespace-nowrap"
                                    style={{ color: 'rgba(255,255,255,0.45)' }}
                                >
                                    {stat.label}
                                </p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </Container>
        </section>
    );
};
