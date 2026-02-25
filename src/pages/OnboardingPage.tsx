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
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────

type Phase = 'intro' | 'profile' | 'group' | 'success';

// ─── Data ──────────────────────────────────────────────────────────────────────

const slides = [
  {
    id: 1,
    icon: Sparkles,
    title: 'Save together,\ngrow together',
    subtitle:
      'Ajopay digitises the trusted Ajo tradition so your community savings are always safe, transparent, and on time.',
  },
  {
    id: 2,
    icon: ShieldCheck,
    title: 'Bank-grade security',
    subtitle:
      'Every naira is protected. End-to-end encryption and real-time alerts keep your savings secure around the clock.',
  },
  {
    id: 3,
    icon: TrendingUp,
    title: 'Watch your money grow',
    subtitle:
      'Track contributions, payouts, and savings milestones in one clean dashboard built for your community.',
  },
];

const groups = [
  {
    id: 1,
    name: 'Lagos Techies Ajo',
    contribution: '₦50,000',
    frequency: 'Monthly',
    members: 8,
    capacity: 12,
    category: 'Tech Professionals',
  },
  {
    id: 2,
    name: 'Abuja Market Circle',
    contribution: '₦10,000',
    frequency: 'Weekly',
    members: 15,
    capacity: 20,
    category: 'Traders',
  },
  {
    id: 3,
    name: 'Young Professionals',
    contribution: '₦25,000',
    frequency: 'Monthly',
    members: 5,
    capacity: 10,
    category: 'General',
  },
  {
    id: 4,
    name: 'Family Savings Club',
    contribution: '₦15,000',
    frequency: 'Bi-weekly',
    members: 7,
    capacity: 8,
    category: 'Family',
  },
];

// ─── Shared transition ─────────────────────────────────────────────────────────

const slide: Transition = { type: 'tween', ease: [0.25, 0.46, 0.45, 0.94], duration: 0.35 };

const pageVariants = {
  enter: (d: number) => ({ x: d > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? '-100%' : '100%', opacity: 0 }),
};

// ─── Logo ──────────────────────────────────────────────────────────────────────

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 select-none">
      <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center">
        <span className="text-white font-bold text-lg leading-none">A</span>
      </div>
      <span className="text-lg font-bold text-brand-navy tracking-tight">Ajopay</span>
    </Link>
  );
}

// ─── Step dots ─────────────────────────────────────────────────────────────────

function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <motion.div
          key={i}
          animate={{ width: i === current ? 20 : 6, backgroundColor: i === current ? '#0F766E' : '#CBD5E1' }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="h-1.5 rounded-full"
        />
      ))}
    </div>
  );
}

// ─── Phase badge ───────────────────────────────────────────────────────────────

function PhaseBadge({ label }: { label: string }) {
  return (
    <span className="inline-block text-[11px] font-bold uppercase tracking-widest text-brand-emerald bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
      {label}
    </span>
  );
}

// ─── Primary button ────────────────────────────────────────────────────────────

function PrimaryBtn({
  children,
  onClick,
  disabled,
  type = 'button',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-brand-primary text-white font-semibold text-sm transition-all hover:bg-brand-primary-hover focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
    >
      {children}
    </button>
  );
}

// ─── Ghost button ──────────────────────────────────────────────────────────────

function GhostBtn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-center text-sm text-brand-gray hover:text-brand-navy font-medium transition-colors py-2"
    >
      {children}
    </button>
  );
}

// ─── Group card ────────────────────────────────────────────────────────────────

function GroupCard({
  group,
  selected,
  onSelect,
}: {
  group: (typeof groups)[0];
  selected: boolean;
  onSelect: () => void;
}) {
  const fill = (group.members / group.capacity) * 100;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-150 ${selected
          ? 'border-brand-emerald bg-emerald-50'
          : 'border-brand-border bg-white hover:border-slate-300'
        }`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-soft-blue flex items-center justify-center text-brand-primary flex-shrink-0">
            <Users size={18} />
          </div>
          <div>
            <p className="font-semibold text-brand-navy text-sm leading-tight">{group.name}</p>
            <p className="text-[11px] text-brand-gray mt-0.5">{group.category}</p>
          </div>
        </div>
        {selected && (
          <div className="w-5 h-5 rounded-full bg-brand-emerald flex items-center justify-center flex-shrink-0 mt-0.5">
            <Check size={11} className="text-white" strokeWidth={3} />
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="flex gap-3 mb-3">
        {[
          { label: 'Contribution', value: group.contribution },
          { label: 'Frequency', value: group.frequency },
          { label: 'Members', value: `${group.members}/${group.capacity}` },
        ].map((s) => (
          <div key={s.label}>
            <p className="text-[10px] text-brand-gray uppercase font-semibold tracking-wide">{s.label}</p>
            <p className="text-xs font-bold text-brand-navy">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand-emerald rounded-full transition-all"
          style={{ width: `${fill}%` }}
        />
      </div>
    </button>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const navigate = useNavigate();

  const [phase, setPhase] = useState<Phase>('intro');
  const [dir, setDir] = useState(1);

  // Intro
  const [slideIndex, setSlideIndex] = useState(0);

  // Profile
  const [displayName, setDisplayName] = useState('');

  // Group
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);

  // ── helpers
  const goTo = (next: Phase) => { setDir(1); setPhase(next); };
  const goBack = (prev: Phase) => { setDir(-1); setPhase(prev); };

  const nextSlide = () => {
    if (slideIndex < slides.length - 1) setSlideIndex((i) => i + 1);
    else goTo('profile');
  };
  const prevSlide = () => { if (slideIndex > 0) setSlideIndex((i) => i - 1); };

  const filteredGroups = groups.filter(
    (g) =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.category.toLowerCase().includes(search.toLowerCase()) ||
      g.frequency.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-screen bg-brand-light overflow-hidden flex flex-col">

      {/* ── Top bar (logo + skip) */}
      <header className="flex-shrink-0 flex items-center justify-between px-5 py-4 bg-white border-b border-brand-border">
        <Logo />
        <button
          onClick={() => navigate('/dashboard')}
          className="text-sm text-brand-gray hover:text-brand-navy font-medium transition-colors"
        >
          Skip
        </button>
      </header>

      {/* ── Animated page area */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait" custom={dir}>

          {/* ════════════════ INTRO ════════════════ */}
          {phase === 'intro' && (
            <motion.div
              key="intro"
              custom={dir}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={slide}
              className="absolute inset-0 flex flex-col"
            >
              {/* Slide area */}
              <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={slideIndex}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.28 }}
                    className="flex flex-col items-center"
                  >
                    {/* Icon */}
                    {(() => {
                      const Icon = slides[slideIndex].icon;
                      return (
                        <div className="w-16 h-16 rounded-2xl bg-brand-soft-blue flex items-center justify-center mb-6 text-brand-primary">
                          <Icon size={28} />
                        </div>
                      );
                    })()}

                    <h1 className="text-2xl font-bold text-brand-navy leading-tight mb-3 whitespace-pre-line">
                      {slides[slideIndex].title}
                    </h1>
                    <p className="text-sm text-brand-gray leading-relaxed max-w-xs">
                      {slides[slideIndex].subtitle}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Controls */}
              <div className="flex-shrink-0 px-5 pb-8 pt-4 bg-white border-t border-brand-border space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <StepDots total={slides.length} current={slideIndex} />
                  <span className="text-xs text-brand-gray">{slideIndex + 1} / {slides.length}</span>
                </div>
                <PrimaryBtn onClick={nextSlide}>
                  {slideIndex < slides.length - 1 ? 'Next' : 'Get Started'}
                  <ArrowRight size={16} />
                </PrimaryBtn>
                {slideIndex > 0 && <GhostBtn onClick={prevSlide}>← Back</GhostBtn>}
              </div>
            </motion.div>
          )}

          {/* ════════════════ PROFILE ════════════════ */}
          {phase === 'profile' && (
            <motion.div
              key="profile"
              custom={dir}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={slide}
              className="absolute inset-0 flex flex-col"
            >
              {/* Content */}
              <div className="flex-1 flex flex-col justify-center px-5">
                <div className="mb-6">
                  <PhaseBadge label="Step 1 of 2" />
                  <h2 className="text-xl font-bold text-brand-navy mt-3 mb-1">
                    Set up your profile
                  </h2>
                  <p className="text-sm text-brand-gray">
                    This is how your group members will see you.
                  </p>
                </div>

                <div className="bg-white rounded-2xl border border-brand-border p-5 space-y-5">
                  {/* Display name */}
                  <div>
                    <label className="block text-xs font-semibold text-brand-gray uppercase tracking-wide mb-2">
                      Display name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="e.g. John Doe"
                        className="w-full px-4 py-3 rounded-xl border-2 border-brand-border bg-brand-light text-brand-navy text-sm font-medium focus:outline-none focus:border-brand-emerald focus:bg-white transition-all placeholder:text-brand-disabled"
                      />
                      {displayName && (
                        <button
                          onClick={() => setDisplayName('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-gray hover:text-brand-navy"
                        >
                          <X size={15} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Preview */}
                  {displayName.trim() && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-brand-soft-blue border border-brand-border"
                    >
                      <div className="w-10 h-10 rounded-xl bg-brand-primary text-white flex items-center justify-center font-bold text-base flex-shrink-0">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-brand-navy">{displayName}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <ShieldCheck size={10} className="text-brand-emerald" />
                          <span className="text-[10px] text-brand-emerald font-semibold">Verified member</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex-shrink-0 px-5 pb-8 pt-4 bg-white border-t border-brand-border space-y-3">
                <PrimaryBtn onClick={() => goTo('group')} disabled={!displayName.trim()}>
                  Continue
                  <ArrowRight size={16} />
                </PrimaryBtn>
                <GhostBtn onClick={() => goBack('intro')}>← Back</GhostBtn>
              </div>
            </motion.div>
          )}

          {/* ════════════════ GROUP ════════════════ */}
          {phase === 'group' && (
            <motion.div
              key="group"
              custom={dir}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={slide}
              className="absolute inset-0 flex flex-col"
            >
              {/* Header */}
              <div className="flex-shrink-0 px-5 pt-5 pb-4 bg-white border-b border-brand-border">
                <PhaseBadge label="Step 2 of 2" />
                <h2 className="text-xl font-bold text-brand-navy mt-3 mb-1">
                  Join a savings group
                </h2>
                <p className="text-sm text-brand-gray mb-4">
                  Pick a group that matches your savings goal.
                </p>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-gray" size={15} />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search groups..."
                    className="w-full pl-10 pr-9 py-2.5 rounded-xl border-2 border-brand-border bg-brand-light text-sm text-brand-navy focus:outline-none focus:border-brand-emerald focus:bg-white transition-all placeholder:text-brand-disabled"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-gray"
                    >
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
                  className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-brand-border bg-white hover:border-brand-emerald hover:bg-emerald-50/40 transition-all group text-left"
                >
                  <div className="w-9 h-9 rounded-lg bg-brand-light border border-brand-border flex items-center justify-center text-brand-emerald group-hover:bg-emerald-100 transition-colors flex-shrink-0">
                    <Plus size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-brand-navy">Create a new group</p>
                    <p className="text-xs text-brand-gray">Invite your own community</p>
                  </div>
                  <ChevronRight size={16} className="text-brand-disabled group-hover:text-brand-emerald transition-colors flex-shrink-0" />
                </button>

                {filteredGroups.length > 0 ? (
                  filteredGroups.map((group) => (
                    <GroupCard
                      key={group.id}
                      group={group}
                      selected={selectedGroup === group.id}
                      onSelect={() =>
                        setSelectedGroup(selectedGroup === group.id ? null : group.id)
                      }
                    />
                  ))
                ) : (
                  <div className="text-center py-10">
                    <Search size={28} className="mx-auto text-brand-disabled mb-2" />
                    <p className="text-sm font-medium text-brand-gray">No groups found</p>
                    <p className="text-xs text-brand-disabled mt-1">Try a different search term</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex-shrink-0 px-5 pb-8 pt-4 bg-white border-t border-brand-border space-y-3">
                <PrimaryBtn onClick={() => goTo('success')} disabled={!selectedGroup}>
                  Join Group & Continue
                  <ArrowRight size={16} />
                </PrimaryBtn>
                <GhostBtn onClick={() => navigate('/dashboard')}>Skip for now</GhostBtn>
              </div>
            </motion.div>
          )}

          {/* ════════════════ SUCCESS ════════════════ */}
          {phase === 'success' && (
            <motion.div
              key="success"
              custom={dir}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={slide}
              className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center bg-brand-light"
            >
              {/* Check */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
                className="w-20 h-20 rounded-full bg-brand-emerald/10 border-2 border-brand-emerald flex items-center justify-center mb-6"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.35, type: 'spring', stiffness: 300 }}
                >
                  <Check size={36} className="text-brand-emerald" strokeWidth={2.5} />
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h2 className="text-2xl font-bold text-brand-navy mb-2">
                  You're all set{displayName ? `, ${displayName.split(' ')[0]}` : ''}!
                </h2>
                <p className="text-sm text-brand-gray leading-relaxed max-w-xs mx-auto">
                  Your Ajo journey starts now. Save consistently, grow together, and never miss a payout.
                </p>
              </motion.div>

              {/* Summary card */}
              {selectedGroup && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55 }}
                  className="mt-6 w-full max-w-xs bg-white rounded-2xl border border-brand-border p-4 text-left space-y-2"
                >
                  {[
                    { label: 'Group', value: groups.find((g) => g.id === selectedGroup)?.name },
                    { label: 'Contribution', value: groups.find((g) => g.id === selectedGroup)?.contribution },
                    { label: 'Frequency', value: groups.find((g) => g.id === selectedGroup)?.frequency },
                  ].map((s) => (
                    <div key={s.label} className="flex justify-between items-center">
                      <span className="text-xs text-brand-gray">{s.label}</span>
                      <span className="text-xs font-semibold text-brand-navy">{s.value}</span>
                    </div>
                  ))}
                </motion.div>
              )}

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="mt-8 w-full max-w-xs"
              >
                <PrimaryBtn onClick={() => navigate('/dashboard')}>
                  Go to Dashboard
                  <ArrowRight size={16} />
                </PrimaryBtn>
              </motion.div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
