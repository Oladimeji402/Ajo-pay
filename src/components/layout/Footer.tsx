import { Container } from '../ui/Container';
import { Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-brand-navy pt-20 pb-10">
      <Container>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-16">
          <div className="col-span-2 lg:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <img src="/logo.png" alt="Ajopay Logo" className="h-12 w-auto brightness-0 invert" />
            </div>
            <p className="text-brand-footer-text text-sm max-w-xs mb-8 leading-relaxed">
              The modern digital platform for rotating savings groups. Secure, transparent, and community-driven.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-brand-footer-text hover:text-white transition-colors"><Facebook size={20} /></a>
              <a href="#" className="text-brand-footer-text hover:text-white transition-colors"><Twitter size={20} /></a>
              <a href="#" className="text-brand-footer-text hover:text-white transition-colors"><Instagram size={20} /></a>
              <a href="#" className="text-brand-footer-text hover:text-white transition-colors"><Linkedin size={20} /></a>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-white mb-6">Product</h4>
            <ul className="space-y-4 text-sm text-brand-footer-text">
              <li><a href="#" className="hover:text-white transition-colors">How it Works</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-6">Company</h4>
            <ul className="space-y-4 text-sm text-brand-footer-text">
              <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-6">Legal</h4>
            <ul className="space-y-4 text-sm text-brand-footer-text">
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-brand-footer-text">
            © {currentYear} Ajopay Technologies Limited. All rights reserved.
          </p>
          <p className="text-xs text-brand-footer-text">
            Ajopay is a financial technology company, not a bank. Banking services are provided by our NDIC-insured partner banks.
          </p>
        </div>
      </Container>
    </footer>
  );
};
