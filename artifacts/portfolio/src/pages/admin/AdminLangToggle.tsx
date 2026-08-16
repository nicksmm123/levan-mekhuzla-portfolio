/**
 * Small EN / KA toggle for the admin panel top bar.
 * Reads from and writes to the admin-scoped LanguageProvider.
 */
import React from 'react';
import { useLanguage } from '@/i18n/LanguageContext';

export function AdminLangToggle({ className = '' }: { className?: string }) {
  const { language, setLanguage } = useLanguage();

  return (
    <div className={`flex items-center gap-0.5 border border-border rounded-sm overflow-hidden text-[11px] uppercase tracking-widest font-medium ${className}`}>
      <button
        onClick={() => setLanguage('en')}
        className={`px-2.5 py-1.5 transition-colors ${
          language === 'en'
            ? 'bg-primary text-primary-foreground'
            : 'text-foreground/50 hover:text-foreground'
        }`}
        aria-pressed={language === 'en'}
      >
        EN
      </button>
      <button
        onClick={() => setLanguage('ka')}
        className={`px-2.5 py-1.5 transition-colors ${
          language === 'ka'
            ? 'bg-primary text-primary-foreground'
            : 'text-foreground/50 hover:text-foreground'
        }`}
        aria-pressed={language === 'ka'}
      >
        KA
      </button>
    </div>
  );
}
