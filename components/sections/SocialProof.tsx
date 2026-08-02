'use client';

import { Container } from '../ui/Container';
import { motion } from 'motion/react';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Ibrahim K.',
    role: 'Civil Servant',
    location: 'Kano',
    content: "I run multiple target plans and a general plan. I've been saving consistently for over a year without missing a single cycle — the passbook makes it impossible to lose track.",
    metric: 'Saved ₦2.1M in 12 months',
    rating: 5,
    color: '#3B82F6',
    initials: 'IK',
    featured: true,
  },
  {
    name: 'Olawale J.',
    role: 'Software Engineer',
    location: 'Lagos',
    content: 'Automated contributions mean I never miss my plan.',
    metric: 'Saved ₦1.2M in 6 months',
    rating: 5,
    color: '#1E3A6E',
    initials: 'OJ',
  },
  {
    name: 'Bola T.',
    role: 'Nurse',
    location: 'Ibadan',
    content: 'Got my payout within minutes of schedule. I trust AjoFlow completely.',
    metric: 'Payout ₦500K on time',
    rating: 5,
    color: '#1E3A6E',
    initials: 'BT',
  },
  {
    name: 'Chidinma E.',
    role: 'Business Owner',
    location: 'Abuja',
    content: 'Bank-grade security and transparent records gave me the peace of mind I needed.',
    metric: 'Saved ₦850K in 4 months',
    rating: 5,
    color: '#2563EB',
    initials: 'CE',
  },
  {
    name: 'Amara O.',
    role: 'Teacher',
    location: 'Port Harcourt',
    content: 'My savings plans have stayed consistent for months without a single issue.',
    metric: 'Saved ₦480K in 5 months',
    rating: 5,
    color: '#60A5FA',
    initials: 'AO',
  },
  {
    name: 'Emeka D.',
    role: 'Entrepreneur',
    location: 'Enugu',
    content: 'Handles reminders, deductions, and payouts automatically. Game changer.',
    metric: 'Saved ₦960K in 8 months',
    rating: 5,
    color: '#2563EB',
    initials: 'ED',
  },
];

const Stars = ({ n }: { n: number }) => (
  <div className="flex items-center gap-0.5">
    {[...Array(n)].map((_, i) => (
      <Star key={i} size={11} className="fill-brand-accent text-brand-accent" />
    ))}
  </div>
);

const FeaturedCard = ({ t }: { t: typeof testimonials[0] }) => (
  <motion.div
    initial={{ opacity: 0, y: 18 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-40px' }}
    transition={{ duration: 0.5 }}
    className="h-full rounded-2xl p-7 lg:p-9 shadow-lg shadow-brand-navy/10 flex flex-col justify-between"
    style={{ backgroundColor: '#0D1A6E' }}
  >
    <div>
      <div className="flex items-start justify-between mb-5">
        <Quote size={28} className="text-white/15" />
        <Stars n={t.rating} />
      </div>
      <p className="text-[17px] sm:text-[19px] text-white leading-relaxed mb-6 font-medium">
        &ldquo;{t.content}&rdquo;
      </p>
    </div>
    <div>
      <p className="text-[14px] font-black text-white mb-5">{t.metric}</p>
      <div className="flex items-center gap-3 pt-5 border-t border-white/10">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-black text-white flex-shrink-0 ring-2 ring-white/15"
          style={{ backgroundColor: t.color }}
        >
          {t.initials}
        </div>
        <div>
          <p className="text-[13px] font-bold text-white leading-none">{t.name}</p>
          <p className="text-[12px] text-white/50 mt-1">{t.role} · {t.location}</p>
        </div>
      </div>
    </div>
  </motion.div>
);

const CompactCard = ({ t, delay = 0 }: { t: typeof testimonials[0]; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 14 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-40px' }}
    transition={{ delay, duration: 0.45 }}
    className="h-full rounded-2xl bg-[#1A35D4] p-5 shadow-lg shadow-brand-primary/15 flex flex-col"
  >
    <Stars n={t.rating} />
    <p className="text-[13px] text-white/85 leading-relaxed mt-3 mb-3 flex-1">
      &ldquo;{t.content}&rdquo;
    </p>
    <p className="text-[12px] font-bold text-white mb-4">{t.metric}</p>
    <div className="flex items-center gap-2.5 pt-3.5 border-t border-white/10">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-[9px] font-black text-white flex-shrink-0 ring-2 ring-white/15"
        style={{ backgroundColor: t.color }}
      >
        {t.initials}
      </div>
      <div>
        <p className="text-[12px] font-bold text-white leading-none">{t.name}</p>
        <p className="text-[11px] text-white/50 mt-0.5">{t.role} · {t.location}</p>
      </div>
    </div>
  </motion.div>
);

export const SocialProof = () => {
  const featured = testimonials.find((t) => t.featured)!;
  const rest = testimonials.filter((t) => !t.featured);
  const [sideA, sideB, ...bottomRow] = rest;

  return (
    <section id="testimonials" className="py-24 lg:py-32 bg-brand-light relative overflow-hidden">
      <Container className="relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 lg:mb-16"
        >
          <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-brand-primary mb-4">
            What Members Say
          </p>
          <h2
            className="text-brand-navy leading-[1.05]"
            style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)' }}
          >
            <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400 }}>People </span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '-0.03em' }}>trust AjoFlow.</span>
          </h2>
        </motion.div>

        {/* Featured quote (wide) + two compact cards stacked beside it */}
        <div className="grid lg:grid-cols-5 gap-5 mb-5">
          <div className="lg:col-span-3">
            <FeaturedCard t={featured} />
          </div>
          <div className="lg:col-span-2 grid gap-5">
            <CompactCard t={sideA} delay={0.1} />
            <CompactCard t={sideB} delay={0.18} />
          </div>
        </div>

        {/* Bottom row — remaining testimonials, equal weight */}
        <div className="grid sm:grid-cols-3 gap-5">
          {bottomRow.map((t, i) => (
            <CompactCard key={t.name} t={t} delay={0.1 * i} />
          ))}
        </div>

        {/* Partners strip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 flex flex-wrap justify-center items-center gap-5"
        >
          <span className="text-[11px] font-bold text-brand-gray uppercase tracking-[0.15em]">Payments by</span>

          <div className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="11" stroke="#4F46E5" strokeWidth="3.5" fill="none"/>
              <path d="M9 17l5 5 10-14" stroke="#2DD4D4" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
            <span className="text-[15px] font-black text-slate-800 tracking-tight">monicredit</span>
          </div>

          <div className="flex items-center justify-center px-5 py-3 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <svg width="60" height="20" viewBox="0 0 38 13" fill="none">
              <path d="M14.739 0.504L9.816 12.496H6.508L4.081 2.953C3.936 2.376 3.812 2.163 3.362 1.918C2.632 1.519 1.426 1.145 0.363 0.908L0.435 0.504H5.654C6.333 0.504 6.943 0.956 7.102 1.74L8.383 8.558L11.449 0.504H14.739ZM27.367 8.469C27.381 5.244 22.989 5.063 23.018 3.617C23.027 3.175 23.448 2.705 24.367 2.581C24.822 2.519 26.08 2.47 27.508 3.142L28.073 0.766C27.311 0.489 26.326 0.222 25.099 0.222C22.001 0.222 19.808 1.875 19.79 4.264C19.771 6.024 21.354 7.002 22.547 7.583C23.774 8.178 24.183 8.561 24.178 9.094C24.169 9.911 23.2 10.27 22.293 10.285C20.683 10.311 19.72 9.843 18.953 9.489L18.37 11.945C19.14 12.296 20.569 12.601 22.049 12.619C25.341 12.619 27.357 10.986 27.367 8.469ZM35.675 12.496H38.563L36.038 0.504H33.357C32.755 0.504 32.245 0.851 32.021 1.387L27.36 12.496H30.65L31.319 10.629H35.327L35.675 12.496ZM32.218 8.281L33.848 3.664L34.773 8.281H32.218ZM19.166 0.504L16.572 12.496H13.438L16.033 0.504H19.166Z" fill="#1434CB" />
            </svg>
          </div>

          <div className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L4 5v6c0 4.418 3.358 8.563 8 9.93C16.642 19.563 20 15.418 20 11V5l-8-3z" fill="#10b981" fillOpacity="0.15" stroke="#10b981" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M9 12l2 2 4-4" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[13px] font-bold text-slate-700">256-bit SSL</span>
          </div>
        </motion.div>
      </Container>
    </section>
  );
};
