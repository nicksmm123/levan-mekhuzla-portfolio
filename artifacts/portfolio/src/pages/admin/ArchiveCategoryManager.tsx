/**
 * ArchiveCategoryManager — full-screen admin screen for managing
 * archive categories (add, rename EN/KA, delete).
 */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Pencil, Trash2, Check, X, Loader2, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { AdminLangToggle } from './AdminLangToggle';
import {
  fetchArchiveCategories,
  createArchiveCategory,
  updateArchiveCategory,
  deleteArchiveCategory,
  type ArchiveCategoryDB,
} from '@/lib/supabase';

interface Props {
  onBack: () => void;
}

interface EditState {
  id: string;
  name_en: string;
  name_ka: string;
}

export function ArchiveCategoryManager({ onBack }: Props) {
  const { t } = useLanguage();
  const qc = useQueryClient();

  const [editState, setEditState]     = useState<EditState | null>(null);
  const [showAdd, setShowAdd]         = useState(false);
  const [newEn, setNewEn]             = useState('');
  const [newKa, setNewKa]             = useState('');
  const [deleteTarget, setDeleteTarget] = useState<ArchiveCategoryDB | null>(null);
  const [formError, setFormError]     = useState<string | null>(null);

  const { data: cats = [], isLoading, error } = useQuery({
    queryKey: ['archive-categories'],
    queryFn:  fetchArchiveCategories,
    staleTime: 0,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['archive-categories'] });
    qc.invalidateQueries({ queryKey: ['archive-items'] });
  };

  const createMutation = useMutation({
    mutationFn: createArchiveCategory,
    onSuccess:  () => { invalidate(); setShowAdd(false); setNewEn(''); setNewKa(''); setFormError(null); },
    onError:    (e: Error) => setFormError(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name_en, name_ka }: EditState) =>
      updateArchiveCategory(id, { name_en, name_ka }),
    onSuccess:  () => { invalidate(); setEditState(null); setFormError(null); },
    onError:    (e: Error) => setFormError(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteArchiveCategory(id),
    onSuccess:  () => { invalidate(); setDeleteTarget(null); },
    onError:    (e: Error) => setFormError(e.message),
  });

  const inputClass =
    'w-full bg-background border border-border px-3 py-2 text-foreground text-sm focus:outline-none focus:border-primary transition-colors';

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border px-4 md:px-10 py-3 md:py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="p-2 hover:text-primary transition-colors shrink-0"
            aria-label={t('admin.archive.cats.back')}
          >
            <ArrowLeft size={18} strokeWidth={1.5} />
          </button>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.2em] text-foreground/50 mb-0.5">
              {t('admin.title')}
            </p>
            <h1 className="font-serif text-xl md:text-2xl truncate">
              {t('admin.archive.cats.heading')}
            </h1>
          </div>
        </div>
        <AdminLangToggle />
      </header>

      <div className="px-4 md:px-10 py-8 max-w-2xl mx-auto">
        {/* Load error */}
        {error && (
          <div className="flex items-start gap-3 p-4 border border-red-400/30 bg-red-400/5 text-red-400 text-sm mb-6">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{(error as Error).message}</span>
          </div>
        )}

        {/* Mutation error */}
        {formError && (
          <div className="flex items-start gap-3 p-4 border border-red-400/30 bg-red-400/5 text-red-400 text-sm mb-6">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center gap-3 py-12 text-foreground/40">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">{t('admin.archive.loading')}</span>
          </div>
        )}

        {/* Category list */}
        {!isLoading && (
          <div className="space-y-2">
            {cats.length === 0 && !showAdd && (
              <p className="text-sm text-foreground/40 py-8 text-center">
                {t('admin.archive.cats.empty')}
              </p>
            )}

            {cats.map(cat => (
              <div
                key={cat.id}
                className="border border-border bg-card"
              >
                {editState?.id === cat.id ? (
                  /* Inline edit form */
                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest text-foreground/50 mb-1">
                          {t('admin.archive.cats.name-en')}
                        </label>
                        <input
                          type="text"
                          value={editState.name_en}
                          onChange={e => setEditState(s => s && ({ ...s, name_en: e.target.value }))}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest text-foreground/50 mb-1">
                          {t('admin.archive.cats.name-ka')}
                        </label>
                        <input
                          type="text"
                          value={editState.name_ka}
                          onChange={e => setEditState(s => s && ({ ...s, name_ka: e.target.value }))}
                          className={inputClass}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={updateMutation.isPending}
                        onClick={() => editState && updateMutation.mutate(editState)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        {updateMutation.isPending
                          ? <><Loader2 size={12} className="animate-spin" />{t('admin.archive.cats.saving')}</>
                          : <><Check size={12} />{t('admin.archive.cats.save')}</>}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditState(null)}
                        className="flex items-center gap-1.5 px-4 py-2 border border-border text-foreground/60 text-xs uppercase tracking-widest hover:border-foreground/40 transition-colors"
                      >
                        <X size={12} />{t('admin.archive.cats.cancel')}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Row display */
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{cat.name_en}</p>
                      <p className="text-xs text-foreground/50 truncate">{cat.name_ka}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setEditState({ id: cat.id, name_en: cat.name_en, name_ka: cat.name_ka })}
                        className="p-2 text-foreground/40 hover:text-primary transition-colors"
                        title={t('admin.archive.cats.edit')}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(cat)}
                        className="p-2 text-foreground/40 hover:text-red-400 transition-colors"
                        title={t('admin.archive.cats.delete')}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Add new category */}
            {showAdd ? (
              <div className="border border-primary/30 bg-card p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-foreground/50 mb-1">
                      {t('admin.archive.cats.name-en')}
                    </label>
                    <input
                      type="text"
                      value={newEn}
                      onChange={e => setNewEn(e.target.value)}
                      className={inputClass}
                      placeholder="e.g. Family Archive"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-foreground/50 mb-1">
                      {t('admin.archive.cats.name-ka')}
                    </label>
                    <input
                      type="text"
                      value={newKa}
                      onChange={e => setNewKa(e.target.value)}
                      className={inputClass}
                      placeholder="მაგ. ოჯახის არქივი"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={createMutation.isPending || !newEn.trim()}
                    onClick={() => createMutation.mutate({ name_en: newEn.trim(), name_ka: newKa.trim(), sort_order: cats.length })}
                    className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {createMutation.isPending
                      ? <><Loader2 size={12} className="animate-spin" />{t('admin.archive.cats.saving')}</>
                      : <><Check size={12} />{t('admin.archive.cats.save')}</>}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowAdd(false); setNewEn(''); setNewKa(''); }}
                    className="flex items-center gap-1.5 px-4 py-2 border border-border text-foreground/60 text-xs uppercase tracking-widest hover:border-foreground/40 transition-colors"
                  >
                    <X size={12} />{t('admin.archive.cats.cancel')}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowAdd(true)}
                className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-border text-foreground/40 hover:text-foreground hover:border-foreground/30 transition-colors text-xs uppercase tracking-widest"
              >
                <Plus size={14} />
                {t('admin.archive.cats.add')}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm p-6"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="bg-card border border-border p-6 md:p-8 max-w-sm w-full"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="font-serif text-xl mb-3">{t('admin.archive.delete.title')}</h2>
            <p className="text-sm text-foreground/70 mb-2">
              <span className="text-foreground font-medium">{deleteTarget.name_en}</span>
            </p>
            <p className="text-xs text-foreground/40 mb-6">{t('admin.archive.cats.delete-warning')}</p>
            <div className="flex gap-3">
              <button
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white text-xs uppercase tracking-widest transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleteMutation.isPending && <Loader2 size={12} className="animate-spin" />}
                {t('admin.archive.delete.confirm')}
              </button>
              <button
                onClick={() => setDeleteTarget(null)}
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
