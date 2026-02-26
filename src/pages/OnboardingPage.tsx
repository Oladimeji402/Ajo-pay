import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import type { Transition } from 'motion/react';
import {
  Users,
  Search,
  Check,
  ArrowRight,
  Plus,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  ChevronRight,
  X,
  Flame,
  Target,
  Wallet
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────────
type Phase = 'intro' | 'profile' | 'group' | 'success';

// ─── Data ───────────────────────────────────────────────────────────────────────
const slides = [
  {
    id: 1,
    icon: Sparkles,
    color: 'from-brand-emerald to-emerald-500',
    bgIcon: 'bg-emerald-50',
    iconColor: 'text-brand-emerald',
    title: 'Save together,\ngrow together',
    subtitle: 'Ajopay digitises the trusted Ajo tradition so your community savings are always safe, transparent, and on time.',
  },
  {
    id: 2,
    icon: ShieldCheck,
    color: 'from-brand-primary to-blue-600',
    bgIcon: 'bg-blue-50',
    iconColor: 'text-brand-primary',
    title: 'Bank-grade\nsecurity',
    subtitle: 'Every naira is protected. End-to-end encryption and real-time alerts keep your savings secure around the clock.',
  },
  {
    id: 3,
    icon: TrendingUp,
    color: 'from-purple-500 to-violet-600',
    bgIcon: 'bg-purple-50',
    iconColor: 'text-purple-600',
    title: 'Watch your\nmoney grow',
    subtitle: 'Track contributions, payouts, and savings milestones in one clean dashboard built for your community.',
  },
];

const groups = [
  { id: 1, name: 'Lagos Techies Ajo', contribution: '₦50,000', frequency: 'Monthly', members: 8, capacity: 12, category: 'Tech Professionals', color: '#3B82F6' },
  { id: 2, name: 'Abuja Market Circle', contribution: '₦10,000', frequency: 'Weekly', members: 15, capacity: 20, category: 'Traders', color: '#0F766E' },
  { id: 3, name: 'Young Professionals', contribution: '₦25,000', frequency: 'Monthly', members: 5, capacity: 10, category: 'General', color: '#8B5CF6' },
  { id: 4, name: 'Family Savings Club', contribution: '₦15,000', frequency: 'Bi-weekly', members: 7, capacity: 8, category: 'Family', color: '#F59E0B' },
];

// ─── Transition ─────────────────────────────────────────────────────────────────
const slide: Transition = { type: 'tween', ease: [0.25, 0.46, 0.45, 0.94], duration: 0.35 };
const pageVariants = {
  enter: (d: number) => ({ x: d > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? '-100%' : '100%', opacity: 0 }),
};

// ─── StepDots ───────────────────────────────────────────────────────────────────
function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <motion.div
          key={i}
          animate={{ 
            width: i === current ? 24 : 6, 
            backgroundColor: i === current ? '#0F766E' : i < current ? '#10B981' : '#E2E8F0' 
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="h-1.5 rounded-full"
        />
      ))}
    </div>
  );
}

// ─── PhaseBadge ─────────────────────────────────────────────────────────────────
function PhaseBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-brand-emerald bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
      <span className="w-1.5 h-1.5 bg-brand-emerald rounded-full"></span>
      {label}
    </span>
  );
}

// ─── PrimaryBtn ─────────────────────────────────────────────────────────────────
function PrimaryBtn({ children, onClick, disabled, type = 'button' }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; type?: 'button' | 'submit' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-brand-primary text-white font-semibold text-sm transition-all hover:bg-brand-primary-hover focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] shadow-lg shadow-brand-primary/20"
    >
      {children}
    </button>
  );
}

// ─── GhostBtn ───────────────────────────────────────────────────────────────────
function GhostBtn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="w-full text-center text-[13px] text-brand-gray hover:text-brand-navy font-medium transition-colors py-2">
      {children}
    </button>
  );
}

// ─── ProgressRing ───────────────────────────────────────────────────────────────
function ProgressRing({ progress, size = 36, strokeWidth = 3, color = '#0F766E' }: { progress: number; size?: number; strokeWidth?: number; color?: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="none" className="text-slate-100" />
      <circle cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={strokeWidth} fill="none" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
    </svg>
  );
}

// ─── GroupCard ───────────────────────────────────────────────────────────────────
function GroupCard({ group, selected, onSelect }: { group: (typeof groups)[0]; selected: boolean; onSelect: () => void }) {
  const fill = (group.members / group.capacity) * 100;
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileTap={{ scale: 0.98 }}
      className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 ${
        selected ? 'border-brand-emerald bg-emerald-50/50 shadow-sm shadow-brand-emerald/10' : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${group.color}15`, color: group.color }}
          >
            <Users size={18} />
          </div>
          <div>
            <p className="font-bold text-brand-navy text-[13px] leading-tight">{group.name}</p>
            <p className="text-[10px] text-brand-gray mt-0.5">{group.category}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {selected ? (
            <div className="w-6 h-6 rounded-full bg-brand-emerald flex items-center justify-center shadow-sm">
              <Check size={12} className="text-white" strokeWidth={3} />
            </div>
          ) : (
            <div className="relative flex items-center justify-center">
              <ProgressRing progress={fill} size={28} strokeWidth={2.5} color={group.color} />
              <span className="absolute text-[7px] font-bold text-brand-navy">{Math.round(fill)}%</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-4 mb-3">
        {[
          { label: 'Per cycle', value: group.contribution },
          { label: 'Frequency', value: group.frequency },
          { label: 'Slots', value: `${group.members}/${group.capacity}` },
        ].map((s) => (
          <div key={s.label}>
            <p className="text-[9px] text-brand-gray uppercase font-bold tracking-wider">{s.label}</p>
            <p className="text-[11px] font-bold text-brand-navy mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${fill}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ backgroundColor: group.color }}
        />
      </div>
    </motion.button>
  );
}

// ─── Main ───────────────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('intro');
  const [dir, setDir] = useState(1);
  const [slideIndex, setSlideIndex] = useState(0);
  const [displayName, setDisplayName] = useState('');
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);

  const goTo = (next: Phase) => { setDir(1); setPhase(next); };
  const goBack = (prev: Phase) => { setDir(-1); setPhase(prev); };
  const nextSlide = () => { slideIndex < slides.length - 1 ? setSlideIndex(i => i + 1) : goTo('profile'); };
  const prevSlide = () => { if (slideIndex > 0) setSlideIndex(i => i - 1); };

  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    g.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-screen bg-[#F8FAFC] overflow-hidden flex flex-col">

      {/* ── Top Bar ── */}
      <header className="flex-shrink-0 flex items-center justify-between px-5 py-4 bg-white/80 backdrop-blur-xl border-b border-slate-100 z-10">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-brand-emerald to-emerald-400 rounded-lg flex items-center justify-center shadow-sm shadow-brand-emerald/20">
            <span className="text-white font-bold text-base leading-none">A</span>
          </div>
          <span className="text-lg font-bold text-brand-navy tracking-tight">Ajopay</span>
        </Link>
        <button onClick={() => navigate('/dashboard')} className="text-[13px] text-brand-gray hover:text-brand-navy font-medium transition-colors">
          Skip
        </button>
      </header>

      {/* ── Pages ── */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait" custom={dir}>

          {/* ════════════════ INTRO ════════════════ */}
          {phase === 'intro' && (
            <motion.div key="intro" custom={dir} variants={pageVariants} initial="enter" animate="center" exit="exit" transition={slide} className="absolute inset-0 flex flex-col">
              <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
                <AnimatePresence mode="wait">
                  <motion.div key={slideIndex} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className="flex flex-col items-center max-w-sm">
                    {/* Icon with gradient ring */}
                    {(() => {
                      const s = slides[slideIndex];
                      const Icon = s.icon;
                      return (
                        <div className="relative mb-8">
                          <div className={`w-20 h-20 rounded-3xl ${s.bgIcon} flex items-center justify-center`}>
                            <Icon size={32} className={s.iconColor} />
                          </div>
                          {/* Decorative ring */}
                          <div className={`absolute inset-0 -m-3 rounded-[1.75rem] border-2 border-dashed opacity-20`} style={{ borderColor: s.color.includes('emerald') ? '#0F766E' : s.color.includes('primary') ? '#1B2F6B' : '#8B5CF6' }}></div>
                        </div>
                      );
                    })()}

                    <h1 className="text-[1.75rem] font-bold text-brand-navy leading-[1.2] mb-3 whitespace-pre-line">
                      {slides[slideIndex].title}
                    </h1>
                    <p className="text-[13px] text-brand-gray leading-relaxed">
                      {slides[slideIndex].subtitle}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Controls */}
              <div className="flex-shrink-0 px-5 pb-8 pt-4 bg-white/80 backdrop-blur-xl border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <StepDots total={slides.length} current={slideIndex} />
                  <span className="text-[11px] text-slate-400 font-medium">{slideIndex + 1} of {slides.length}</span>
                </div>
                <PrimaryBtn onClick={nextSlide}>
                  {slideIndex < slides.length - 1 ? 'Continue' : 'Get Started'}
                  <ArrowRight size={16} />
                </PrimaryBtn>
                {slideIndex > 0 && <GhostBtn onClick={prevSlide}>← Back</GhostBtn>}
              </div>
            </motion.div>
          )}

          {/* ════════════════ PROFILE ════════════════ */}
          {phase === 'profile' && (
            <motion.div key="profile" custom={dir} variants={pageVariants} initial="enter" animate="center" exit="exit" transition={slide} className="absolute inset-0 flex flex-col">
              <div className="flex-1 flex flex-col justify-center px-5 max-w-md mx-auto w-full">
                <div className="mb-6">
                  <PhaseBadge label="Step 1 of 2" />
                  <h2 className="text-xl font-bold text-brand-navy mt-3 mb-1">Set up your profile</h2>
                  <p className="text-[13px] text-brand-gray">This is how your group members will see you.</p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-5">
                  <div>
                    <label className="block text-[12px] font-bold text-brand-navy uppercase tracking-wide mb-2">Display name</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="e.g. John Doe"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-brand-navy text-sm font-medium focus:outline-none focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/10 transition-all placeholder:text-slate-400"
                      />
                      {displayName && (
                        <button onClick={() => setDisplayName('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-navy">
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Preview */}
                  {displayName.trim() && (
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-emerald to-emerald-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-sm">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-brand-navy">{displayName}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <ShieldCheck size={10} className="text-brand-emerald" />
                          <span className="text-[10px] text-brand-emerald font-bold">Verified member</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              <div className="flex-shrink-0 px-5 pb-8 pt-4 bg-white/80 backdrop-blur-xl border-t border-slate-100 space-y-3">
                <PrimaryBtn onClick={() => goTo('group')} disabled={!displayName.trim()}>
                  Continue <ArrowRight size={16} />
                </PrimaryBtn>
                <GhostBtn onClick={() => goBack('intro')}>← Back</GhostBtn>
              </div>
            </motion.div>
          )}

          {/* ════════════════ GROUP ════════════════ */}
          {phase === 'group' && (
            <motion.div key="group" custom={dir} variants={pageVariants} initial="enter" animate="center" exit="exit" transition={slide} className="absolute inset-0 flex flex-col">
              {/* Header */}
              <div className="flex-shrink-0 px-5 pt-5 pb-4 bg-white/80 backdrop-blur-xl border-b border-slate-100">
                <PhaseBadge label="Step 2 of 2" />
                <h2 className="text-xl font-bold text-brand-navy mt-3 mb-1">Join a savings group</h2>
                <p className="text-[13px] text-brand-gray mb-4">Pick a group that matches your savings goal.</p>

                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search groups..."
                    className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-brand-navy focus:outline-none focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/10 transition-all placeholder:text-slate-400"
                  />
                  {search && (
                    <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {/* Create group */}
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-dashed border-slate-200 bg-white hover:border-brand-emerald hover:bg-emerald-50/40 transition-all group text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-brand-emerald group-hover:bg-emerald-100 transition-colors flex-shrink-0">
                    <Plus size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-brand-navy">Create a new group</p>
                    <p className="text-[11px] text-brand-gray">Invite your own community</p>
                  </div>
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-brand-emerald transition-colors flex-shrink-0" />
                </button>

                {filteredGroups.length > 0 ? (
                  filteredGroups.map((group) => (
                    <GroupCard key={group.id} group={group} selected={selectedGroup === group.id} onSelect={() => setSelectedGroup(selectedGroup === group.id ? null : group.id)} />
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-300">
                      <Search size={24} />
                    </div>
                    <p className="text-[13px] font-bold text-brand-navy">No groups found</p>
                    <p className="text-[11px] text-brand-gray mt-1">Try a different search term</p>
                  </div>
                )}
              </div>

              <div className="flex-shrink-0 px-5 pb-8 pt-4 bg-white/80 backdrop-blur-xl border-t border-slate-100 space-y-3">
                <PrimaryBtn onClick={() => goTo('success')} disabled={!selectedGroup}>
                  Join Group & Continue <ArrowRight size={16} />
                </PrimaryBtn>
                <GhostBtn onClick={() => navigate('/dashboard')}>Skip for now</GhostBtn>
              </div>
            </motion.div>
          )}

          {/* ════════════════ SUCCESS ════════════════ */}
          {phase === 'success' && (
            <motion.div key="success" custom={dir} variants={pageVariants} initial="enter" animate="center" exit="exit" transition={slide} className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
              {/* Animated Check */}
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }} className="relative mb-6">
                <div className="w-24 h-24 rounded-3xl bg-emerald-50 flex items-center justify-center">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.35, type: 'spring', stiffness: 300 }}>
                    <Check size={44} className="text-brand-emerald" strokeWidth={2.5} />
                  </motion.div>
                </div>
                {/* Sparkle decorations */}
                <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.5 }} className="absolute -top-2 -right-2 w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center">
                  <Sparkles size={12} className="text-amber-500" />
                </motion.div>
                <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.6 }} className="absolute -bottom-1 -left-2 w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                  <Flame size={10} className="text-blue-500" />
                </motion.div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <h2 className="text-2xl font-bold text-brand-navy mb-2">
                  You're all set{displayName ? `, ${displayName.split(' ')[0]}` : ''}! 🎉
                </h2>
                <p className="text-[13px] text-brand-gray leading-relaxed max-w-xs mx-auto">
                  Your Ajo journey starts now. Save consistently, grow together, and never miss a payout.
                </p>
              </motion.div>

              {/* Summary card */}
              {selectedGroup && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="mt-6 w-full max-w-xs">
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                    <p className="text-[10px] font-bold text-brand-gray uppercase tracking-wider mb-3">Your first group</p>
                    {[
                      { label: 'Group', value: groups.find(g => g.id === selectedGroup)?.name },
                      { label: 'Contribution', value: groups.find(g => g.id === selectedGroup)?.contribution },
                      { label: 'Frequency', value: groups.find(g => g.id === selectedGroup)?.frequency },
                    ].map((s) => (
                      <div key={s.label} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                        <span className="text-[12px] text-brand-gray">{s.label}</span>
                        <span className="text-[12px] font-bold text-brand-navy">{s.value}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="mt-8 w-full max-w-xs">
                <PrimaryBtn onClick={() => navigate('/dashboard')}>
                  Go to Dashboard <ArrowRight size={16} />
                </PrimaryBtn>
              </motion.div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
