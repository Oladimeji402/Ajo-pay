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
  Play,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';

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
    <section className="relative min-h-screen flex items-center overflow-hidden bg-[#F8FAFC]">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-brand-primary/[0.04] rounded-full blur-[100px]" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] bg-brand-emerald/[0.04] rounded-full blur-[100px]" />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle, #1B2F6B 0.5px, transparent 0.5px)',
          backgroundSize: '32px 32px'
        }} />
      </div>

      <Container className="relative z-10 pt-28 pb-12 lg:pt-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Left Copy */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Trust Badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-emerald/[0.08] border border-brand-emerald/15 mb-6"
            >
              <Sparkles size={13} className="text-brand-emerald" />
              <span className="text-[12px] font-bold text-brand-emerald">Trusted by 50,000+ Nigerians</span>
            </motion.div>

            <h1 className="text-[2.5rem] sm:text-5xl lg:text-[3.5rem] xl:text-6xl font-bold text-brand-navy leading-[1.08] mb-5 tracking-tight">
              Modern Savings<br />
              for{' '}
              <span className="relative">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-emerald">Modern Africans.</span>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ delay: 0.8, duration: 0.6, ease: 'easeOut' }}
                  className="absolute bottom-1 left-0 h-[3px] bg-gradient-to-r from-brand-primary/30 to-brand-emerald/30 rounded-full"
                />
              </span>
            </h1>

            <p className="text-[15px] sm:text-base text-brand-gray mb-8 leading-relaxed max-w-lg">
              Join secure Ajo groups, automate your contributions, and reach your financial goals faster with Africa's most trusted digital savings platform.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 mb-10">
              <Link to="/signup">
                <Button
                  size="lg"
                  className="text-[15px] px-7 py-4 rounded-2xl shadow-xl shadow-brand-primary/15 flex items-center gap-2 group"
                >
                  Start Saving Free
                  <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </Link>
              <button className="flex items-center gap-3 px-6 py-4 text-[15px] font-semibold text-brand-navy hover:text-brand-primary transition-colors group">
                <div className="w-10 h-10 bg-white rounded-full shadow-lg shadow-slate-900/10 flex items-center justify-center group-hover:shadow-brand-primary/20 transition-shadow">
                  <Play size={14} className="text-brand-primary ml-0.5" fill="currentColor" />
                </div>
                Watch Demo
              </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-6">
              {[
                { value: '₦2.5B+', label: 'Total Saved' },
                { value: '99.9%', label: 'Success Rate' },
                { value: '24/7', label: 'Active Support' },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="relative"
                >
                  {i > 0 && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-px h-8 bg-slate-200" />}
                  <div className={i > 0 ? 'pl-6' : ''}>
                    <p className="text-xl sm:text-2xl font-bold text-brand-navy">{stat.value}</p>
                    <p className="text-[11px] font-medium text-brand-gray mt-0.5">{stat.label}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Phone */}
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative flex justify-center"
          >
            {/* Floating Badge — Payout */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-4 -right-2 lg:right-4 bg-white p-3 rounded-2xl shadow-xl shadow-slate-900/10 border border-slate-100 flex items-center gap-3 z-20"
            >
              <div className="w-9 h-9 bg-brand-emerald/10 text-brand-emerald rounded-xl flex items-center justify-center">
                <TrendingUp size={18} />
              </div>
              <div>
                <p className="text-[9px] text-brand-gray font-bold uppercase tracking-wider">Total Payout</p>
                <p className="text-sm font-bold text-brand-navy">₦1,200,000</p>
              </div>
            </motion.div>

            {/* Floating Badge — Members */}
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="absolute bottom-8 -left-2 lg:left-4 bg-white p-3 rounded-2xl shadow-xl shadow-slate-900/10 border border-slate-100 flex items-center gap-3 z-20"
            >
              <div className="w-9 h-9 bg-brand-soft-blue text-brand-primary rounded-xl flex items-center justify-center">
                <Users size={18} />
              </div>
              <div>
                <p className="text-[9px] text-brand-gray font-bold uppercase tracking-wider">Active Members</p>
                <p className="text-sm font-bold text-brand-navy">12,402</p>
              </div>
            </motion.div>

            <PhoneMockup />

            {/* Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-radial from-brand-primary/[0.06] to-transparent rounded-full -z-10" />
          </motion.div>

        </div>
      </Container>
    </section>
  );
};
