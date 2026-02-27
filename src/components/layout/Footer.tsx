import { Container } from '../ui/Container';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    {
      title: 'Product',
      links: [
        { name: 'How it Works', href: '#how-it-works' },
        { name: 'Features', href: '#features' },
        { name: 'Security', href: '#security' },
        { name: 'Pricing', href: '#' },
      ],
    },
    {
      title: 'Company',
      links: [
        { name: 'About Us', href: '#' },
        { name: 'Careers', href: '#' },
        { name: 'Blog', href: '#' },
        { name: 'Contact', href: '#' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { name: 'Privacy Policy', href: '#' },
        { name: 'Terms of Service', href: '#' },
        { name: 'Cookie Policy', href: '#' },
      ],
    },
  ];

  return (
    <footer className="bg-brand-navy relative overflow-hidden">
      {/* Subtle top gradient line */}
      <div className="h-px bg-gradient-to-r from-transparent via-brand-emerald/30 to-transparent" />

      {/* Newsletter Section */}
      <div className="border-b border-white/[0.06]">
        <Container className="py-14 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left">
            <h4 className="text-lg font-bold text-white mb-1">Stay in the loop</h4>
            <p className="text-[13px] text-slate-400">Get savings tips, product updates, and Ajo insights delivered to your inbox.</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 md:w-72 px-4 py-3 rounded-xl bg-white/[0.06] border border-white/[0.08] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-emerald/40 focus:ring-1 focus:ring-brand-emerald/20 transition-all"
            />
            <button className="px-5 py-3 bg-brand-emerald text-white rounded-xl font-bold text-sm hover:bg-emerald-600 transition-colors shadow-lg shadow-brand-emerald/20 flex items-center gap-1.5 flex-shrink-0">
              Subscribe
              <ArrowRight size={14} />
            </button>
          </div>
        </Container>
      </div>

      {/* Main Footer */}
      <Container className="py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 lg:gap-16">
          {/* Brand Column */}
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 bg-gradient-to-br from-brand-emerald to-emerald-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-base">A</span>
              </div>
              <span className="text-lg font-bold text-white tracking-tight">Ajopay</span>
            </Link>
            <p className="text-[13px] text-slate-400 max-w-xs mb-6 leading-relaxed">
              The modern digital platform for rotating savings groups. Secure, transparent, and community-driven.
            </p>
            {/* Social Icons */}
            <div className="flex gap-3">
              {[
                { label: 'X', path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' },
                { label: 'Instagram', path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z' },
                { label: 'LinkedIn', path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' },
              ].map((social) => (
                <a
                  key={social.label}
                  href="#"
                  className="w-9 h-9 bg-white/[0.06] rounded-lg flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-all"
                  aria-label={social.label}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d={social.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {footerLinks.map((group) => (
            <div key={group.title}>
              <h4 className="text-[12px] font-bold text-white uppercase tracking-[0.1em] mb-5">{group.title}</h4>
              <ul className="space-y-3">
                {group.links.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-[13px] text-slate-400 hover:text-white transition-colors"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Container>

      {/* Bottom Bar */}
      <div className="border-t border-white/[0.06]">
        <Container className="py-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[11px] text-slate-500">
            © {currentYear} Ajopay Technologies Limited. All rights reserved.
          </p>

          {/* Trust Badges */}
          <div className="flex items-center gap-3 flex-wrap justify-center">
            {/* Paystack */}
            <div className="flex items-center gap-1.5 bg-white/[0.05] border border-white/[0.07] rounded-md px-2.5 py-1.5">
              <svg width="14" height="14" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" rx="6" fill="#00C3F7" />
                <path d="M7 11.5h18M7 16h14M7 20.5h10" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              <span className="text-[11px] font-semibold text-slate-300">Paystack</span>
            </div>
            {/* Visa */}
            <div className="flex items-center justify-center bg-white rounded-md px-2.5 py-1.5 h-7">
              <svg width="30" height="10" viewBox="0 0 38 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14.739 0.504L9.816 12.496H6.508L4.081 2.953C3.936 2.376 3.812 2.163 3.362 1.918C2.632 1.519 1.426 1.145 0.363 0.908L0.435 0.504H5.654C6.333 0.504 6.943 0.956 7.102 1.74L8.383 8.558L11.449 0.504H14.739ZM27.367 8.469C27.381 5.244 22.989 5.063 23.018 3.617C23.027 3.175 23.448 2.705 24.367 2.581C24.822 2.519 26.08 2.47 27.508 3.142L28.073 0.766C27.311 0.489 26.326 0.222 25.099 0.222C22.001 0.222 19.808 1.875 19.79 4.264C19.771 6.024 21.354 7.002 22.547 7.583C23.774 8.178 24.183 8.561 24.178 9.094C24.169 9.911 23.2 10.27 22.293 10.285C20.683 10.311 19.72 9.843 18.953 9.489L18.37 11.945C19.14 12.296 20.569 12.601 22.049 12.619C25.341 12.619 27.357 10.986 27.367 8.469ZM35.675 12.496H38.563L36.038 0.504H33.357C32.755 0.504 32.245 0.851 32.021 1.387L27.36 12.496H30.65L31.319 10.629H35.327L35.675 12.496ZM32.218 8.281L33.848 3.664L34.773 8.281H32.218ZM19.166 0.504L16.572 12.496H13.438L16.033 0.504H19.166Z" fill="#1434CB" />
              </svg>
            </div>
            <span className="text-[11px] text-slate-500">· Secured with 256-bit SSL</span>
          </div>

          <p className="text-[11px] text-slate-500 text-center md:text-right max-w-xs">
            Ajopay is a fintech platform. Payments processed securely via Paystack.
          </p>
        </Container>
      </div>
    </footer>
  );
};
