'use client';

import { useState, useEffect } from 'react';
import { Container } from '../ui/Container';
import { Button } from '../ui/Button';
import { ChevronRight, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { BrandLogo } from '../ui/BrandLogo';

// Hamburger that morphs into an X instead of an instant icon swap —
// all three bars stay on the same px-based coordinate space so the
// top/rotate values tween cleanly.
const HamburgerIcon = ({ open }: { open: boolean }) => (
    <div className="relative w-5 h-5">
        <motion.span
            className="absolute left-0 w-5 h-[2px] rounded-full bg-current"
            animate={open ? { top: 9, rotate: 45 } : { top: 3, rotate: 0 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
        />
        <motion.span
            className="absolute left-0 top-[9px] w-5 h-[2px] rounded-full bg-current"
            animate={open ? { opacity: 0, scale: 0.5 } : { opacity: 1, scale: 1 }}
            transition={{ duration: 0.15 }}
        />
        <motion.span
            className="absolute left-0 w-5 h-[2px] rounded-full bg-current"
            animate={open ? { top: 9, rotate: -45 } : { top: 15, rotate: 0 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
        />
    </div>
);

export const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Lock the background page while the mobile drawer is open. Plain
    // `overflow: hidden` on <body> doesn't fully stop touch-scroll on iOS
    // Safari — pinning the body in place is the reliable cross-browser fix.
    useEffect(() => {
        if (!isMobileMenuOpen) return;

        const scrollY = window.scrollY;
        const { style } = document.body;
        const previous = {
            position: style.position,
            top: style.top,
            left: style.left,
            right: style.right,
            width: style.width,
        };

        style.position = 'fixed';
        style.top = `-${scrollY}px`;
        style.left = '0';
        style.right = '0';
        style.width = '100%';

        return () => {
            style.position = previous.position;
            style.top = previous.top;
            style.left = previous.left;
            style.right = previous.right;
            style.width = previous.width;
            window.scrollTo(0, scrollY);
        };
    }, [isMobileMenuOpen]);

    const navLinks = [
        { name: 'How it Works', href: '#how-it-works' },
        { name: 'Features', href: '#features' },
        { name: 'Testimonials', href: '#testimonials' },
    ];

    return (
        <nav
            className={`fixed top-9 left-0 right-0 transition-all duration-500 ${isScrolled
                ? 'bg-white/80 backdrop-blur-2xl border-b border-slate-100/80 py-3 shadow-sm shadow-slate-900/5'
                : 'bg-transparent py-5'
                }`}
            style={{ zIndex: 1000 }}
        >
            <Container className="flex items-center justify-between">

                {/* Logo */}
                <BrandLogo size="md" dark={isScrolled} />

                {/* Center Nav */}
                <div className="hidden md:flex items-center">
                    <div className={`flex items-center gap-1 px-2 py-1.5 rounded-full transition-all ${isScrolled ? 'bg-slate-50' : 'bg-white/[0.07] backdrop-blur-sm'}`}>
                        {navLinks.map((link) => (
                            <a
                                key={link.name}
                                href={link.href}
                                className={`text-[13px] font-semibold px-4 py-2 rounded-full transition-all ${isScrolled
                                    ? 'text-brand-navy/70 hover:text-brand-navy hover:bg-white'
                                    : 'text-white/70 hover:text-white hover:bg-white/[0.10]'
                                    }`}
                            >
                                {link.name}
                            </a>
                        ))}
                    </div>
                </div>

                {/* Right — Auth + Mobile Toggle */}
                <div className="flex items-center gap-3">
                    <Link href="/login" className="hidden md:block">
                        <span className={`text-[13px] font-bold transition-colors px-4 py-2 ${isScrolled ? 'text-brand-navy hover:text-brand-primary' : 'text-white/80 hover:text-white'
                            }`}>
                            Log in
                        </span>
                    </Link>
                    <Link href="/signup" className="hidden md:block">
                        <button
                            className="inline-flex items-center gap-1.5 text-[13px] font-bold px-5 py-2.5 rounded-full transition-all"
                            style={{
                                backgroundColor: '#F5A623',
                                color: '#6B3C00',
                                boxShadow: '0 4px 16px rgba(245,162,35,0.25)',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#FBBF24')}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#F5A623')}
                        >
                            Get Started
                            <ArrowRight size={13} />
                        </button>
                    </Link>

                    <button
                        className={`md:hidden p-2.5 relative transition-colors rounded-lg ${isMobileMenuOpen ? 'text-brand-navy bg-slate-100' : isScrolled ? 'text-brand-navy' : 'text-white'}`}
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label="Toggle menu"
                        aria-expanded={isMobileMenuOpen}
                        style={{ zIndex: 100000 }}
                    >
                        <HamburgerIcon open={isMobileMenuOpen} />
                    </button>
                </div>

            </Container>

            {/* Mobile Menu — small floating dropdown anchored under the toggle button,
                not a full-screen takeover. A light click-away catcher (not a heavy
                scrim) keeps the hero visible behind it. */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="md:hidden fixed inset-0 bg-black/10"
                            style={{ zIndex: 2147483640 }}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: -8, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.95 }}
                            transition={{ type: 'spring', damping: 26, stiffness: 360, mass: 0.7 }}
                            className="md:hidden fixed right-4 sm:right-6 top-24 w-[250px] rounded-2xl border border-slate-100 bg-white shadow-2xl shadow-slate-900/15 overflow-hidden"
                            style={{ zIndex: 2147483641, transformOrigin: 'top right' }}
                        >
                            {/* Links */}
                            <div className="flex flex-col p-2">
                                {navLinks.map((link, i) => (
                                    <motion.a
                                        initial={{ opacity: 0, x: 8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.04 + i * 0.03 }}
                                        key={link.name}
                                        href={link.href}
                                        className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[14px] font-bold text-brand-navy hover:bg-slate-50 transition-colors group"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        {link.name}
                                        <ChevronRight size={15} className="text-slate-300 group-hover:text-brand-emerald group-hover:translate-x-0.5 transition-all" />
                                    </motion.a>
                                ))}
                            </div>

                            {/* Actions */}
                            <div className="border-t border-slate-100 p-2.5 space-y-2">
                                <Link href="/login" className="w-full block" onClick={() => setIsMobileMenuOpen(false)}>
                                    <Button variant="outline" size="sm" className="w-full rounded-xl">Log in</Button>
                                </Link>
                                <Link href="/signup" className="w-full block" onClick={() => setIsMobileMenuOpen(false)}>
                                    <Button size="sm" className="w-full rounded-xl">Get Started Free</Button>
                                </Link>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </nav>
    );
};
