import React, { useState } from 'react';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { useAdminAuth } from '@/lib/adminAuth';
import { supabaseConfigured } from '@/lib/supabase';
import { useLanguage } from '@/i18n/LanguageContext';
import { AdminLangToggle } from './AdminLangToggle';

export function AdminLogin() {
  const { signIn } = useAdminAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!supabaseConfigured) {
      setError(t('admin.supabase-warning'));
      return;
    }

    setLoading(true);
    const normalizedEmail = email.trim().toLowerCase();
    const err = await signIn(normalizedEmail, password);
    if (err) {
      if (
        err.toLowerCase().includes('invalid login credentials') ||
        err.toLowerCase().includes('invalid_credentials')
      ) {
        setError(t('admin.error.invalid-credentials'));
      } else if (err.toLowerCase().includes('email not confirmed')) {
        setError(t('admin.error.email-not-confirmed'));
      } else {
        setError(err);
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4">
        <a
          href={import.meta.env.BASE_URL}
          className="flex items-center gap-2 text-xs uppercase tracking-widest text-foreground/50 hover:text-foreground transition-colors"
        >
          <ArrowLeft size={13} strokeWidth={1.5} />
          {t('admin.back-to-site')}
        </a>
        <AdminLangToggle />
      </div>

      {/* Login form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-10 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-foreground/50 mb-3">
              {t('admin.title')}
            </p>
            <h1 className="font-serif text-3xl text-foreground">{t('admin.sign-in')}</h1>
          </div>

          {!supabaseConfigured && (
            <div className="mb-6 flex items-start gap-3 px-4 py-3 border border-amber-400/30 bg-amber-400/5 text-amber-400 text-xs">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{t('admin.supabase-warning')}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs uppercase tracking-widest text-foreground/60 mb-2">
                {t('admin.email')}
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full bg-card border border-border px-4 py-3 text-foreground text-sm focus:outline-none focus:border-primary transition-colors"
                placeholder="admin@example.com"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-foreground/60 mb-2">
                {t('admin.password')}
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full bg-card border border-border px-4 py-3 text-foreground text-sm focus:outline-none focus:border-primary transition-colors"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="flex items-start gap-3 text-sm text-red-400 border border-red-400/30 bg-red-400/5 px-4 py-3">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !supabaseConfigured}
              className="w-full py-3 bg-primary text-primary-foreground text-sm uppercase tracking-widest font-medium transition-opacity disabled:opacity-50 hover:opacity-90"
            >
              {loading ? t('admin.signing-in') : t('admin.sign-in')}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-foreground/30">{t('admin.footer')}</p>
        </div>
      </div>
    </div>
  );
}
