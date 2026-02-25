import { useState, useEffect } from 'react';
import { Container } from '../ui/Container';
import { Button } from '../ui/Button';
import { Menu, X, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'How it Works', href: '#how-it-works' },
    { name: 'Features', href: '#features' },
    { name: 'Security', href: '#security' },
    { name: 'About', href: '#about' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
          ? 'bg-white/90 backdrop-blur-md border-b border-slate-100 py-3'
          : 'bg-transparent py-5'
        }`}
    >
      <Container className="grid grid-cols-3 items-center">

        {/* Left — Logo */}
        <Link to="/" className="flex items-center gap-2 justify-self-start">
          <img src="/logo.png" alt="Ajopay Logo" className="h-12 w-auto" />
        </Link>

        {/* Center — Nav links */}
        <div className="hidden md:flex items-center justify-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-sm font-bold text-brand-navy hover:text-brand-primary transition-colors"
            >
              {link.name}
            </a>
          ))}
        </div>

        {/* Right — Auth buttons + Mobile toggle */}
        <div className="flex items-center justify-end gap-4">
          {/* Desktop auth buttons */}
          <Link to="/login" className="hidden md:block">
            <Button variant="ghost" size="sm" className="text-brand-primary font-bold">
              Log in
            </Button>
          </Link>
          <Link to="/signup" className="hidden md:block">
            <Button size="sm">Get Started</Button>
          </Link>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-brand-primary relative z-50"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

      </Container>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-brand-navy/20 backdrop-blur-sm z-40 md:hidden"
            />

            {/* Slide-in menu */}
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-[80%] max-w-sm bg-white z-50 md:hidden shadow-2xl flex flex-col p-8 pt-24"
            >
              <div className="flex flex-col gap-6">
                {navLinks.map((link, i) => (
                  <motion.a
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                    key={link.name}
                    href={link.href}
                    className="text-xl font-bold text-brand-navy flex items-center justify-between group"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.name}
                    <ChevronRight
                      className="text-slate-300 group-hover:text-brand-emerald group-hover:translate-x-1 transition-all"
                      size={20}
                    />
                  </motion.a>
                ))}
              </div>

              <div className="mt-auto space-y-4">
                <Link
                  to="/login"
                  className="w-full block"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Button variant="outline" className="w-full py-4">
                    Log in
                  </Button>
                </Link>
                <Link
                  to="/signup"
                  className="w-full block"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Button className="w-full py-4">Get Started</Button>
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};
