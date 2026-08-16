import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, MessageCircle, ExternalLink } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

// ── Contact info ──────────────────────────────────────────────────────────────

const EMAIL = 'levanmek@gmail.com';
const PINTEREST_URL = 'https://www.pinterest.com/levanmekhuzla';
const INSTAGRAM_URL = 'https://www.instagram.com/levan.me/';

const WHATSAPP_URLS = {
  ka: `https://wa.me/995577798789?text=${encodeURIComponent('გამარჯობა, დაინტერესებული ვარ ნამუშევრის შეძენით / დეტალების დაზუსტებით.')}`,
  en: `https://wa.me/995577798789?text=${encodeURIComponent('Hello! I am interested in purchasing an artwork / inquiring about your work')}`,
};

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="12" height="12" aria-hidden="true">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
  </svg>
);

// ── Helpers ───────────────────────────────────────────────────────────────────

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const, delay },
});

// ── Component ─────────────────────────────────────────────────────────────────

export const Contact: React.FC = () => {
  const { t, language } = useLanguage();

  const contactDetails = [
    {
      icon: MapPin,
      labelKey: 'contact.address.label' as const,
      valueKey: 'contact.address.value' as const,
      href: 'https://maps.google.com/?q=8+Ilo+Mosashvili+St,+Tbilisi,+Georgia',
    },
    {
      icon: Phone,
      labelKey: 'contact.phone.label' as const,
      value: '+995 577 798 789',
      href: 'tel:+995577798789',
    },
    {
      icon: Mail,
      labelKey: 'contact.email.label' as const,
      value: EMAIL,
      href: `mailto:${EMAIL}`,
    },
    {
      icon: MessageCircle,
      labelKey: 'contact.whatsapp.label' as const,
      value: '+995 577 798 789',
      href: WHATSAPP_URLS[language],
    },
  ];

  const socials = [
    { label: 'Pinterest', href: PINTEREST_URL, icon: ExternalLink },
    { label: 'Instagram', href: INSTAGRAM_URL, icon: InstagramIcon },
  ];

  return (
    <div className="min-h-screen pt-28 pb-24">
      {/* Page heading */}
      <div className="container mx-auto px-6 md:px-12 mb-14 md:mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-end gap-6"
        >
          <span className="hidden md:block h-px flex-1 bg-border/50" />
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium tracking-wide text-foreground">
            {t('contact.title')}
          </h1>
          <span className="h-px flex-[3] bg-border/50" />
        </motion.div>

        <motion.p
          {...fadeUp(0.2)}
          className="mt-6 max-w-xl text-base text-foreground/60 leading-relaxed md:ml-auto"
        >
          {t('contact.subtitle')}
        </motion.p>
      </div>

      {/* Contact details */}
      <div className="container mx-auto px-6 md:px-12">
        <div className="flex flex-col gap-8 max-w-md">
          {contactDetails.map(({ icon: Icon, labelKey, value, valueKey, href }, i) => {
            const displayValue = valueKey ? t(valueKey) : value!;
            return (
              <motion.div
                key={labelKey}
                {...fadeUp(0.1 + i * 0.08)}
                className="flex gap-4 items-start group"
              >
                <span className="mt-0.5 p-2 border border-border/40 text-primary group-hover:border-primary transition-colors duration-300 flex-shrink-0">
                  <Icon size={16} strokeWidth={1.5} />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-widest text-foreground/40 mb-1">
                    {t(labelKey)}
                  </p>
                  {href ? (
                    <a
                      href={href}
                      target={href.startsWith('http') ? '_blank' : undefined}
                      rel="noopener noreferrer"
                      className="text-sm text-foreground/80 hover:text-primary transition-colors duration-200 leading-relaxed"
                    >
                      {displayValue}
                    </a>
                  ) : (
                    <p className="text-sm text-foreground/80 leading-relaxed">{displayValue}</p>
                  )}
                </div>
              </motion.div>
            );
          })}

          {/* Socials */}
          <motion.div {...fadeUp(0.45)} className="flex gap-4 mt-2">
            {socials.map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs uppercase tracking-widest text-foreground/50 hover:text-primary transition-colors duration-200 border border-border/40 hover:border-primary px-4 py-2"
              >
                <Icon size={12} strokeWidth={1.5} />
                {label}
              </a>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
};
