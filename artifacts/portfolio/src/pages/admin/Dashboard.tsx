import React, { useCallback, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, LogOut, Loader2, AlertCircle, ArrowLeft, Archive } from 'lucide-react';
import { useAdminAuth } from '@/lib/adminAuth';
import { useLanguage } from '@/i18n/LanguageContext';
import { AdminLangToggle } from './AdminLangToggle';
import {
  fetchArtworksDB,
  deleteArtwork,
  deleteArtworkImage,
  type ArtworkDB,
} from '@/lib/supabase';
import { ArtworkForm }  from './ArtworkForm';
import { ArchiveAdmin } from './ArchiveAdmin';

type Section     = 'artworks' | 'archive';
type ArtworkView = 'list' | 'new' | { edit: ArtworkDB };

export function AdminDashboard() {
  const { signOut } = useAdminAuth();
  const { t, language } = useLanguage();
  const qc = useQueryClient();

  const [section,  setSection]  = useState<Section>('artworks');
  const [view,     setView]     = useState<ArtworkView>('list');
  const [deleteTarget, setDeleteTarget] = useState<ArtworkDB | null>(null);
  const [deleteError,  setDeleteError]  = useState<string | null>(null);

  const { data: artworks = [], isLoading, error } = useQuery({
    queryKey: ['admin-artworks'],
    queryFn:  fetchArtworksDB,
    staleTime: 0,
  });

  const deleteMutation = useMutation({
    mutationFn: async (artwork: ArtworkDB) => {
      await deleteArtwork(artwork.id);
      await deleteArtworkImage(artwork.image_url);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-artworks'] });
      qc.invalidateQueries({ queryKey: ['artworks'] });
      setDeleteTarget(null);
      setDeleteError(null);
    },
    onError: (err: Error) => setDeleteError(err.message),
  });

  const handleSaved = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['admin-artworks'] });
    qc.invalidateQueries({ queryKey: ['artworks'] });
    setView('list');
  }, [qc]);

  const CATEGORY_LABELS: Record<NonNullable<ArtworkDB['category']>, string> = {
    'original-paintings':     t('admin.category.original-paintings'),
    'limited-edition-prints': t('admin.category.limited-edition-prints'),
    'graphic-works':          t('admin.category.graphic-works'),
  };

  // ── Full-screen form views (no shared chrome) ──────────────────────────────
  if (view === 'new')
    return <ArtworkForm onSaved={handleSaved} />;
  if (typeof view === 'object' && 'edit' in view)
    return <ArtworkForm existing={view.edit} onSaved={handleSaved} />;

  // ── Archive section (fully self-contained) ─────────────────────────────────
  if (section === 'archive') {
    return (
      <div className="min-h-screen bg-background text-foreground">
        {/* Shared header */}
        <header className="border-b border-border px-4 md:px-10 py-3 md:py-4 flex flex-wrap items-center justify-between gap-2 md:gap-4">
          <div className="min-w-0">
            <p className="text-[10px] md:text-xs uppercase tracking-[0.2em] md:tracking-[0.3em] text-foreground/50 mb-0.5">
              {t('admin.title')}
            </p>
            <h1 className="font-serif text-xl md:text-2xl truncate">
              {t('admin.archive.heading')}
            </h1>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <a
              href={import.meta.env.BASE_URL}
              className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-foreground/50 hover:text-foreground transition-colors p-2"
              title={t('admin.back-to-site')}
            >
              <ArrowLeft size={14} strokeWidth={1.5} />
              <span className="hidden sm:inline">{t('admin.back-to-site')}</span>
            </a>
            <AdminLangToggle />
            <button
              onClick={signOut}
              title={t('admin.dashboard.sign-out')}
              className="p-2 border border-border text-foreground/60 hover:text-foreground hover:border-foreground/50 transition-colors"
            >
              <LogOut size={16} strokeWidth={1.5} />
            </button>
          </div>
        </header>

        {/* Section tabs */}
        <SectionTabs section={section} onChange={setSection} language={language} t={t} />

        {/* Archive list/forms */}
        <ArchiveAdmin onBack={() => setSection('artworks')} />
      </div>
    );
  }

  // ── Artworks list view ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border px-4 md:px-10 py-3 md:py-4 flex flex-wrap items-center justify-between gap-2 md:gap-4">
        <div className="min-w-0">
          <p className="text-[10px] md:text-xs uppercase tracking-[0.2em] md:tracking-[0.3em] text-foreground/50 mb-0.5">
            {t('admin.title')}
          </p>
          <h1 className="font-serif text-xl md:text-2xl truncate">
            {t('admin.dashboard.heading')}
          </h1>
        </div>

        <div className="flex items-center gap-2 md:gap-3 flex-wrap">
          {/* Back to public site — icon only on mobile */}
          <a
            href={import.meta.env.BASE_URL}
            className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-foreground/50 hover:text-foreground transition-colors p-2 md:px-2 md:py-2"
            title={t('admin.back-to-site')}
          >
            <ArrowLeft size={14} strokeWidth={1.5} />
            <span className="hidden sm:inline">{t('admin.back-to-site')}</span>
          </a>

          <AdminLangToggle />

          {/* Add artwork */}
          <button
            onClick={() => setView('new')}
            className="flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 bg-primary text-primary-foreground text-xs uppercase tracking-widest font-medium hover:opacity-90 transition-opacity"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">{t('admin.dashboard.add')}</span>
            <span className="sm:hidden">Add</span>
          </button>

          {/* Sign out */}
          <button
            onClick={signOut}
            title={t('admin.dashboard.sign-out')}
            className="p-2 md:p-2.5 border border-border text-foreground/60 hover:text-foreground hover:border-foreground/50 transition-colors"
          >
            <LogOut size={16} strokeWidth={1.5} />
          </button>
        </div>
      </header>

      {/* Section tabs */}
      <SectionTabs section={section} onChange={setSection} language={language} t={t} />

      {/* Artworks content */}
      <main className="px-4 md:px-10 py-6 md:py-8 max-w-7xl mx-auto">
        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-24 gap-3 text-foreground/50">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">{t('admin.dashboard.loading')}</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 p-5 border border-red-400/30 bg-red-400/5 text-red-400 text-sm">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-medium mb-1">{t('admin.dashboard.load-error')}</p>
              <p className="text-xs opacity-80">{(error as Error).message}</p>
              <p className="text-xs opacity-60 mt-1">{t('admin.dashboard.load-error-hint')}</p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && artworks.length === 0 && (
          <div className="py-24 text-center text-foreground/40">
            <p className="font-serif text-2xl mb-4">{t('admin.dashboard.empty-title')}</p>
            <p className="text-sm mb-8">{t('admin.dashboard.empty-sub')}</p>
            <button
              onClick={() => setView('new')}
              className="px-6 py-3 bg-primary text-primary-foreground text-xs uppercase tracking-widest hover:opacity-90 transition-opacity"
            >
              {t('admin.dashboard.add')}
            </button>
          </div>
        )}

        {/* Artwork grid */}
        {artworks.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {artworks.map(artwork => (
              <article
                key={artwork.id}
                className="bg-card border border-border overflow-hidden group flex flex-col"
              >
                {/* Image */}
                <div className="aspect-square bg-black/20 overflow-hidden">
                  {artwork.image_url ? (
                    <img
                      src={artwork.image_url}
                      alt={artwork.title_en ?? ''}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-foreground/20 text-xs uppercase tracking-widest">
                      —
                    </div>
                  )}
                </div>

                {/* Metadata */}
                <div className="p-4 flex flex-col flex-1 gap-2">
                  <div>
                    <h3 className="font-serif text-base leading-tight text-foreground mb-0.5">
                      {artwork.title_en || artwork.title_ka || (
                        <span className="italic text-foreground/30">Untitled</span>
                      )}
                    </h3>
                    {artwork.title_ka && artwork.title_en && (
                      <p className="text-xs text-foreground/50">{artwork.title_ka}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-auto">
                    {artwork.year != null && (
                      <span className="text-xs px-2 py-0.5 bg-background border border-border text-foreground/60">
                        {artwork.year}
                      </span>
                    )}
                    {artwork.category && (
                      <span className="text-xs px-2 py-0.5 bg-background border border-border text-foreground/60">
                        {CATEGORY_LABELS[artwork.category]}
                      </span>
                    )}
                    {artwork.status && (
                      <span
                        className={`text-xs px-2 py-0.5 border ${
                          artwork.status === 'available'
                            ? 'border-primary/50 text-primary bg-primary/5'
                            : 'border-border text-foreground/40'
                        }`}
                      >
                        {artwork.status === 'available'
                          ? t('admin.status.available')
                          : t('admin.status.private')}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-3 pt-3 border-t border-border/50">
                    <button
                      onClick={() => setView({ edit: artwork })}
                      className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-foreground/60 hover:text-primary transition-colors px-2 py-1.5"
                    >
                      <Pencil size={12} /> {t('admin.dashboard.edit')}
                    </button>
                    <button
                      onClick={() => { setDeleteTarget(artwork); setDeleteError(null); }}
                      className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-foreground/60 hover:text-red-400 transition-colors px-2 py-1.5 ml-auto"
                    >
                      <Trash2 size={12} /> {t('admin.dashboard.delete')}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Count */}
        {artworks.length > 0 && (
          <p className="mt-8 text-xs text-foreground/30 text-right">
            {artworks.length}{' '}
            {artworks.length === 1
              ? t('admin.dashboard.count-one')
              : t('admin.dashboard.count-many')}
          </p>
        )}
      </main>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm p-6"
          onClick={() => { setDeleteTarget(null); setDeleteError(null); }}
        >
          <div
            className="bg-card border border-border p-8 max-w-sm w-full"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="font-serif text-xl mb-3">{t('admin.delete.title')}</h2>
            <p className="text-sm text-foreground/70 mb-2">
              <span className="text-foreground">
                {deleteTarget.title_en || deleteTarget.title_ka || '—'}
              </span>{' '}
              {t('admin.delete.body')}
            </p>
            <p className="text-xs text-foreground/40 mb-6">{t('admin.delete.warning')}</p>

            {deleteError && (
              <p className="text-xs text-red-400 mb-4 border border-red-400/30 bg-red-400/5 px-3 py-2">
                {deleteError}
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => deleteMutation.mutate(deleteTarget)}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white text-xs uppercase tracking-widest transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleteMutation.isPending && <Loader2 size={12} className="animate-spin" />}
                {t('admin.delete.confirm')}
              </button>
              <button
                onClick={() => { setDeleteTarget(null); setDeleteError(null); }}
                className="flex-1 py-2.5 border border-border text-foreground/70 text-xs uppercase tracking-widest hover:border-foreground/50 transition-colors"
              >
                {t('admin.delete.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Section tabs ──────────────────────────────────────────────────────────────

interface SectionTabsProps {
  section:  Section;
  onChange: (s: Section) => void;
  language: string;
  t:        (key: string) => string;
}

function SectionTabs({ section, onChange, t }: SectionTabsProps) {
  return (
    <div className="border-b border-border/60 px-4 md:px-10 bg-card/30">
      <div className="flex gap-0">
        <button
          onClick={() => onChange('artworks')}
          className={`flex items-center gap-2 px-4 py-3 text-xs uppercase tracking-widest border-b-2 transition-colors ${
            section === 'artworks'
              ? 'border-primary text-primary'
              : 'border-transparent text-foreground/50 hover:text-foreground'
          }`}
        >
          {t('admin.section.artworks')}
        </button>
        <button
          onClick={() => onChange('archive')}
          className={`flex items-center gap-2 px-4 py-3 text-xs uppercase tracking-widest border-b-2 transition-colors ${
            section === 'archive'
              ? 'border-primary text-primary'
              : 'border-transparent text-foreground/50 hover:text-foreground'
          }`}
        >
          <Archive size={13} />
          {t('admin.section.archive')}
        </button>
      </div>
    </div>
  );
}
