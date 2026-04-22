import { Container } from '../ui/Container';
import { BrandLogo } from '../ui/BrandLogo';

export const Footer = () => {
    const currentYear = new Date().getFullYear();

    const footerLinks = [
        {
            title: 'Product',
            links: [
                { name: 'How it Works', href: '#how-it-works' },
                { name: 'Features', href: '#features' },
                { name: 'Security', href: '#security' },
            ],
        },
        {
            title: 'Company',
            links: [
                { name: 'About', href: '#' },
                { name: 'Blog', href: '#' },
                { name: 'Contact', href: '#' },
            ],
        },
        {
            title: 'Legal',
            links: [
                { name: 'Privacy Policy', href: '#' },
                { name: 'Terms of Service', href: '#' },
            ],
        },
    ];

    return (
        <footer className="bg-brand-navy relative overflow-hidden">
            <div className="h-px bg-gradient-to-r from-transparent via-brand-accent/20 to-transparent" />

            {/* Main Footer */}
            <Container className="py-14">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 lg:gap-16">
                    {/* Brand Column */}
                    <div className="col-span-2">
                        <BrandLogo size="sm" className="mb-5" />
                        <p className="text-[13px] text-slate-400 max-w-xs mb-6 leading-relaxed">
                            The modern digital platform for rotating savings groups. Secure, transparent, community-driven.
                        </p>
                        {/* Social Icons */}
                        <div className="flex gap-2.5">
                            {[
                                { label: 'X', path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' },
                                { label: 'Instagram', path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z' },
                                { label: 'LinkedIn', path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' },
                            ].map((social) => (
                                <a
                                    key={social.label}
                                    href="#"
                                    className="w-9 h-9 bg-white/[0.05] rounded-lg flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-all"
                                    aria-label={social.label}
                                >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                                        <path d={social.path} />
                                    </svg>
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Link Columns */}
                    {footerLinks.map((group) => (
                        <div key={group.title}>
                            <h4 className="text-[11px] font-bold text-white/50 uppercase tracking-[0.12em] mb-4">{group.title}</h4>
                            <ul className="space-y-2.5">
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
                <Container className="py-5 flex flex-col md:flex-row justify-between items-center gap-3">
                    <p className="text-[11px] text-slate-600">
                        © {currentYear} Subtech Ajo Solution Technologies. All rights reserved.
                    </p>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.06] rounded-md px-2.5 py-1.5">
                            <svg width="13" height="13" viewBox="0 0 32 32" fill="none">
                                <rect width="32" height="32" rx="6" fill="#00C3F7" />
                                <path d="M7 11.5h18M7 16h14M7 20.5h10" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                            </svg>
                            <span className="text-[11px] font-medium text-slate-400">Paystack</span>
                        </div>
                        <span className="text-[11px] text-slate-600">· 256-bit SSL secured</span>
                    </div>
                </Container>
            </div>
        </footer>
    );
};
