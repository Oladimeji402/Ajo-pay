import { Container } from '../ui/Container';
import { motion } from 'motion/react';
import { Star, Quote } from 'lucide-react';

export const SocialProof = () => {
  const testimonials = [
    {
      name: 'Olawale J.',
      role: 'Software Engineer, Lagos',
      content: 'Ajopay has completely changed how I save. The automated contributions mean I never forget my turn, and the transparency is unmatched.',
      avatar: 'https://i.pravatar.cc/150?u=olawale',
      rating: 5,
      accent: 'from-brand-primary/10 to-blue-50',
    },
    {
      name: 'Chidinma E.',
      role: 'Business Owner, Abuja',
      content: 'I was skeptical about digital Ajo at first, but Ajopay\'s bank-grade security and transparent records gave me the peace of mind I needed. Highly recommended!',
      avatar: 'https://i.pravatar.cc/150?u=chidinma',
      rating: 5,
      accent: 'from-brand-emerald/10 to-emerald-50',
    },
    {
      name: 'Ibrahim K.',
      role: 'Civil Servant, Kano',
      content: 'The best part about Ajopay is the community. I joined a group of fellow professionals and we\'ve been saving consistently for over a year now.',
      avatar: 'https://i.pravatar.cc/150?u=ibrahim',
      rating: 5,
      accent: 'from-purple-500/10 to-purple-50',
    },
  ];

  return (
    <section id="testimonials" className="py-24 lg:py-32 bg-white relative overflow-hidden">
      {/* BG */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-brand-primary/[0.02] rounded-full blur-[100px] pointer-events-none" />

      <Container className="relative z-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/[0.08] border border-amber-500/15 mb-5">
              <Star size={12} className="text-amber-500 fill-amber-500" />
              <span className="text-[11px] font-bold text-amber-600 uppercase tracking-[0.1em]">Testimonials</span>
            </div>
            <h3 className="text-3xl sm:text-4xl font-bold text-brand-navy mb-4 tracking-tight">
              Loved by{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">thousands of savers</span>
            </h3>

            {/* Rating */}
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={18} className="fill-amber-400 text-amber-400" />
                ))}
              </div>
              <div className="h-4 w-px bg-slate-200" />
              <span className="text-[13px] font-bold text-brand-navy">4.9/5</span>
              <span className="text-[13px] text-brand-gray">on App Store & Play Store</span>
            </div>
          </motion.div>
        </div>

        {/* Testimonial Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative group"
            >
              <div className={`rounded-2xl border border-slate-100 bg-gradient-to-b ${t.accent} p-7 h-full flex flex-col hover:shadow-xl hover:shadow-slate-900/[0.06] hover:-translate-y-1 transition-all duration-300`}>
                {/* Quote icon */}
                <div className="mb-5">
                  <Quote size={24} className="text-brand-primary/20" />
                </div>

                {/* Content */}
                <p className="text-[14px] text-brand-navy leading-relaxed mb-6 flex-1">
                  "{t.content}"
                </p>

                {/* Stars */}
                <div className="flex items-center gap-0.5 mb-4">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} size={14} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>

                {/* Author */}
                <div className="flex items-center gap-3 pt-4 border-t border-slate-100/80">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover"
                  />
                  <div>
                    <h4 className="text-[13px] font-bold text-brand-navy">{t.name}</h4>
                    <p className="text-[11px] text-brand-gray">{t.role}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Partners */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20"
        >
          <p className="text-center text-[11px] font-bold text-brand-gray/60 uppercase tracking-[0.15em] mb-8">Payments Powered By</p>
          <div className="flex flex-wrap justify-center items-center gap-8">

            {/* Paystack Badge */}
            <div className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-300">
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" rx="8" fill="#00C3F7" />
                <path d="M6 10.5h20M6 16h16M6 21.5h12" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              <span className="text-[18px] font-black text-slate-800 tracking-tight">Paystack</span>
            </div>

            {/* Visa Badge */}
            <div className="flex items-center justify-center px-6 py-3.5 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-300">
              <svg width="72" height="24" viewBox="0 0 38 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14.739 0.504L9.816 12.496H6.508L4.081 2.953C3.936 2.376 3.812 2.163 3.362 1.918C2.632 1.519 1.426 1.145 0.363 0.908L0.435 0.504H5.654C6.333 0.504 6.943 0.956 7.102 1.74L8.383 8.558L11.449 0.504H14.739ZM27.367 8.469C27.381 5.244 22.989 5.063 23.018 3.617C23.027 3.175 23.448 2.705 24.367 2.581C24.822 2.519 26.08 2.47 27.508 3.142L28.073 0.766C27.311 0.489 26.326 0.222 25.099 0.222C22.001 0.222 19.808 1.875 19.79 4.264C19.771 6.024 21.354 7.002 22.547 7.583C23.774 8.178 24.183 8.561 24.178 9.094C24.169 9.911 23.2 10.27 22.293 10.285C20.683 10.311 19.72 9.843 18.953 9.489L18.37 11.945C19.14 12.296 20.569 12.601 22.049 12.619C25.341 12.619 27.357 10.986 27.367 8.469ZM35.675 12.496H38.563L36.038 0.504H33.357C32.755 0.504 32.245 0.851 32.021 1.387L27.36 12.496H30.65L31.319 10.629H35.327L35.675 12.496ZM32.218 8.281L33.848 3.664L34.773 8.281H32.218ZM19.166 0.504L16.572 12.496H13.438L16.033 0.504H19.166Z" fill="#1434CB" />
              </svg>
            </div>

            {/* SSL Badge */}
            <div className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-300">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L4 5v6c0 4.418 3.358 8.563 8 9.93C16.642 19.563 20 15.418 20 11V5l-8-3z" fill="#10b981" fillOpacity="0.15" stroke="#10b981" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M9 12l2 2 4-4" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-[14px] font-bold text-slate-700">256-bit SSL</span>
            </div>

          </div>
        </motion.div>
      </Container>
    </section>
  );
};
