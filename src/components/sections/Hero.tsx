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
} from 'lucide-react';
import { Link } from 'react-router-dom';

// ─── Inline Phone Mockup ─────────────────────────────────────────────────────
const PhoneMockup = () => (
  <div className="relative w-full flex justify-center items-center select-none">
    {/* Ambient glow */}
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="w-48 h-56 rounded-full bg-brand-primary/20 blur-3xl" />
    </div>

    {/* Phone shell */}
    <div
      className="relative z-10 w-[210px] rounded-[2.5rem] bg-[#0F172A] overflow-hidden"
      style={{
        border: '6px solid #1e2d4a',
        boxShadow: '0 20px 54px rgba(27,47,107,0.35), 0 4px 14px rgba(0,0,0,0.5)',
      }}
    >
      {/* Dynamic island */}
      <div className="flex justify-center pt-2 pb-0.5">
        <div className="w-16 h-4 rounded-full bg-black flex items-center justify-center gap-1">
          <div className="w-1 h-1 rounded-full bg-[#1a1a1a]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#111]" />
        </div>
      </div>

      {/* Screen */}
      <div className="bg-[#F8FAFC] flex flex-col rounded-b-[2rem] overflow-hidden">
        {/* Status bar */}
        <div className="flex items-center justify-between px-3 py-1 bg-[#F8FAFC]">
          <span className="text-[8px] font-bold text-[#0F172A]">9:41</span>
          <div className="flex items-center gap-1">
            <div className="flex gap-[2px] items-end h-2">
              <div className="w-[2px] h-[3px] rounded-sm bg-[#0F172A]" />
              <div className="w-[2px] h-[5px] rounded-sm bg-[#0F172A]" />
              <div className="w-[2px] h-[7px] rounded-sm bg-[#0F172A]" />
              <div className="w-[2px] h-[8px] rounded-sm bg-[#0F172A]" />
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
            <div className="w-6 h-6 rounded-full bg-[#E8EEF8] flex items-center justify-center text-[8px] font-bold text-[#1B2F6B]">
              FO
            </div>
            <div>
              <p className="text-[7px] text-[#64748b] leading-none">Welcome back,</p>
              <p className="text-[9px] font-bold text-[#0F172A] leading-tight">Franklyn</p>
            </div>
          </div>
          <button className="w-5 h-5 bg-white rounded-full shadow-sm border border-[#E2E8F0] flex items-center justify-center relative">
            <Bell size={9} className="text-[#0F172A]" />
            <span className="absolute top-0 right-0 w-1 h-1 bg-red-500 rounded-full border border-white" />
          </button>
        </div>

        {/* Balance card */}
        <div className="mx-3 mb-1.5 rounded-[0.8rem] bg-[#1B2F6B] p-2 text-white relative overflow-hidden">
          <div className="absolute -top-3 -right-3 w-10 h-10 bg-white/10 rounded-full blur-xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-1 mb-0.5">
              <span className="text-[7px] opacity-80 font-medium">Total contributions</span>
              <Eye size={7} className="opacity-70" />
            </div>
            <p className="text-base font-bold tracking-tight mb-1.5">₦1,250,000</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 bg-white/10 rounded px-1.5 py-0.5">
                <TrendingUp size={7} className="text-[#0F766E]" />
                <span className="text-[7px] font-bold text-[#4ade80]">+12.4%</span>
              </div>
              <span className="text-[7px] opacity-60">this month</span>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="mx-3 mb-2">
          <div className="rounded-lg bg-[#0F172A] px-2.5 py-2 flex items-center justify-between mb-1.5">
            <div>
              <p className="text-[8px] font-bold text-white">Savings Goals</p>
              <p className="text-[7px] text-white/60">Track your financial targets</p>
            </div>
            <div className="w-5 h-5 border border-white/30 rounded-md flex items-center justify-center">
              <ArrowUpRight size={10} className="text-white" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <div className="rounded-lg bg-[#E8EEF8] px-2 py-1.5">
              <div className="w-4 h-4 bg-[#1B2F6B]/10 rounded-md flex items-center justify-center mb-1">
                <Users size={9} className="text-[#1B2F6B]" />
              </div>
              <p className="text-[8px] font-bold text-[#0F172A]">Join Group</p>
              <p className="text-[7px] text-[#64748b]">Paste invite link</p>
            </div>
            <div className="rounded-lg bg-[#f0fdf4] px-2 py-1.5">
              <div className="w-4 h-4 bg-[#0F766E]/10 rounded-md flex items-center justify-center mb-1">
                <LayoutGrid size={9} className="text-[#0F766E]" />
              </div>
              <p className="text-[8px] font-bold text-[#0F172A]">My Groups</p>
              <p className="text-[7px] text-[#64748b]">Active Ajo groups</p>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="mx-3 bg-white rounded-lg p-2 shadow-sm border border-[#E2E8F0]">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[8px] font-bold text-[#0F172A]">Recent Transactions</p>
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
                  {tx.credit
                    ? <ArrowDownLeft size={8} className="text-[#0F766E]" />
                    : <ArrowUpRight size={8} className="text-[#1B2F6B]" />}
                </div>
                <div>
                  <p className="text-[7px] font-bold text-[#0F172A] leading-none">{tx.label}</p>
                  <p className="text-[6px] text-[#94a3b8]">{tx.sub}</p>
                </div>
              </div>
              <p className={`text-[7px] font-bold ${tx.credit ? 'text-[#0F766E]' : 'text-[#0F172A]'}`}>
                {tx.amount}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom Nav */}
        <div className="mx-3 mt-1.5 mb-1.5 bg-white rounded-lg shadow-sm border border-[#E2E8F0] flex items-center justify-around py-1 px-1">
          {[
            { icon: <LayoutGrid size={8} />, label: 'Home', active: true },
            { icon: <Users size={8} />, label: 'Groups', active: false },
            { icon: <TrendingUp size={8} />, label: 'Activity', active: false },
            { icon: <ShieldCheck size={8} />, label: 'Settings', active: false },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-0.5">
              <div className={`w-4 h-4 rounded-md flex items-center justify-center ${item.active ? 'bg-[#1B2F6B]/10 text-[#1B2F6B]' : 'text-[#94a3b8]'}`}>
                {item.icon}
              </div>
              <span className={`text-[5px] ${item.active ? 'font-bold text-[#1B2F6B]' : 'text-[#94a3b8]'}`}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Home indicator bar */}
    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-16 h-0.5 rounded-full bg-white/30 z-20" />
  </div>
);

// ─── Hero Section ─────────────────────────────────────────────────────────────
export const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-brand-light">
      {/* Background decorative blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-primary/5 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-emerald/5 rounded-full blur-3xl opacity-50" />
      </div>

      <Container className="relative z-10 pt-24 pb-8">
        <div className="grid lg:grid-cols-2 gap-10 items-center">

          {/* ── Left: Copy ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-xs font-bold uppercase tracking-wider mb-4">
              <ShieldCheck size={13} />
              Trusted by 50,000+ Nigerians
            </div>

            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-brand-navy leading-[1.1] mb-4 tracking-tight">
              Modern Savings for{' '}
              <span className="text-brand-primary">Modern Africans.</span>
            </h1>

            <p className="text-base text-brand-gray mb-7 leading-relaxed max-w-lg">
              Join secure Ajo groups, automate your contributions, and reach
              your financial goals faster with Africa's most trusted digital
              savings platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/signup">
                <Button
                  size="lg"
                  className="text-base px-7 py-5 rounded-2xl shadow-xl shadow-brand-primary/10 flex items-center gap-2"
                >
                  Start Saving Now
                  <ArrowRight size={18} />
                </Button>
              </Link>
              <Link to="/how-it-works">
                <Button
                  variant="secondary"
                  size="lg"
                  className="font-bold text-base px-7 py-5 rounded-2xl"
                >
                  See How it Works
                </Button>
              </Link>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-6 border-t border-brand-border pt-6">
              <div>
                <p className="text-xl font-bold text-brand-navy">₦2.5B+</p>
                <p className="text-xs text-brand-gray">Total Saved</p>
              </div>
              <div>
                <p className="text-xl font-bold text-brand-navy">99.9%</p>
                <p className="text-xs text-brand-gray">Success Rate</p>
              </div>
              <div>
                <p className="text-xl font-bold text-brand-navy">24/7</p>
                <p className="text-xs text-brand-gray">Active Support</p>
              </div>
            </div>
          </motion.div>

          {/* ── Right: Phone Mockup ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.2 }}
            className="relative flex justify-center"
          >
            {/* Floating badge — Total Payout */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-3 -right-2 lg:-right-6 bg-white p-2.5 rounded-2xl shadow-xl border border-brand-border flex items-center gap-2.5 z-20"
            >
              <div className="w-8 h-8 bg-brand-emerald/10 text-brand-emerald rounded-xl flex items-center justify-center">
                <TrendingUp size={16} />
              </div>
              <div>
                <p className="text-[9px] text-brand-gray uppercase font-bold">Total Payout</p>
                <p className="text-xs font-bold text-brand-navy">₦1,200,000</p>
              </div>
            </motion.div>

            {/* Floating badge — Active Members */}
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="absolute -bottom-3 -left-2 lg:-left-6 bg-white p-2.5 rounded-2xl shadow-xl border border-brand-border flex items-center gap-2.5 z-20"
            >
              <div className="w-8 h-8 bg-brand-soft-blue text-brand-primary rounded-xl flex items-center justify-center">
                <Users size={16} />
              </div>
              <div>
                <p className="text-[9px] text-brand-gray uppercase font-bold">Active Members</p>
                <p className="text-xs font-bold text-brand-navy">12,402</p>
              </div>
            </motion.div>

            <PhoneMockup />

            {/* Background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] bg-brand-primary/5 rounded-full blur-3xl -z-10" />
          </motion.div>

        </div>
      </Container>
    </section>
  );
};
