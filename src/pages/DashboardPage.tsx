import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import {
  Eye,
  EyeOff,
  Plus,
  Users,
  Bell,
  ArrowUpRight,
  ArrowDownLeft,
  Flame,
  TrendingUp,
  ChevronRight,
  Target,
  Send,
  UserPlus,
  Copy,
  Calendar,
  Zap,
  Award,
  Wallet,
  Clock,
  ArrowRight,
  Sparkles,
  CircleDollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Circular progress ring component for group cards
const ProgressRing = ({ progress, size = 48, strokeWidth = 4, color = '#0F766E' }: { progress: number; size?: number; strokeWidth?: number; color?: string }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        fill="none"
        className="text-slate-100"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-1000 ease-out"
      />
    </svg>
  );
};

export default function DashboardPage() {
  const [showBalance, setShowBalance] = useState(false);
  const [activeQuickAction, setActiveQuickAction] = useState<string | null>(null);
  const navigate = useNavigate();

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Good morning', emoji: '🌅' };
    if (hour < 17) return { text: 'Good afternoon', emoji: '☀️' };
    return { text: 'Good evening', emoji: '🌙' };
  };

  const greeting = getGreeting();

  // Contribution countdown (days until next contribution)
  const daysUntilContribution = 3;

  const activeGroups = [
    {
      id: 1,
      name: 'Lagos Techies Ajo',
      contribution: '₦50,000',
      totalPot: '₦1,200,000',
      members: 12,
      myPosition: 4,
      progress: 33,
      nextPayout: 'Oct 15',
      color: 'from-blue-500 to-indigo-600',
      bgLight: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      id: 2,
      name: 'Family Savings',
      contribution: '₦45,000',
      totalPot: '₦5,000,000',
      members: 10,
      myPosition: 7,
      progress: 60,
      nextPayout: 'Dec 20',
      color: 'from-brand-emerald to-emerald-500',
      bgLight: 'bg-emerald-50',
      textColor: 'text-brand-emerald',
    },
  ];

  const transactions = [
    { id: 1, type: 'contribution', group: 'Lagos Techies Ajo', amount: '₦50,000', date: 'Oct 12, 2023', time: '10:30 AM', status: 'success' },
    { id: 2, type: 'payout', group: 'Family Savings', amount: '₦450,000', date: 'Sep 28, 2023', time: '02:15 PM', status: 'success' },
    { id: 3, type: 'contribution', group: 'Lagos Techies Ajo', amount: '₦50,000', date: 'Sep 12, 2023', time: '09:45 AM', status: 'success' },
  ];

  const quickActions = [
    { id: 'contribute', label: 'Contribute', icon: <Send size={18} />, color: 'bg-brand-emerald text-white', shadow: 'shadow-brand-emerald/20' },
    { id: 'join', label: 'Join Group', icon: <UserPlus size={18} />, color: 'bg-brand-primary text-white', shadow: 'shadow-brand-primary/20' },
    { id: 'invite', label: 'Invite', icon: <Copy size={18} />, color: 'bg-amber-500 text-white', shadow: 'shadow-amber-500/20' },
    { id: 'create', label: 'New Group', icon: <Plus size={18} />, color: 'bg-purple-500 text-white', shadow: 'shadow-purple-500/20' },
  ];

  return (
    <DashboardLayout>
      {/* Mobile App Header */}
      <div className="md:hidden flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-brand-emerald to-emerald-400 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg shadow-brand-emerald/20">
            F
          </div>
          <div>
            <p className="text-[11px] text-brand-gray font-medium">{greeting.text} {greeting.emoji}</p>
            <p className="text-[15px] font-bold text-brand-navy">Franklyn</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-100 relative">
            <Bell size={18} className="text-brand-navy" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto space-y-6">

        {/* ═══════════════════════════════════════════ */}
        {/* SECTION 1: WALLET CARD — The Hero Moment   */}
        {/* ═══════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative rounded-[1.75rem] overflow-hidden"
        >
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-brand-navy via-[#1e3a7d] to-brand-primary"></div>

          {/* Geometric Pattern Overlay */}
          <div className="absolute inset-0 opacity-[0.07]">
            <div className="absolute top-0 right-0 w-72 h-72 rounded-full border-[40px] border-white -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-1/3 w-48 h-48 rounded-full border-[25px] border-white -mb-16"></div>
            <div className="absolute top-1/2 right-1/4 w-20 h-20 rounded-full border-[8px] border-white"></div>
          </div>

          {/* Content */}
          <div className="relative z-10 p-6 md:p-8">
            {/* Top Row - Balance label + Toggle */}
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Wallet size={16} className="text-white/60" />
                <span className="text-[13px] font-medium text-white/70">Total Savings Balance</span>
              </div>
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              >
                {showBalance ? <EyeOff size={16} className="text-white/60" /> : <Eye size={16} className="text-white/60" />}
              </button>
            </div>

            {/* Balance */}
            <motion.div
              key={showBalance ? 'show' : 'hide'}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6"
            >
              <span className="text-[2.25rem] md:text-[2.75rem] font-bold text-white tracking-tight leading-none">
                {showBalance ? '₦1,250,000' : '₦ • • • • • •'}
              </span>
            </motion.div>

            {/* Sub-balances */}
            <div className="flex flex-wrap gap-3 md:gap-6">
              <div className="flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-sm rounded-xl">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <div>
                  <p className="text-[10px] text-white/50 font-medium">Contributed</p>
                  <p className="text-sm font-bold text-white">{showBalance ? '₦850,000' : '•••'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-sm rounded-xl">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <div>
                  <p className="text-[10px] text-white/50 font-medium">Received</p>
                  <p className="text-sm font-bold text-white">{showBalance ? '₦1,050,000' : '•••'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-white/10 backdrop-blur-sm rounded-xl">
                <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                <div>
                  <p className="text-[10px] text-white/50 font-medium">Net Gain</p>
                  <p className="text-sm font-bold text-emerald-300">{showBalance ? '+₦200,000' : '•••'}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>


        {/* ═══════════════════════════════════════════ */}
        {/* SECTION 2: URGENCY BANNER                  */}
        {/* ═══════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-2xl"
        >
          <div className="flex-shrink-0 w-11 h-11 bg-amber-100 rounded-2xl flex items-center justify-center">
            <Clock size={20} className="text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-amber-900">Contribution due in {daysUntilContribution} days</p>
            <p className="text-[11px] text-amber-700/80 truncate">₦50,000 → Lagos Techies Ajo</p>
          </div>
          <button className="flex-shrink-0 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-colors shadow-sm shadow-amber-500/20">
            Pay Now
          </button>
        </motion.div>


        {/* ═══════════════════════════════════════════ */}
        {/* SECTION 3: QUICK ACTIONS                   */}
        {/* ═══════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide"
        >
          {quickActions.map((action) => (
            <motion.button
              key={action.id}
              whileTap={{ scale: 0.95 }}
              className={`flex-shrink-0 flex items-center gap-2.5 px-5 py-3 ${action.color} rounded-2xl font-semibold text-sm shadow-lg ${action.shadow} transition-all hover:shadow-xl active:shadow-md`}
            >
              {action.icon}
              {action.label}
            </motion.button>
          ))}
        </motion.div>


        {/* ═══════════════════════════════════════════ */}
        {/* SECTION 4: SAVINGS STREAK + INSIGHT        */}
        {/* ═══════════════════════════════════════════ */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Savings Streak */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm"
          >
            {/* Fire animation styles */}
            <style>{`
              @keyframes flicker {
                0%, 100% { transform: scaleY(1) scaleX(1); opacity: 1; }
                25% { transform: scaleY(1.08) scaleX(0.94); opacity: 0.92; }
                50% { transform: scaleY(0.92) scaleX(1.06); opacity: 1; }
                75% { transform: scaleY(1.05) scaleX(0.96); opacity: 0.95; }
              }
              @keyframes flickerInner {
                0%, 100% { transform: scaleY(1) translateY(0); opacity: 0.9; }
                30% { transform: scaleY(1.1) translateY(-1px); opacity: 1; }
                60% { transform: scaleY(0.9) translateY(1px); opacity: 0.85; }
              }
              @keyframes ember {
                0%, 100% { opacity: 0.4; transform: scale(1); }
                50% { opacity: 0.7; transform: scale(1.1); }
              }
              @keyframes riseParticle {
                0% { opacity: 0.8; transform: translateY(0) scale(1); }
                100% { opacity: 0; transform: translateY(-12px) scale(0.3); }
              }
              .fire-flame {
                animation: flicker 0.8s ease-in-out infinite;
                transform-origin: bottom center;
              }
              .fire-inner {
                animation: flickerInner 0.6s ease-in-out infinite;
                transform-origin: bottom center;
              }
              .fire-ember {
                animation: ember 2s ease-in-out infinite;
              }
              .fire-particle {
                animation: riseParticle 1.2s ease-out infinite;
              }
            `}</style>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-gradient-to-br from-orange-100 to-red-100 rounded-xl flex items-center justify-center">
                  <Flame size={18} className="text-orange-500" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-brand-navy">Savings Streak</h4>
                  <p className="text-[11px] text-brand-gray">On-time contributions</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-50 to-red-50 rounded-full border border-orange-100">
                <Flame size={14} className="text-orange-500" />
                <span className="text-sm font-bold text-orange-600">6</span>
                <span className="text-[10px] text-orange-400 font-semibold">months</span>
              </div>
            </div>
            {/* Streak visualization - fire flames for last 8 months */}
            <div className="flex items-end gap-1 pt-2 pb-1 px-1">
              {['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'].map((month, i) => {
                const isActive = i >= 2; // Last 6 months streak
                const flameHeight = isActive ? 48 + (i - 2) * 6 : 0; // Much taller flames
                const flameWidth = 36; // Fixed width for prominent flames
                const delay = i * 0.12;
                return (
                  <div key={month} className="flex-1 flex flex-col items-center gap-1">
                    <div className="relative flex items-end justify-center" style={{ height: '88px' }}>
                      {isActive ? (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.3 + delay, type: 'spring', stiffness: 200 }}
                          className="relative flex items-end justify-center"
                          style={{ width: `${flameWidth}px`, height: `${flameHeight}px` }}
                        >
                          {/* Glow behind flame */}
                          <div
                            className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full"
                            style={{
                              width: '32px',
                              height: '20px',
                              background: 'radial-gradient(ellipse, rgba(251,146,60,0.6) 0%, rgba(239,68,68,0.2) 50%, transparent 80%)',
                              filter: 'blur(6px)',
                            }}
                          />
                          {/* Rising particles */}
                          <div
                            className="fire-particle absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-amber-300"
                            style={{ top: '-4px', animationDelay: `${delay}s` }}
                          />
                          <div
                            className="fire-particle absolute rounded-full bg-orange-400"
                            style={{ top: '2px', left: '30%', width: '3px', height: '3px', animationDelay: `${delay + 0.4}s` }}
                          />
                          {/* Outer flame SVG */}
                          <svg
                            viewBox="0 0 32 48"
                            className="fire-flame absolute bottom-0"
                            style={{
                              width: `${flameWidth}px`,
                              height: `${flameHeight}px`,
                              animationDelay: `${delay * 0.5}s`,
                              filter: 'drop-shadow(0 0 6px rgba(251,146,60,0.5)) drop-shadow(0 0 12px rgba(239,68,68,0.2))',
                            }}
                          >
                            <defs>
                              <linearGradient id={`flame-grad-${i}`} x1="0.5" y1="1" x2="0.5" y2="0">
                                <stop offset="0%" stopColor="#991b1b" />
                                <stop offset="20%" stopColor="#dc2626" />
                                <stop offset="45%" stopColor="#f97316" />
                                <stop offset="70%" stopColor="#fb923c" />
                                <stop offset="90%" stopColor="#fbbf24" />
                                <stop offset="100%" stopColor="#fde68a" />
                              </linearGradient>
                            </defs>
                            <path
                              d="M16 1C16 1 3 16 3 28C3 36 8 44 16 47C24 44 29 36 29 28C29 16 16 1 16 1Z"
                              fill={`url(#flame-grad-${i})`}
                            />
                            {/* Flame wisp on left */}
                            <path
                              d="M10 18C10 18 6 22 7 28C7.5 26 9 24 10 22C10 22 8 26 9 30"
                              fill="none"
                              stroke="rgba(251,191,36,0.3)"
                              strokeWidth="1"
                            />
                          </svg>
                          {/* Inner flame (bright yellow-white core) */}
                          <svg
                            viewBox="0 0 32 48"
                            className="fire-inner absolute bottom-0 left-1/2 -translate-x-1/2"
                            style={{
                              width: `${flameWidth * 0.55}px`,
                              height: `${flameHeight * 0.6}px`,
                              animationDelay: `${delay * 0.3}s`,
                            }}
                          >
                            <defs>
                              <linearGradient id={`inner-grad-${i}`} x1="0.5" y1="1" x2="0.5" y2="0">
                                <stop offset="0%" stopColor="#f97316" />
                                <stop offset="30%" stopColor="#fbbf24" />
                                <stop offset="60%" stopColor="#fde68a" />
                                <stop offset="100%" stopColor="#fefce8" />
                              </linearGradient>
                            </defs>
                            <path
                              d="M16 8C16 8 8 20 8 28C8 34 11 40 16 43C21 40 24 34 24 28C24 20 16 8 16 8Z"
                              fill={`url(#inner-grad-${i})`}
                            />
                          </svg>
                        </motion.div>
                      ) : (
                        /* Inactive: small grey ember */
                        <div className="flex flex-col items-center gap-1">
                          <div className="fire-ember w-4 h-4 rounded-full bg-gradient-to-t from-slate-200 to-slate-100 shadow-inner" style={{ animationDelay: `${delay}s` }} />
                          <div className="w-[2px] h-5 bg-slate-100 rounded-full" />
                        </div>
                      )}
                    </div>
                    <span className={`text-[9px] font-bold ${isActive ? 'text-orange-500' : 'text-slate-300'}`}>{month}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* AI Insight Card */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-gradient-to-br from-brand-emerald to-emerald-600 rounded-2xl p-5 text-white relative overflow-hidden"
          >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10"></div>
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-black/5 rounded-full -ml-8 -mb-8"></div>

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-emerald-200" />
                <span className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider">Insight</span>
              </div>
              <h4 className="text-lg font-bold mb-1 leading-snug">You're saving 25% more than last month!</h4>
              <p className="text-[12px] text-white/70 mb-4 leading-relaxed">Keep up the momentum. Your next payout from Family Savings is in 52 days.</p>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/15 rounded-lg">
                  <TrendingUp size={14} />
                  <span className="text-xs font-bold">₦200K net gain</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/15 rounded-lg">
                  <Award size={14} />
                  <span className="text-xs font-bold">Top 20% saver</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>


        {/* ═══════════════════════════════════════════ */}
        {/* SECTION 5: ACTIVE GROUPS — Rotation Cards   */}
        {/* ═══════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[15px] font-bold text-brand-navy">Active Groups</h3>
              <p className="text-[11px] text-brand-gray">Your position in the rotation</p>
            </div>
            <button
              onClick={() => navigate('/groups')}
              className="flex items-center gap-1 text-xs font-bold text-brand-emerald hover:text-emerald-700 transition-colors"
            >
              See All <ChevronRight size={14} />
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {activeGroups.map((group, index) => (
              <motion.div
                key={group.id}
                whileHover={{ y: -2 }}
                onClick={() => navigate(`/groups/${group.id}`)}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm cursor-pointer hover:shadow-md transition-all duration-200 group"
              >
                {/* Group header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 ${group.bgLight} rounded-2xl flex items-center justify-center ${group.textColor}`}>
                      <Users size={20} />
                    </div>
                    <div>
                      <h4 className="text-[14px] font-bold text-brand-navy group-hover:text-brand-primary transition-colors">{group.name}</h4>
                      <p className="text-[11px] text-brand-gray">{group.members} members</p>
                    </div>
                  </div>
                  {/* Progress Ring */}
                  <div className="relative flex items-center justify-center">
                    <ProgressRing progress={group.progress} size={44} strokeWidth={3.5} />
                    <span className="absolute text-[10px] font-bold text-brand-navy">{group.progress}%</span>
                  </div>
                </div>

                {/* Group stats */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-slate-50 rounded-xl px-3 py-2">
                    <p className="text-[9px] text-brand-gray font-bold uppercase tracking-wider">Contribution</p>
                    <p className="text-[13px] font-bold text-brand-navy mt-0.5">{group.contribution}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl px-3 py-2">
                    <p className="text-[9px] text-brand-gray font-bold uppercase tracking-wider">Position</p>
                    <p className="text-[13px] font-bold text-brand-navy mt-0.5">{group.myPosition} of {group.members}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl px-3 py-2">
                    <p className="text-[9px] text-brand-gray font-bold uppercase tracking-wider">Next Pay</p>
                    <p className="text-[13px] font-bold text-brand-emerald mt-0.5">{group.nextPayout}</p>
                  </div>
                </div>

                {/* Rotation Timeline Mini */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: group.members > 8 ? 8 : group.members }, (_, i) => {
                    const pos = i + 1;
                    const isPast = pos < group.myPosition;
                    const isCurrent = pos === group.myPosition;
                    const dotCount = group.members > 8 ? 8 : group.members;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center">
                        <div className={`w-full h-1.5 rounded-full ${isPast ? 'bg-brand-emerald' : isCurrent ? `bg-gradient-to-r ${group.color}` : 'bg-slate-100'
                          }`}></div>
                        {isCurrent && (
                          <div className="mt-1">
                            <span className="text-[8px] font-bold text-brand-emerald">YOU</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {group.members > 8 && (
                    <span className="text-[9px] text-brand-gray font-medium ml-1">+{group.members - 8}</span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>


        {/* ═══════════════════════════════════════════ */}
        {/* SECTION 6: RECENT ACTIVITY                 */}
        {/* ═══════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
        >
          <div className="flex justify-between items-center p-5 pb-0">
            <div>
              <h3 className="text-[15px] font-bold text-brand-navy">Recent Activity</h3>
              <p className="text-[11px] text-brand-gray">Your latest transactions</p>
            </div>
            <button
              onClick={() => navigate('/activity')}
              className="flex items-center gap-1 text-xs font-bold text-brand-emerald hover:text-emerald-700 transition-colors"
            >
              View All <ChevronRight size={14} />
            </button>
          </div>

          <div className="p-3 pt-4">
            {transactions.map((tx, index) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.05 }}
                className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${tx.type === 'contribution'
                    ? 'bg-brand-primary/8 text-brand-primary group-hover:bg-brand-primary/15'
                    : 'bg-emerald-50 text-brand-emerald group-hover:bg-emerald-100'
                    }`}>
                    {tx.type === 'contribution' ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-brand-navy">{tx.group}</p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-brand-gray">{tx.date}</span>
                      <span className="w-0.5 h-0.5 bg-slate-300 rounded-full"></span>
                      <span className="text-[11px] text-brand-gray">{tx.time}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-[13px] font-bold ${tx.type === 'contribution' ? 'text-brand-navy' : 'text-brand-emerald'
                    }`}>
                    {tx.type === 'contribution' ? '-' : '+'}{tx.amount}
                  </p>
                  <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest ${tx.status === 'success' ? 'text-emerald-500' : 'text-amber-500'
                    }`}>
                    <span className="w-1 h-1 bg-current rounded-full"></span>
                    {tx.status}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════ */}
        {/* SECTION 7: BOTTOM CTA — SAVINGS TARGET     */}
        {/* ═══════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-brand-navy rounded-2xl p-6 text-white relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-5">
            <div className="absolute -bottom-8 -right-8 w-40 h-40 border-[20px] border-white rounded-full"></div>
            <div className="absolute -top-6 -left-6 w-28 h-28 border-[12px] border-white rounded-full"></div>
          </div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                <Target size={24} className="text-brand-emerald" />
              </div>
              <div>
                <h3 className="text-[15px] font-bold">Set a savings target</h3>
                <p className="text-[12px] text-white/60 leading-relaxed">Track your monthly goals and build better habits</p>
              </div>
            </div>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-white text-brand-navy rounded-xl font-bold text-sm hover:bg-slate-100 transition-colors shadow-lg">
              Get Started
              <ArrowRight size={16} />
            </button>
          </div>
        </motion.div>

      </div>
    </DashboardLayout>
  );
}
