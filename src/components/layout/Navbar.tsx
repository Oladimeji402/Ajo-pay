import { useState, useEffect } from 'react';
import { Container } from '../ui/Container';
import { Button } from '../ui/Button';
import { Menu, X, ChevronRight, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'How it Works', href: '#how-it-works' },
    { name: 'Features', href: '#features' },
    { name: 'Security', href: '#security' },
    { name: 'Testimonials', href: '#testimonials' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? 'bg-white/80 backdrop-blur-2xl border-b border-slate-100/80 py-3 shadow-sm shadow-slate-900/5'
          : 'bg-transparent py-5'
      }`}
    >
      <Container className="flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 bg-gradient-to-br from-brand-emerald to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-brand-emerald/25 group-hover:shadow-brand-emerald/40 transition-shadow">
            <span className="text-white font-bold text-lg leading-none">A</span>
          </div>
          <span className={`text-xl font-bold tracking-tight transition-colors ${isScrolled ? 'text-brand-navy' : 'text-brand-navy'}`}>
            Ajopay
          </span>
        </Link>

        {/* Center Nav */}
        <div className="hidden md:flex items-center">
          <div className={`flex items-center gap-1 px-2 py-1.5 rounded-full transition-all ${isScrolled ? 'bg-slate-50' : 'bg-white/60 backdrop-blur-sm'}`}>
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-[13px] font-semibold text-brand-navy/70 hover:text-brand-navy hover:bg-white px-4 py-2 rounded-full transition-all"
              >
                {link.name}
              </a>
            ))}
          </div>
        </div>

        {/* Right — Auth + Mobile Toggle */}
        <div className="flex items-center gap-3">
          <Link to="/login" className="hidden md:block">
            <span className="text-[13px] font-bold text-brand-navy hover:text-brand-primary transition-colors px-4 py-2">
              Log in
            </span>
          </Link>
          <Link to="/signup" className="hidden md:block">
            <Button size="sm" className="rounded-full px-5 shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/30 transition-shadow">
              Get Started
              <ArrowRight size={14} className="ml-1.5" />
            </Button>
          </Link>

          <button
            className="md:hidden p-2 text-brand-navy relative z-[60]"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

      </Container>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-brand-navy/30 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="fixed top-0 right-0 bottom-0 w-[80%] max-w-sm bg-white z-50 md:hidden shadow-2xl flex flex-col"
            >
              {/* Mobile Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                <Link to="/" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                  <div className="w-8 h-8 bg-gradient-to-br from-brand-emerald to-emerald-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-base">A</span>
                  </div>
                  <span className="text-lg font-bold text-brand-navy">Ajopay</span>
                </Link>
              </div>

              {/* Links */}
              <div className="flex-1 flex flex-col gap-1 px-4 py-6">
                {navLinks.map((link, i) => (
                  <motion.a
                    initial={{ x: 30, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.05 + i * 0.05 }}
                    key={link.name}
                    href={link.href}
                    className="flex items-center justify-between px-4 py-3.5 rounded-xl text-[15px] font-bold text-brand-navy hover:bg-slate-50 transition-colors group"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.name}
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-brand-emerald group-hover:translate-x-0.5 transition-all" />
                  </motion.a>
                ))}
              </div>

              {/* Bottom Actions */}
              <div className="px-6 pb-8 space-y-3">
                <Link to="/login" className="w-full block" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full py-3.5 rounded-xl">Log in</Button>
                </Link>
                <Link to="/signup" className="w-full block" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full py-3.5 rounded-xl">Get Started Free</Button>
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};
