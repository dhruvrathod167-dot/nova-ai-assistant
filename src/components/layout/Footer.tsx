'use client';

import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Instagram, Twitter, Facebook, Youtube, MapPin, Phone, Mail, ArrowRight } from 'lucide-react';

const footerLinks = {
  'Product': ['Features', 'Pricing', 'Integrations', 'API', 'Documentation', 'Roadmap'],
  'Company': ['About Us', 'Careers', 'Press', 'Blog', 'Contact', 'Partners'],
  'Support': ['Help Center', 'Community', 'Status', 'Security', 'Privacy Policy', 'Terms of Service'],
  'Resources': ['API Documentation', 'Developer Guide', 'Tutorials', 'Blog', 'Research', 'Changelog'],
};

const socialLinks = [
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Youtube, href: '#', label: 'YouTube' },
];

export default function Footer() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <footer ref={ref} className="bg-[#0A0A0A] text-white">
      {/* Newsletter Bar */}
      <div className="border-t border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <p className="font-['Playfair_Display'] text-2xl mb-1">Stay Updated</p>
            <p className="text-white/50 text-sm">Get the latest AI news and product updates</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex w-full md:w-auto"
          >
            <input
              type="email"
              placeholder="Enter your email"
              className="bg-white/5 border border-white/10 px-5 py-3 text-sm flex-1 md:w-72 focus:outline-none focus:border-[#C9A96E]/50 transition-colors placeholder:text-white/30"
            />
            <button className="bg-[#6366f1] text-white px-6 py-3 text-xs uppercase tracking-widest font-medium hover:bg-[#818cf8] transition-colors">
              Subscribe
            </button>
          </motion.div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-10 lg:gap-8">
          {/* Brand Column */}
          <div className="col-span-2">
            <h2 className="font-['Playfair_Display'] text-3xl text-[#6366f1] mb-4">NOVA AI</h2>
            <p className="text-white/50 text-sm leading-relaxed mb-6 max-w-xs">
              Advanced AI chat workspace for productivity and creativity. Experience the future of artificial intelligence.
            </p>
            <div className="space-y-3 text-sm text-white/50">
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-[#6366f1]" />
                <span>8 Rue du Faubourg Saint-Honoré, Paris</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-[#6366f1]" />
                <span>+33 1 40 20 80 80</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-[#6366f1]" />
                <span>support@novaai.com</span>
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/50 hover:text-[#6366f1] hover:border-[#6366f1]/30 transition-all duration-300"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-xs uppercase tracking-[0.2em] text-[#6366f1] mb-5 font-medium">{title}</h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <Link
                      href="#"
                      className="text-sm text-white/50 hover:text-white transition-colors duration-300 flex items-center gap-1 group"
                    >
                      {link}
                      <ArrowRight className="w-3 h-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Payment & Trust */}
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6 text-white/30 text-xs">
            <span>We accept</span>
            <div className="flex gap-3">
              {['Visa', 'Mastercard', 'Amex', 'Stripe', 'PayPal'].map((p) => (
                <span key={p} className="border border-white/10 rounded px-2 py-1">{p}</span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-6 text-white/30 text-xs">
            <span>Free shipping on orders over $500</span>
            <span className="hidden md:inline">|</span>
            <span>30-day returns</span>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/30 text-xs">
            © {new Date().getFullYear()} NOVA AI. All rights reserved.
          </p>
          <div className="flex gap-6 text-white/30 text-xs">
            <Link href="#" className="hover:text-white/60 transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-white/60 transition-colors">Terms</Link>
            <Link href="#" className="hover:text-white/60 transition-colors">Cookies</Link>
            <Link href="#" className="hover:text-white/60 transition-colors">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
