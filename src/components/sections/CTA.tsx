import { Container } from '../ui/Container';
import { Button } from '../ui/Button';
import { motion } from 'motion/react';
import {
  ArrowRight,
  ShieldCheck,
  Smartphone,
  Bell,
  Eye,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  Users,
  LayoutGrid,
  ChevronRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

// ─── CTA Phone Mockup (white-tinted variant for dark bg) ──────────────────────
const CTAPhone = () => (
  <div className="relative flex justify-center items-center select-none">
    {/* Glow halo */}
    <div className="absolute w-56 h-56 rounded-full bg-white/10 blur-3xl pointer-events-none" />

    {/* Phone shell */}
    <motion.div
      animate={{ y: [0, -16, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      className="relative z-10 w-[210px] rounded-[2.5rem] bg-[#0F172A] overflow-hidden"
      style={{
        border: '6px solid rgba(255,255,255,0.15)',
        boxShadow: '0 24px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)',
      }}
    >
      {/* Dynamic island */}
      <div className="flex justify-center pt-2 pb-0.5">
        <div className="w-16 h-4 rounded-full bg-black flex items-center justify-center gap-1">
          <div className="w-1 h-1 rounded-full bg-[#222]" />
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
        <div className="mx-3 mb-2 rounded-[0.8rem] bg-[#1B2F6B] p-2.5 text-white relative overflow-hidden">
          <div className="absolute -top-3 -right-3 w-10 h-10 bg-white/10 rounded-full blur-xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-1 mb-0.5">
              <span className="text-[7px] opacity-80 font-medium">Total contributions</span>
              <Eye size={7} className="opacity-70" />
            </div>
            <p className="text-base font-bold tracking-tight mb-1.5">₦1,250,000</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 bg-white/10 rounded px-1.5 py-0.5">
                <TrendingUp size={7} className="text-[#4ade80]" />
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
    </motion.div>

    {/* Floating badge — top right */}
    <motion.div
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      className="absolute -top-4 -right-4 bg-white/15 backdrop-blur-sm border border-white/25 p-2.5 rounded-2xl flex items-center gap-2 z-20"
    >
      <div className="w-7 h-7 bg-[#0F766E]/30 rounded-lg flex items-center justify-center">
        <TrendingUp size={14} className="text-[#4ade80]" />
      </div>
      <div>
        <p className="text-[8px] text-white/60 uppercase font-bold">Total Payout</p>
        <p className="text-xs font-bold text-white">₦1,200,000</p>
      </div>
    </motion.div>

    {/* Floating badge — bottom left */}
    <motion.div
      animate={{ y: [0, 8, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      className="absolute -bottom-4 -left-4 bg-white/15 backdrop-blur-sm border border-white/25 p-2.5 rounded-2xl flex items-center gap-2 z-20"
    >
      <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
        <Users size={14} className="text-white" />
      </div>
      <div>
        <p className="text-[8px] text-white/60 uppercase font-bold">Active Members</p>
        <p className="text-xs font-bold text-white">12,402</p>
      </div>
    </motion.div>
  </div>
);

// ─── CTA Section ──────────────────────────────────────────────────────────────
export const CTA = () => {
  return (
    <section className="py-24 bg-white overflow-hidden">
      <Container>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-brand-primary rounded-[3rem] p-8 md:p-16 lg:p-24 text-white relative overflow-hidden shadow-2xl shadow-brand-primary/30"
        >
          {/* Background decorative elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-emerald/20 rounded-full -ml-32 -mb-32 blur-3xl" />

          <div className="relative z-10 grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Copy */}
            <div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight tracking-tight">
                Ready to reach your <span className="text-brand-emerald">savings goals?</span>
              </h2>
              <p className="text-brand-light/70 text-lg mb-10 leading-relaxed max-w-xl">
                Join over 50,000 Nigerians who are already saving smarter with Ajopay. It takes less than 2 minutes to get started.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/signup">
                  <Button variant="white" size="lg" className="text-base px-6 py-4 rounded-2xl flex items-center gap-2 shadow-xl shadow-black/10">
                    Create Free Account
                    <ArrowRight size={16} />
                  </Button>
                </Link>
                <div className="flex items-center gap-4 px-4">
                  <div className="flex -space-x-3">
                    {[1, 2, 3, 4].map((i) => (
                      <img
                        key={i}
                        src={`https://i.pravatar.cc/100?u=${i}`}
                        alt="User"
                        className="w-10 h-10 rounded-full border-2 border-brand-primary"
                      />
                    ))}
                  </div>
                  <p className="text-sm font-bold text-white/80">Join 50k+ users</p>
                </div>
              </div>

              <div className="mt-12 flex flex-wrap gap-8">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="text-brand-emerald" size={20} />
                  <span className="text-sm font-bold">NDIC Insured</span>
                </div>
                <div className="flex items-center gap-2">
                  <Smartphone className="text-brand-emerald" size={20} />
                  <span className="text-sm font-bold">Available on iOS & Android</span>
                </div>
              </div>
            </div>

            {/* Right: Phone Mockup */}
            <div className="relative hidden lg:flex justify-center items-center py-8">
              <CTAPhone />
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
};
