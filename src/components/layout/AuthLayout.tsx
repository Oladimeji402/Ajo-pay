import { ReactNode } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Shield, Users, TrendingUp, Sparkles } from 'lucide-react';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout = ({ children, title, subtitle }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen flex">

      {/* ─── Left Panel: Brand & Trust (Desktop Only) ─── */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[540px] relative overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-navy via-[#1e3a7d] to-brand-primary"></div>
        
        {/* Geometric Patterns */}
        <div className="absolute inset-0 opacity-[0.06]">
          <div className="absolute top-20 -left-16 w-72 h-72 rounded-full border-[40px] border-white"></div>
          <div className="absolute bottom-32 right-0 w-56 h-56 rounded-full border-[30px] border-white -mr-20"></div>
          <div className="absolute top-1/2 left-1/3 w-24 h-24 rounded-full border-[10px] border-white"></div>
          <div className="absolute bottom-16 left-16 w-16 h-16 rounded-full border-[6px] border-white"></div>
        </div>

        {/* Dot Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}></div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-10 w-full">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-brand-emerald to-emerald-400 rounded-xl flex items-center justify-center shadow-lg shadow-brand-emerald/30">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="text-xl font-bold text-white tracking-tight">Ajopay</span>
          </Link>

          {/* Main Message */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full mb-6">
                <Sparkles size={12} className="text-emerald-300" />
                <span className="text-[11px] font-bold text-white/80">Trusted by 10,000+ savers</span>
              </div>
              <h1 className="text-[2.25rem] font-bold text-white leading-[1.15] mb-4">
                Save together,<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-emerald-400">grow together.</span>
              </h1>
              <p className="text-[14px] text-white/50 leading-relaxed max-w-sm">
                Ajopay digitises the trusted Ajo tradition — making your community savings safe, transparent, and always on time.
              </p>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-8 space-y-3"
            >
              {[
                { icon: <Shield size={16} />, text: 'Bank-grade encryption on every transaction' },
                { icon: <Users size={16} />, text: 'Join or create savings circles with anyone' },
                { icon: <TrendingUp size={16} />, text: 'Track contributions and payouts in real time' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/8 rounded-lg flex items-center justify-center text-emerald-300 flex-shrink-0">
                    {item.icon}
                  </div>
                  <span className="text-[13px] text-white/60">{item.text}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-4 text-[11px] text-white/30">
            <span>© 2024 Ajopay</span>
            <span className="w-0.5 h-0.5 bg-white/20 rounded-full"></span>
            <a href="#" className="hover:text-white/50 transition-colors">Privacy</a>
            <span className="w-0.5 h-0.5 bg-white/20 rounded-full"></span>
            <a href="#" className="hover:text-white/50 transition-colors">Terms</a>
          </div>
        </div>
      </div>

      {/* ─── Right Panel: Form ─── */}
      <div className="flex-1 flex flex-col min-h-screen bg-[#F8FAFC]">
        {/* Mobile Logo */}
        <div className="lg:hidden flex items-center justify-center pt-8 pb-4">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-brand-emerald to-emerald-400 rounded-xl flex items-center justify-center shadow-lg shadow-brand-emerald/20">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="text-xl font-bold text-brand-navy tracking-tight">Ajopay</span>
          </Link>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex flex-col justify-center px-4 sm:px-8 lg:px-16 xl:px-20 py-8">
          <div className="w-full max-w-[420px] mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* Title */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-brand-navy mb-2">{title}</h2>
                <p className="text-[13px] text-brand-gray leading-relaxed">{subtitle}</p>
              </div>
              
              {/* Form Content */}
              {children}
            </motion.div>
          </div>
        </div>

        {/* Mobile Footer */}
        <div className="lg:hidden text-center pb-6">
          <p className="text-[11px] text-slate-400">© 2026 Ajopay </p>
        </div>
      </div>
    </div>
  );
};
