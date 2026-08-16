import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Menu, X, Lock } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { AnimatePresence, motion } from 'framer-motion';

const WHATSAPP_URLS = {
  ka: `https://wa.me/995577798789?text=${encodeURIComponent('გამარჯობა, დაინტერესებული ვარ ნამუშევრის შეძენით / დეტალების დაზუსტებით.')}`,
  en: `https://wa.me/995577798789?text=${encodeURIComponent('Hello! I am interested in purchasing an artwork / inquiring about your work')}`,
};

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t, language, setLanguage } = useLanguage();
  const [location] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ka' : 'en');
  };

  const navLinks = [
    { href: '/', label: t('nav.gallery') },
    { href: '/biography', label: t('nav.biography') },
    { href: '/exhibitions', label: t('nav.exhibitions') },
    { href: '/archive', label: t('nav.archive') },
    { href: '/contact', label: t('nav.contact') },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col w-full bg-background text-foreground transition-colors duration-300 overflow-x-hidden">
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b ${
          scrolled
            ? 'bg-background/90 backdrop-blur-md border-border/50 py-4'
            : 'bg-transparent border-transparent py-6'
        }`}
      >
        <div className="container mx-auto px-6 md:px-12 flex items-center justify-between">
          <Link href="/" className="z-50 outline-none">
            <h1 className="font-serif text-2xl md:text-3xl font-medium tracking-wide hover:text-primary transition-colors">
              Levan Mekhuzla
            </h1>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                data-testid={`link-${link.href.replace('/', '') || 'home'}`}
                className={`text-sm tracking-widest uppercase transition-colors hover:text-primary ${
                  location === link.href ? 'text-primary font-medium' : 'text-foreground/80'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="h-4 w-[1px] bg-border mx-2"></div>
            <button
              onClick={toggleLanguage}
              data-testid="button-lang-toggle"
              className="text-xs uppercase tracking-widest font-medium hover:text-primary transition-colors px-2 py-1 rounded-sm hover:bg-muted/50"
            >
              {language === 'en' ? 'KA' : 'EN'}
            </button>
            <Link
              href="/admin"
              title="Admin"
              className="p-1.5 text-foreground/40 hover:text-primary transition-colors"
              aria-label="Admin panel"
            >
              <Lock size={15} strokeWidth={1.5} />
            </Link>
          </nav>

          {/* Mobile Toggle */}
          <div className="flex items-center gap-3 md:hidden z-50">
            <button
              onClick={toggleLanguage}
              data-testid="button-lang-toggle-mobile"
              className="text-xs uppercase tracking-widest font-medium"
            >
              {language === 'en' ? 'KA' : 'EN'}
            </button>
            <Link
              href="/admin"
              title="Admin"
              className="p-1 text-foreground/40 hover:text-primary transition-colors"
              aria-label="Admin panel"
            >
              <Lock size={15} strokeWidth={1.5} />
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-hamburger"
              className="p-2 -mr-2 text-foreground"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={24} strokeWidth={1.5} /> : <Menu size={24} strokeWidth={1.5} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed inset-0 z-40 bg-background/95 backdrop-blur-lg pt-24 px-6 pb-6 flex flex-col"
          >
            <nav className="flex flex-col gap-6 mt-12">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-2xl font-serif tracking-wider ${
                    location === link.href ? 'text-primary' : 'text-foreground'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 w-full flex flex-col">{children}</main>

      <footer className="py-12 border-t border-border mt-auto">
        <div className="container mx-auto px-6 text-center text-sm text-foreground/50">
          <p>&copy; {new Date().getFullYear()} Levan Mekhuzla. All rights reserved.</p>
        </div>
      </footer>

      {/* ── Floating WhatsApp button ── */}
      <a
        href={WHATSAPP_URLS[language]}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contact on WhatsApp"
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-12 h-12 bg-[#1a2e1a] border border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366] hover:text-background hover:border-[#25D366] transition-all duration-300 shadow-lg hover:shadow-[#25D366]/20 hover:shadow-xl"
      >
        <WhatsAppIcon />
      </a>
    </div>
  );
};
