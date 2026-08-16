import React, { useRef, useState } from 'react';
import { ArrowLeft, Upload, X, Loader2 } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { AdminLangToggle } from './AdminLangToggle';
import {
  type ArtworkDB,
  type ArtworkInsert,
  uploadArtworkImage,
  createArtwork,
  updateArtwork,
} from '@/lib/supabase';
import { convertImageFile } from '@/lib/convertImage';
import { CropModal } from './CropModal';

interface Props {
  existing?: ArtworkDB;
  onSaved: () => void;
}

type CategoryValue = ArtworkDB['category'];
type StatusValue = ArtworkDB['status'];

/** Extract a human-readable message from any thrown value. */
function extractMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === 'object') {
    const e = err as Record<string, unknown>;
    // PostgrestError shape: { message, details, hint, code }
    const parts: string[] = [];
    if (typeof e.message === 'string') parts.push(e.message);
    if (typeof e.details === 'string' && e.details) parts.push(`Details: ${e.details}`);
    if (typeof e.hint    === 'string' && e.hint)    parts.push(`Hint: ${e.hint}`);
    if (typeof e.code    === 'string' && e.code)    parts.push(`Code: ${e.code}`);
    if (parts.length) return parts.join(' — ');
  }
  return String(err);
}

/** Build a clean insert payload, converting empty strings / NaN to safe values. */
function toPayload(f: ArtworkInsert): ArtworkInsert {
  const year       = (f.year != null && !isNaN(Number(f.year)))           ? Math.trunc(Number(f.year))       : null;
  const sort_order = (f.sort_order != null && !isNaN(Number(f.sort_order))) ? Math.trunc(Number(f.sort_order)) : 0;
  const price      = (f.price != null && !isNaN(Number(f.price)))          ? Number(f.price)                  : null;
  return {
    ...f,
    title_en:   f.title_en?.trim()   || null,
    title_ka:   f.title_ka?.trim()   || null,
    medium_en:  f.medium_en?.trim()  || null,
    medium_ka:  f.medium_ka?.trim()  || null,
    dimensions: f.dimensions?.trim() || null,
    year,
    sort_order,
    price,
  };
}

const empty: ArtworkInsert = {
  title_en:   null,
  title_ka:   null,
  year:       null,
  medium_en:  null,
  medium_ka:  null,
  dimensions: null,
  category:   null,
  status:     null,
  price:      null,
  image_url:  '',
  sort_order: null,
};

export function ArtworkForm({ existing, onSaved }: Props) {
  const { t } = useLanguage();
  const [form, setForm] = useState<ArtworkInsert>(
    existing
      ? {
          title_en:   existing.title_en,
          title_ka:   existing.title_ka,
          year:       existing.year,
          medium_en:  existing.medium_en,
          medium_ka:  existing.medium_ka,
          dimensions: existing.dimensions,
          category:   existing.category,
          status:     existing.status,
          price:      existing.price,
          image_url:  existing.image_url,
          sort_order: existing.sort_order,
        }
      : empty,
  );

  const [imagePreview, setImagePreview] = useState<string>(existing?.image_url ?? '');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Crop-modal state
  const [cropSrc, setCropSrc]       = useState<string | null>(null);
  const [cropFileName, setCropFileName] = useState<string>('artwork');
  const [cropObjectUrl, setCropObjectUrl] = useState<string | null>(null);

  const set = <K extends keyof ArtworkInsert>(k: K, v: ArtworkInsert[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  // Step 1 — file selected: convert TIF if needed, then open cropper
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.files?.[0];
    if (!raw) return;
    setUploadError(null);
    try {
      // Convert TIF/TIFF → JPEG so the cropper can always render it
      const converted = await convertImageFile(raw);
      const objUrl = URL.createObjectURL(converted);
      // Revoke any previous pending URL
      if (cropObjectUrl) URL.revokeObjectURL(cropObjectUrl);
      setCropObjectUrl(objUrl);
      setCropFileName(converted.name);
      setCropSrc(objUrl);           // opens the modal
    } catch (err) {
      setUploadError(extractMessage(err));
    }
  };

  // Step 2 — user confirmed crop: upload the cropped file
  const handleCropConfirm = async (croppedFile: File) => {
    setCropSrc(null);               // close modal
    setUploading(true);
    setUploadError(null);
    // Show a local preview immediately while uploading
    const localUrl = URL.createObjectURL(croppedFile);
    setImagePreview(localUrl);
    try {
      const url = await uploadArtworkImage(croppedFile);
      set('image_url', url);
      setImagePreview(url);
    } catch (err) {
      setUploadError(extractMessage(err));
      setImagePreview(existing?.image_url ?? '');
    } finally {
      URL.revokeObjectURL(localUrl);
      if (cropObjectUrl) { URL.revokeObjectURL(cropObjectUrl); setCropObjectUrl(null); }
      setUploading(false);
      // Reset file input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Step 2 alt — user cancelled crop
  const handleCropCancel = () => {
    setCropSrc(null);
    if (cropObjectUrl) { URL.revokeObjectURL(cropObjectUrl); setCropObjectUrl(null); }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.image_url) { setSaveError(t('admin.form.error.no-image')); return; }
    setSaveError(null);
    setSaving(true);
    try {
      const payload = toPayload(form);
      if (existing) {
        await updateArtwork(existing.id, payload);
      } else {
        await createArtwork(payload);
      }
      onSaved();
    } catch (err) {
      setSaveError(extractMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full bg-background border border-border px-4 py-2.5 text-foreground text-sm focus:outline-none focus:border-primary transition-colors';
  const labelClass = 'block text-xs uppercase tracking-widest text-foreground/60 mb-1.5';
  const optionalBadge = (
    <span className="ml-1.5 text-foreground/30 text-[10px] normal-case tracking-normal">
      {t('admin.form.optional')}
    </span>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="border-b border-border px-4 md:px-10 py-3 md:py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onSaved}
            className="p-2 hover:text-primary transition-colors shrink-0"
            aria-label={t('admin.form.back')}
          >
            <ArrowLeft size={18} strokeWidth={1.5} />
          </button>
          <div className="min-w-0">
            <p className="text-[10px] md:text-xs uppercase tracking-[0.2em] md:tracking-[0.3em] text-foreground/50 mb-0.5">
              {t('admin.title')}
            </p>
            <h1 className="font-serif text-xl md:text-2xl truncate">
              {existing ? t('admin.form.edit-title') : t('admin.form.add-title')}
            </h1>
          </div>
        </div>
        <AdminLangToggle />
      </header>

      <div className="p-6 md:p-10">
        <p className="text-xs text-foreground/40 mb-8">{t('admin.form.subtitle')}</p>

        <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">
          {/* Image Upload */}
          <section className="space-y-3">
            <p className={labelClass}>
              {t('admin.form.image-label')} <span className="text-primary">*</span>
            </p>
            <div
              className={`relative border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer flex items-center justify-center min-h-[260px] bg-card overflow-hidden ${uploading ? 'opacity-60 pointer-events-none' : ''}`}
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-[400px] w-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center gap-3 py-12 text-foreground/40">
                  <Upload size={36} strokeWidth={1} />
                  <p className="text-sm">{t('admin.form.image-click')}</p>
                  <p className="text-xs">{t('admin.form.image-types')}</p>
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/70">
                  <Loader2 size={32} className="animate-spin text-primary" />
                </div>
              )}
              {imagePreview && !uploading && (
                <button
                  type="button"
                  onClick={ev => {
                    ev.stopPropagation();
                    setImagePreview('');
                    set('image_url', '');
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="absolute top-3 right-3 p-1.5 bg-background/80 rounded-full hover:bg-background transition-colors"
                  aria-label={t('admin.form.remove-image')}
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            {uploadError && <p className="text-xs text-red-400">{uploadError}</p>}
          </section>

          {/* Titles */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>{t('admin.form.title-en')}{optionalBadge}</label>
              <input
                type="text"
                value={form.title_en ?? ''}
                onChange={e => set('title_en', e.target.value || null)}
                className={inputClass}
                placeholder="Silence in the Woods"
              />
            </div>
            <div>
              <label className={labelClass}>{t('admin.form.title-ka')}{optionalBadge}</label>
              <input
                type="text"
                value={form.title_ka ?? ''}
                onChange={e => set('title_ka', e.target.value || null)}
                className={inputClass}
                placeholder="სიჩუმე ტყეში"
              />
            </div>
          </section>

          {/* Medium */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>{t('admin.form.medium-en')}{optionalBadge}</label>
              <input
                type="text"
                value={form.medium_en ?? ''}
                onChange={e => set('medium_en', e.target.value || null)}
                className={inputClass}
                placeholder="Oil on Canvas"
              />
            </div>
            <div>
              <label className={labelClass}>{t('admin.form.medium-ka')}{optionalBadge}</label>
              <input
                type="text"
                value={form.medium_ka ?? ''}
                onChange={e => set('medium_ka', e.target.value || null)}
                className={inputClass}
                placeholder="ზეთი ტილოზე"
              />
            </div>
          </section>

          {/* Year, Size, Sort Order */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className={labelClass}>{t('admin.form.year')}{optionalBadge}</label>
              <input
                type="number"
                value={form.year ?? ''}
                onChange={e => {
                  const v = parseInt(e.target.value, 10);
                  set('year', isNaN(v) ? null : v);
                }}
                min={1900}
                max={2100}
                className={inputClass}
                placeholder={String(new Date().getFullYear())}
              />
            </div>
            <div>
              <label className={labelClass}>{t('admin.form.size')}{optionalBadge}</label>
              <input
                type="text"
                value={form.dimensions ?? ''}
                onChange={e => set('dimensions', e.target.value || null)}
                className={inputClass}
                placeholder="80 × 60 cm"
              />
            </div>
            <div>
              <label className={labelClass}>{t('admin.form.sort-order')}{optionalBadge}</label>
              <input
                type="number"
                value={form.sort_order ?? ''}
                onChange={e => {
                  const v = parseInt(e.target.value, 10);
                  set('sort_order', isNaN(v) ? null : v);
                }}
                min={0}
                className={inputClass}
                placeholder={t('admin.form.sort-order-hint')}
              />
            </div>
          </section>

          {/* Category & Status */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>{t('admin.form.category')}{optionalBadge}</label>
              <select
                value={form.category ?? ''}
                onChange={e =>
                  set('category', (e.target.value as NonNullable<CategoryValue>) || null)
                }
                className={inputClass}
              >
                <option value="">{t('admin.form.category-none')}</option>
                <option value="original-paintings">{t('admin.category.original-paintings')}</option>
                <option value="limited-edition-prints">{t('admin.category.limited-edition-prints')}</option>
                <option value="graphic-works">{t('admin.category.graphic-works')}</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>{t('admin.form.status')}{optionalBadge}</label>
              <select
                value={form.status ?? ''}
                onChange={e =>
                  set('status', (e.target.value as NonNullable<StatusValue>) || null)
                }
                className={inputClass}
              >
                <option value="">{t('admin.form.status-none')}</option>
                <option value="available">{t('admin.form.status-available')}</option>
                <option value="private-collection">{t('admin.form.status-private')}</option>
              </select>
            </div>
          </section>

          {/* Price */}
          <section>
            <label className={labelClass}>{t('admin.form.price')}{optionalBadge}</label>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="number"
                value={form.price ?? ''}
                onChange={e =>
                  set('price', e.target.value === '' ? null : parseFloat(e.target.value))
                }
                min={0}
                step={0.01}
                className="w-full sm:w-48 bg-background border border-border px-4 py-2.5 text-foreground text-sm focus:outline-none focus:border-primary transition-colors"
                placeholder="3500"
              />
              <span className="text-xs text-foreground/40">{t('admin.form.price-hint')}</span>
            </div>
          </section>

          {/* Save */}
          {saveError && (
            <p className="text-sm text-red-400 border border-red-400/30 bg-red-400/5 px-4 py-3">
              {saveError}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 md:gap-4 pt-2">
            <button
              type="submit"
              disabled={saving || uploading}
              className="flex-1 sm:flex-none px-6 md:px-8 py-3 bg-primary text-primary-foreground text-sm uppercase tracking-widest font-medium transition-opacity disabled:opacity-50 hover:opacity-90 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving
                ? t('admin.form.saving')
                : existing
                ? t('admin.form.update')
                : t('admin.form.save')}
            </button>
            <button
              type="button"
              onClick={onSaved}
              className="flex-1 sm:flex-none px-5 md:px-6 py-3 border border-border text-foreground/70 text-sm uppercase tracking-widest hover:border-foreground/50 transition-colors text-center"
            >
              {t('admin.form.cancel')}
            </button>
          </div>
        </form>
      </div>

      {/* ── Crop modal ── */}
      {cropSrc && (
        <CropModal
          src={cropSrc}
          fileName={cropFileName}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  );
}
