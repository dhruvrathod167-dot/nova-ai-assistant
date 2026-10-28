'use client';

import {
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { useUIStore } from '@/stores/ui-store';
import { useHydrated } from '@/hooks/use-hydrated';
import {
  Search,
  User,
  Menu,
  X,
  Settings,
  History,
  Sparkles,
} from 'lucide-react';

/* ================================================================ */
/*  Types                                                            */
/* ================================================================ */

interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

/* ================================================================ */
/*  Navigation Data — AI-Focused Structure                           */
/* ================================================================ */

const ANNOUNCEMENTS = [
  'Welcome to NOVA AI - Your Advanced AI Assistant',
  'New features: Enhanced reasoning capabilities',
  'Try our latest AI models for improved accuracy',
  'Join thousands of users leveraging NOVA AI daily',
];

const NAV_LINKS: NavItem[] = [
  {
    label: 'NOVA AI',
    href: '/',
    icon: <Sparkles className="h-4 w-4" />,
  },
  {
    label: 'Chat',
    href: '/chat',
    icon: <Sparkles className="h-4 w-4" />,
  },
  {
    label: 'New Chat',
    href: '/chat/new',
    icon: <Sparkles className="h-4 w-4" />,
  },
  {
    label: 'History',
    href: '/chat/history',
    icon: <History className="h-4 w-4" />,
  },
  {
    label: 'AI Tools',
    href: '/tools',
    icon: <Sparkles className="h-4 w-4" />,
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: <Settings className="h-4 w-4" />,
  },
];

/* ================================================================ */
/*  Animation Easing & Variants                                      */
/* ================================================================ */

const EASE = [0.22, 1, 0.36, 1] as const;

const announceVariants = {
  enter: (d: number) => ({ y: d > 0 ? 12 : -12, opacity: 0 }),
  center: { y: 0, opacity: 1, transition: { duration: 0.5, ease: EASE } },
  exit: (d: number) => ({ y: d < 0 ? 12 : -12, opacity: 0, transition: { duration: 0.3, ease: EASE } }),
};

const mobileVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5, ease: EASE } },
  exit: { opacity: 0, transition: { duration: 0.3, ease: EASE } },
};

const mobileLinkVars = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: 0.18 + i * 0.06, duration: 0.6, ease: EASE } }),
  exit: { opacity: 0, y: 20, transition: { duration: 0.2 } },
};

/* ================================================================ */
/*  Announcement Bar                                                 */
/* ================================================================ */

function AnnouncementBar({ onDismiss }: { onDismiss: () => void }) {
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState(1);

  useEffect(() => {
    const id = setInterval(() => { setDir(1); setIdx((p) => (p + 1) % ANNOUNCEMENTS.length); }, 4500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative z-[52] h-8 bg-[#4F46E5] flex items-center justify-center overflow-hidden">
      <AnimatePresence mode="wait" custom={dir}>
        <motion.p
          key={idx} custom={dir} variants={announceVariants}
          initial="enter" animate="center" exit="exit"
          className="font-['Inter'] text-[10px] uppercase tracking-[0.22em] text-white/90"
        >
          {ANNOUNCEMENTS[idx]}
        </motion.p>
      </AnimatePresence>
      <button
        onClick={onDismiss} aria-label="Dismiss"
        className="absolute right-5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors duration-300"
      >
        <X className="h-3 w-3" strokeWidth={1.5} />
      </button>
    </div>
  );
}

/* ================================================================ */
/*  Mobile Menu — AI-Focused Design                                  */
/* ================================================================ */

function MobileMenu({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={mobileVariants} initial="hidden" animate="visible" exit="exit"
          className="fixed inset-0 z-[60] bg-white flex flex-col"
        >
          {/* Indigo accent line */}
          <div className="h-px bg-[#4F46E5]/40" />

          {/* Close */}
          <div className="flex justify-end px-6 py-5">
            <button onClick={onClose} aria-label="Close menu"
              className="text-[#0A0A0A]/40 hover:text-[#0A0A0A] transition-colors duration-300"
            >
              <X className="h-6 w-6" strokeWidth={1.5} />
            </button>
          </div>

          {/* Links */}
          <nav className="flex-1 flex flex-col items-center justify-center px-6">
            <ul className="flex flex-col items-center gap-4">
              {NAV_LINKS.map((link, i) => (
                <motion.li key={link.label} custom={i} variants={mobileLinkVars} initial="hidden" animate="visible" exit="exit">
                  <a href={link.href} onClick={onClose}
                    className="font-['Inter'] text-[36px] md:text-[42px] font-light text-[#0A0A0A]/85 hover:text-[#4F46E5] transition-colors duration-300 flex items-center gap-3"
                  >
                    {link.icon}
                    {link.label}
                  </a>
                </motion.li>
              ))}
            </ul>
          </nav>

          {/* Bottom */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7, duration: 0.5 }}
            className="pb-14 flex flex-col items-center gap-5"
          >
            <div className="flex items-center gap-7 font-['Inter'] text-[11px] uppercase tracking-[0.2em] text-[#0A0A0A]/30">
              <a href="#" onClick={onClose} className="hover:text-[#4F46E5] transition-colors duration-300">Account</a>
              <span className="text-[#4F46E5]/20 select-none">·</span>
              <a href="#" onClick={onClose} className="hover:text-[#4F46E5] transition-colors duration-300">Help</a>
              <span className="text-[#4F46E5]/20 select-none">·</span>
              <a href="#" onClick={onClose} className="hover:text-[#4F46E5] transition-colors duration-300">Contact</a>
            </div>
            <div className="h-px w-10 bg-[#4F46E5]/25" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ================================================================ */
/*  Main Navbar — AI-Focused Design                                   */
/* ================================================================ */

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [annDismissed, setAnnDismissed] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { scrollY } = useScroll();

  const hydrated = useHydrated();
  const openSearch = useUIStore((s) => s.openSearch);
  const mobileOpen = useUIStore((s) => s.mobileMenuOpen);
  const openMobile = useUIStore((s) => s.openMobileMenu);
  const closeMobile = useUIStore((s) => s.closeMobileMenu);

  const dark = !scrolled;

  /* ---- Announcement persistence ---- */
  useEffect(() => {
    if (localStorage.getItem('nova-ai-ann-dismissed') === '1') setAnnDismissed(true);
  }, []);
  const dismissAnn = useCallback(() => { setAnnDismissed(true); localStorage.setItem('nova-ai-ann-dismissed', '1'); }, []);

  /* ---- Scroll ---- */
  useMotionValueEvent(scrollY, 'change', (v) => setScrolled(v > 50));

  /* ---- Body scroll lock ---- */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const topOffset = annDismissed ? 0 : 32;

  /* Color classes based on scroll state */
  const iconCls = dark ? 'text-white/75 hover:text-white' : 'text-[#0A0A0A]/60 hover:text-[#0A0A0A]';

  return (
    <>
      {/* Announcement Bar */}
      {!annDismissed && <AnnouncementBar onDismiss={dismissAnn} />}

      {/* Main Header */}
      <motion.header
        className="fixed left-0 right-0 z-50"
        initial={false}
        animate={{
          backgroundColor: scrolled ? 'rgba(255,255,255,0.92)' : 'rgba(10,10,10,0)',
          backdropFilter: scrolled ? 'blur(24px) saturate(1.5)' : 'blur(0px)',
        }}
        transition={{ duration: 0.5, ease: EASE }}
        style={{ top: topOffset, WebkitBackdropFilter: scrolled ? 'blur(24px) saturate(1.5)' : 'blur(0px)' }}
      >
        {/* Bottom border */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-px"
          initial={{ opacity: 0 }}
          animate={{
            opacity: scrolled ? 1 : 0,
            background: scrolled
              ? 'linear-gradient(to right, transparent, rgba(0,0,0,0.06), transparent)'
              : 'linear-gradient(to right, transparent, rgba(255,255,255,0.06), transparent)',
          }}
          transition={{ duration: 0.5, ease: EASE }}
        />

        <nav className="mx-auto flex h-16 md:h-[72px] max-w-[1400px] items-center justify-between px-5 md:px-10 lg:px-12">

          {/* Left: Hamburger + Nav Links */}
          <div className="flex items-center">
            <button className={`md:hidden p-2 -ml-2 transition-colors duration-300 ${iconCls}`}
              onClick={openMobile} aria-label="Open menu"
            >
              <Menu className="h-[18px] w-[18px]" strokeWidth={1.5} />
            </button>

            <ul className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className={`group relative px-3.5 py-2 ${iconCls.replace('hover:text-', 'hover:text-white')}`}
                  >
                    <span className="relative z-10 font-['Inter'] text-[11.5px] uppercase tracking-[0.12em] transition-colors duration-300 flex items-center gap-2">
                      {link.icon}
                      {link.label}
                    </span>
                    <motion.span
                      className="absolute bottom-1 left-3.5 right-3.5 h-[1.5px] bg-[#4F46E5] origin-left"
                      initial={false}
                      animate={{ scaleX: false ? 1 : 0 }}
                      transition={{ duration: 0.4, ease: EASE }}
                    />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Center: Logo */}
          <a href="/" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none z-10">
            <motion.span
              className={`font-['Playfair_Display'] text-[26px] md:text-[28px] font-semibold tracking-[0.08em] inline-block origin-center transition-colors duration-500 ${dark ? 'text-[#4F46E5]' : 'text-[#0A0A0A]'}`}
              whileHover={{ letterSpacing: '0.22em' }}
              transition={{ duration: 0.5, ease: EASE }}
            >
              NOVA AI
            </motion.span>
          </a>

          {/* Right: Action Icons */}
          <div className="flex items-center gap-0.5 md:gap-1">
            <button className={`relative z-10 p-2.5 transition-colors duration-300 ${iconCls}`}
              onClick={openSearch} aria-label="Search"
            >
              <Search className="h-[18px] w-[18px]" strokeWidth={1.5} />
            </button>
            <button className={`hidden md:block relative z-10 p-2.5 transition-colors duration-300 ${iconCls}`}
              aria-label="Account"
            >
              <User className="h-[18px] w-[18px]" strokeWidth={1.5} />
            </button>
          </div>
        </nav>
      </motion.header>

      {/* Mobile Menu */}
      <MobileMenu isOpen={mobileOpen} onClose={closeMobile} />
    </>
  );
}