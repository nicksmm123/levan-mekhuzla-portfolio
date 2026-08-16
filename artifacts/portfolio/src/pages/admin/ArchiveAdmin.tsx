/**
 * ArchiveAdmin — the archive section of the admin panel.
 * Renders inside AdminDashboard when section = 'archive'.
 * Manages its own view state: list → item form / category manager.
 */
import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Pencil, Trash2, Loader2, AlertCircle,
  Image as ImageIcon, Video, FolderOpen,
} from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import {
  fetchArchiveCategories,
  fetchArchiveItems,
  deleteArchiveItem,
  deleteArchiveMedia,
  type ArchiveCategoryDB,
  type ArchiveItemDB,
} from '@/lib/supabase';
import { ArchiveItemForm }        from './ArchiveItemForm';
import { ArchiveCategoryManager } from './ArchiveCategoryManager';

type ArchiveView = 'list' | 'new' | { edit: ArchiveItemDB } | 'categories';

interface Props {
  /** Called when the user wants to go back to Artworks section */
  onBack: () => void;
}

export function ArchiveAdmin({ onBack: _onBack }: Props) {
  const { t, language } = useLanguage();
  const qc = useQueryClient();

  const [view,         setView]         = useState<ArchiveView>('list');
  const [activeCategory, setActiveCategory] = useState<string | null>(null); // null = all
  const [deleteTarget, setDeleteTarget] = useState<ArchiveItemDB | null>(null);
  const [deleteError,  setDeleteError]  = useState<string | null>(null);

  const { data: categories = [] } = useQuery<ArchiveCategoryDB[]>({
    queryKey: ['archive-categories'],
    queryFn:  fetchArchiveCategories,
    staleTime: 60_000,
  });

  const { data: items = [], isLoading, error } = useQuery<ArchiveItemDB[]>({
    queryKey: ['archive-items', activeCategory],
    queryFn:  () => fetchArchiveItems(activeCategory),
    staleTime: 0,
  });

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['archive-items'] });
  }, [qc]);

  const handleSaved = useCallback(() => {
    invalidate();
    setView('list');
  }, [invalidate]);

  const deleteMutation = useMutation({
    mutationFn: async (item: ArchiveItemDB) => {
      await deleteArchiveItem(item.id);
      // Clean up stored files (skip external embed URLs)
      if (item.image_url)     await deleteArchiveMedia(item.image_url).catch(() => {});
      if (item.thumbnail_url) await deleteArchiveMedia(item.thumbnail_url).catch(() => {});
      // Only delete video if it looks like a Supabase storage URL
      if (item.video_url?.includes('/archive-media/')) {
        await deleteArchiveMedia(item.video_url).catch(() => {});
      }
    },
    onSuccess: () => { invalidate(); setDeleteTarget(null); setDeleteError(null); },
    onError:   (e: Error) => setDeleteError(e.message),
  });

  // ── Full-screen sub-views ──────────────────────────────────────────────────

  if (view === 'new') return <ArchiveItemForm onSaved={handleSaved} />;
  if (typeof view === 'object' && 'edit' in view)
    return <ArchiveItemForm existing={view.edit} onSaved={handleSaved} />;
  if (view === 'categories')
    return <ArchiveCategoryManager onBack={() => setView('list')} />;

  // ── List view ──────────────────────────────────────────────────────────────

  const catName = (id: string | null) => {
    if (!id) return t('admin.archive.uncategorized');
    const cat = categories.find(c => c.id === id);
    if (!cat) return t('admin.archive.uncategorized');
    return language === 'ka' ? cat.name_ka : cat.name_en;
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="border-b border-border px-4 md:px-10 py-3 flex flex-wrap items-center justify-between gap-2">
        {/* Category filter tabs — horizontally scrollable */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 -mb-px no-scrollbar">
          <button
            onClick={() => setActiveCategory(null)}
            className={`shrink-0 px-3 py-2 text-xs uppercase tracking-widest border-b-2 transition-colors whitespace-nowrap ${
              activeCategory === null
                ? 'border-primary text-primary'
                : 'border-transparent text-foreground/50 hover:text-foreground'
            }`}
          >
            {t('admin.archive.all-categories')}
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`shrink-0 px-3 py-2 text-xs uppercase tracking-widest border-b-2 transition-colors whitespace-nowrap ${
                activeCategory === cat.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-foreground/50 hover:text-foreground'
              }`}
            >
              {language === 'ka' ? cat.name_ka : cat.name_en}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setView('categories')}
            className="flex items-center gap-1.5 px-3 py-2 border border-border text-xs uppercase tracking-widest text-foreground/60 hover:text-foreground hover:border-foreground/40 transition-colors"
          >
            <FolderOpen size={13} />
            <span className="hidden sm:inline">{t('admin.archive.manage-categories')}</span>
          </button>
          <button
            onClick={() => setView('new')}
            className="flex items-center gap-1.5 px-3 md:px-5 py-2 bg-primary text-primary-foreground text-xs uppercase tracking-widest font-medium hover:opacity-90 transition-opacity"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">{t('admin.archive.add')}</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 md:px-10 py-6 max-w-7xl mx-auto">
        {isLoading && (
          <div className="flex items-center justify-center py-24 gap-3 text-foreground/50">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">{t('admin.archive.loading')}</span>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 p-5 border border-red-400/30 bg-red-400/5 text-red-400 text-sm">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-medium mb-1">{t('admin.archive.load-error')}</p>
              <p className="text-xs opacity-80">{(error as Error).message}</p>
              <p className="text-xs opacity-60 mt-1">{t('admin.archive.load-error-hint')}</p>
            </div>
          </div>
        )}

        {!isLoading && !error && items.length === 0 && (
          <div className="py-24 text-center text-foreground/40">
            <p className="font-serif text-2xl mb-4">{t('admin.archive.empty-title')}</p>
            <p className="text-sm mb-8">{t('admin.archive.empty-sub')}</p>
            <button
              onClick={() => setView('new')}
              className="px-6 py-3 bg-primary text-primary-foreground text-xs uppercase tracking-widest hover:opacity-90 transition-opacity"
            >
              {t('admin.archive.add')}
            </button>
          </div>
        )}

        {items.length > 0 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {items.map(item => {
                const title =
                  (language === 'ka' ? item.title_ka : item.title_en) ||
                  item.title_en || item.title_ka;
                const thumb =
                  item.thumbnail_url ?? item.image_url;

                return (
                  <article
                    key={item.id}
                    className="bg-card border border-border overflow-hidden group flex flex-col"
                  >
                    {/* Thumbnail */}
                    <div className="aspect-square bg-black/20 overflow-hidden relative">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={title ?? ''}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-foreground/20">
                          {item.media_type === 'video' ? <Video size={28} /> : <ImageIcon size={28} />}
                        </div>
                      )}

                      {/* Media type badge */}
                      <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-background/80 text-[10px] uppercase tracking-widest text-foreground/70 border border-border/50 flex items-center gap-1">
                        {item.media_type === 'video'
                          ? <><Video size={9} />{t('admin.archive.type-video')}</>
                          : <><ImageIcon size={9} />{t('admin.archive.type-image')}</>}
                      </span>
                    </div>

                    {/* Metadata */}
                    <div className="p-3 flex flex-col flex-1 gap-2">
                      <div className="flex-1">
                        <p className="text-xs font-medium text-foreground leading-tight truncate">
                          {title || <span className="italic text-foreground/30">Untitled</span>}
                        </p>
                        <p className="text-[10px] text-foreground/40 mt-0.5 truncate">
                          {catName(item.category_id)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1 pt-2 border-t border-border/40">
                        <button
                          onClick={() => setView({ edit: item })}
                          className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-foreground/50 hover:text-primary transition-colors px-1.5 py-1"
                        >
                          <Pencil size={10} /> {t('admin.archive.edit')}
                        </button>
                        <button
                          onClick={() => { setDeleteTarget(item); setDeleteError(null); }}
                          className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-foreground/50 hover:text-red-400 transition-colors px-1.5 py-1 ml-auto"
                        >
                          <Trash2 size={10} /> {t('admin.archive.delete')}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <p className="mt-6 text-xs text-foreground/30 text-right">
              {items.length} {items.length === 1 ? t('admin.archive.count-one') : t('admin.archive.count-many')}
            </p>
          </>
        )}
      </div>

      {/* Delete modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm p-6"
          onClick={() => { setDeleteTarget(null); setDeleteError(null); }}
        >
          <div
            className="bg-card border border-border p-6 md:p-8 max-w-sm w-full"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="font-serif text-xl mb-3">{t('admin.archive.delete.title')}</h2>
            <p className="text-sm text-foreground/70 mb-2">
              <span className="text-foreground">
                {deleteTarget.title_en || deleteTarget.title_ka || '—'}
              </span>{' '}
              {t('admin.archive.delete.body')}
            </p>
            <p className="text-xs text-foreground/40 mb-6">{t('admin.archive.delete.warning')}</p>
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
                {t('admin.archive.delete.confirm')}
              </button>
              <button
                onClick={() => { setDeleteTarget(null); setDeleteError(null); }}
                className="flex-1 py-2.5 border border-border text-foreground/70 text-xs uppercase tracking-widest hover:border-foreground/50 transition-colors"
              >
                {t('admin.archive.delete.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
