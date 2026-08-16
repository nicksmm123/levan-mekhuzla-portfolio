/**
 * ArchiveItemForm — full-screen form for adding / editing an archive item.
 * Supports both photo (with crop) and video (file upload or embed URL).
 */
import React, { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Upload, Link, X, Loader2, Image as ImageIcon, Video } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { AdminLangToggle } from './AdminLangToggle';
import {
  fetchArchiveCategories,
  uploadArchiveMedia,
  createArchiveItem,
  updateArchiveItem,
  type ArchiveCategoryDB,
  type ArchiveItemDB,
  type ArchiveItemInsert,
} from '@/lib/supabase';
import { convertImageFile } from '@/lib/convertImage';
import { CropModal } from './CropModal';

interface Props {
  existing?: ArchiveItemDB;
  onSaved:   () => void;
}

type MediaType    = 'image' | 'video';
type VideoSource  = 'url' | 'file';

function extractMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === 'object') {
    const e = err as Record<string, unknown>;
    const parts: string[] = [];
    if (typeof e.message === 'string') parts.push(e.message);
    if (typeof e.details === 'string' && e.details) parts.push(e.details);
    if (parts.length) return parts.join(' — ');
  }
  return String(err);
}

const emptyItem: ArchiveItemInsert = {
  category_id:    null,
  title_en:       null,
  title_ka:       null,
  description_en: null,
  description_ka: null,
  media_type:     'image',
  image_url:      null,
  video_url:      null,
  thumbnail_url:  null,
  sort_order:     0,
};

export function ArchiveItemForm({ existing, onSaved }: Props) {
  const { t } = useLanguage();

  const [form, setForm] = useState<ArchiveItemInsert>(
    existing
      ? {
          category_id:    existing.category_id,
          title_en:       existing.title_en,
          title_ka:       existing.title_ka,
          description_en: existing.description_en,
          description_ka: existing.description_ka,
          media_type:     existing.media_type,
          image_url:      existing.image_url,
          video_url:      existing.video_url,
          thumbnail_url:  existing.thumbnail_url,
          sort_order:     existing.sort_order,
        }
      : emptyItem,
  );

  const [imagePreview,     setImagePreview]     = useState<string>(existing?.image_url ?? '');
  const [thumbPreview,     setThumbPreview]      = useState<string>(existing?.thumbnail_url ?? '');
  const [videoSource,      setVideoSource]       = useState<VideoSource>('url');
  const [videoUrlInput,    setVideoUrlInput]     = useState<string>(existing?.video_url ?? '');
  const [uploading,        setUploading]         = useState(false);
  const [uploadError,      setUploadError]       = useState<string | null>(null);
  const [saving,           setSaving]            = useState(false);
  const [saveError,        setSaveError]         = useState<string | null>(null);

  // Crop modal state (for photo uploads)
  const [cropSrc,          setCropSrc]           = useState<string | null>(null);
  const [cropFileName,     setCropFileName]      = useState('archive');
  const [cropObjectUrl,    setCropObjectUrl]     = useState<string | null>(null);
  const [cropTarget,       setCropTarget]        = useState<'image' | 'thumbnail'>('image');

  const imageInputRef  = useRef<HTMLInputElement>(null);
  const videoInputRef  = useRef<HTMLInputElement>(null);
  const thumbInputRef  = useRef<HTMLInputElement>(null);

  const { data: categories = [] } = useQuery<ArchiveCategoryDB[]>({
    queryKey: ['archive-categories'],
    queryFn:  fetchArchiveCategories,
    staleTime: 60_000,
  });

  const set = <K extends keyof ArchiveItemInsert>(k: K, v: ArchiveItemInsert[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  // ── Photo upload flow ─────────────────────────────────────────────────────

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>, target: 'image' | 'thumbnail') => {
    const raw = e.target.files?.[0];
    if (!raw) return;
    setUploadError(null);
    try {
      const converted = await convertImageFile(raw);
      const objUrl    = URL.createObjectURL(converted);
      if (cropObjectUrl) URL.revokeObjectURL(cropObjectUrl);
      setCropObjectUrl(objUrl);
      setCropFileName(converted.name);
      setCropTarget(target);
      setCropSrc(objUrl);
    } catch (err) {
      setUploadError(extractMessage(err));
    }
  };

  const handleCropConfirm = async (croppedFile: File) => {
    setCropSrc(null);
    setUploading(true);
    setUploadError(null);

    const localUrl = URL.createObjectURL(croppedFile);
    if (cropTarget === 'image') setImagePreview(localUrl);
    else                        setThumbPreview(localUrl);

    try {
      const url = await uploadArchiveMedia(croppedFile);
      if (cropTarget === 'image') {
        set('image_url', url);
        setImagePreview(url);
      } else {
        set('thumbnail_url', url);
        setThumbPreview(url);
      }
    } catch (err) {
      setUploadError(extractMessage(err));
      if (cropTarget === 'image') setImagePreview(existing?.image_url ?? '');
      else                        setThumbPreview(existing?.thumbnail_url ?? '');
    } finally {
      URL.revokeObjectURL(localUrl);
      if (cropObjectUrl) { URL.revokeObjectURL(cropObjectUrl); setCropObjectUrl(null); }
      setUploading(false);
      if (cropTarget === 'image' && imageInputRef.current) imageInputRef.current.value = '';
      if (cropTarget === 'thumbnail' && thumbInputRef.current) thumbInputRef.current.value = '';
    }
  };

  const handleCropCancel = () => {
    setCropSrc(null);
    if (cropObjectUrl) { URL.revokeObjectURL(cropObjectUrl); setCropObjectUrl(null); }
    if (imageInputRef.current) imageInputRef.current.value = '';
    if (thumbInputRef.current) thumbInputRef.current.value = '';
  };

  // ── Video file upload ─────────────────────────────────────────────────────

  const handleVideoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const url = await uploadArchiveMedia(file);
      set('video_url', url);
      setVideoUrlInput(url);
    } catch (err) {
      setUploadError(extractMessage(err));
    } finally {
      setUploading(false);
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);

    if (!form.category_id) {
      setSaveError(t('admin.archive.form.error.no-category'));
      return;
    }

    const effectiveVideoUrl = form.media_type === 'video' ? videoUrlInput.trim() : null;

    if (form.media_type === 'image' && !form.image_url) {
      setSaveError(t('admin.archive.form.error.no-media'));
      return;
    }
    if (form.media_type === 'video' && !effectiveVideoUrl) {
      setSaveError(t('admin.archive.form.error.no-media'));
      return;
    }

    setSaving(true);
    try {
      const payload: ArchiveItemInsert = {
        ...form,
        title_en:       form.title_en?.trim()       || null,
        title_ka:       form.title_ka?.trim()       || null,
        description_en: form.description_en?.trim() || null,
        description_ka: form.description_ka?.trim() || null,
        video_url:      effectiveVideoUrl,
        image_url:      form.media_type === 'image' ? form.image_url : null,
      };

      if (existing) {
        await updateArchiveItem(existing.id, payload);
      } else {
        await createArchiveItem(payload);
      }
      onSaved();
    } catch (err) {
      setSaveError(extractMessage(err));
    } finally {
      setSaving(false);
    }
  };

  // ── UI helpers ────────────────────────────────────────────────────────────

  const inputClass =
    'w-full bg-background border border-border px-4 py-2.5 text-foreground text-sm focus:outline-none focus:border-primary transition-colors';
  const labelClass = 'block text-xs uppercase tracking-widest text-foreground/60 mb-1.5';
  const opt = (
    <span className="ml-1.5 text-foreground/30 text-[10px] normal-case tracking-normal">
      {t('admin.archive.form.optional')}
    </span>
  );

  const mediaType = form.media_type as MediaType;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border px-4 md:px-10 py-3 md:py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onSaved}
            className="p-2 hover:text-primary transition-colors shrink-0"
            aria-label={t('admin.archive.form.back')}
          >
            <ArrowLeft size={18} strokeWidth={1.5} />
          </button>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.2em] text-foreground/50 mb-0.5">
              {t('admin.title')}
            </p>
            <h1 className="font-serif text-xl md:text-2xl truncate">
              {existing ? t('admin.archive.form.edit-title') : t('admin.archive.form.add-title')}
            </h1>
          </div>
        </div>
        <AdminLangToggle />
      </header>

      <div className="p-4 md:p-10">
        <p className="text-xs text-foreground/40 mb-8">{t('admin.archive.form.subtitle')}</p>

        <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">

          {/* Category */}
          <section>
            <label className={labelClass}>{t('admin.archive.form.category')}</label>
            <select
              value={form.category_id ?? ''}
              onChange={e => set('category_id', e.target.value || null)}
              className={inputClass}
              required
            >
              <option value="">{t('admin.archive.form.category-none')}</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name_en} / {cat.name_ka}
                </option>
              ))}
            </select>
          </section>

          {/* Media type toggle */}
          <section>
            <p className={labelClass}>{t('admin.archive.form.media-type')}</p>
            <div className="flex gap-2">
              {(['image', 'video'] as MediaType[]).map(mt => (
                <button
                  key={mt}
                  type="button"
                  onClick={() => set('media_type', mt)}
                  className={`flex items-center gap-2 px-5 py-2.5 text-xs uppercase tracking-widest border transition-colors ${
                    mediaType === mt
                      ? 'border-primary text-primary bg-primary/5'
                      : 'border-border text-foreground/50 hover:border-foreground/30'
                  }`}
                >
                  {mt === 'image' ? <ImageIcon size={14} /> : <Video size={14} />}
                  {mt === 'image' ? t('admin.archive.form.media-image') : t('admin.archive.form.media-video')}
                </button>
              ))}
            </div>
          </section>

          {/* ── Photo ── */}
          {mediaType === 'image' && (
            <section className="space-y-3">
              <p className={labelClass}>{t('admin.archive.form.image-label')}</p>

              {imagePreview ? (
                <div className="relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-64 max-w-full object-contain border border-border/50"
                  />
                  <button
                    type="button"
                    onClick={() => { set('image_url', null); setImagePreview(''); }}
                    className="absolute top-2 right-2 p-1.5 bg-background/80 border border-border text-foreground/60 hover:text-red-400 transition-colors"
                    title="Remove image"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={uploading}
                  className="flex flex-col items-center justify-center gap-3 w-full min-h-[180px] border border-dashed border-border/60 hover:border-primary/50 transition-colors text-foreground/40 hover:text-foreground/70 disabled:opacity-50"
                >
                  {uploading
                    ? <><Loader2 size={20} className="animate-spin" /><span className="text-xs">{t('admin.archive.form.uploading')}</span></>
                    : <><Upload size={20} /><span className="text-xs">{t('admin.archive.form.image-click')}</span><span className="text-[11px] text-foreground/30">{t('admin.archive.form.image-types')}</span></>}
                </button>
              )}

              <input
                ref={imageInputRef}
                type="file"
                accept="image/*,.tif,.tiff"
                className="sr-only"
                onChange={e => handleImageChange(e, 'image')}
              />
            </section>
          )}

          {/* ── Video ── */}
          {mediaType === 'video' && (
            <section className="space-y-4">
              <p className={labelClass}>{t('admin.archive.form.video-source-label')}</p>

              {/* Source type tabs */}
              <div className="flex gap-2">
                {(['url', 'file'] as VideoSource[]).map(src => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setVideoSource(src)}
                    className={`flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-widest border transition-colors ${
                      videoSource === src
                        ? 'border-primary text-primary bg-primary/5'
                        : 'border-border text-foreground/50 hover:border-foreground/30'
                    }`}
                  >
                    {src === 'url' ? <Link size={13} /> : <Upload size={13} />}
                    {src === 'url' ? t('admin.archive.form.video-url') : t('admin.archive.form.video-file')}
                  </button>
                ))}
              </div>

              {videoSource === 'url' ? (
                <div>
                  <input
                    type="url"
                    value={videoUrlInput}
                    onChange={e => { setVideoUrlInput(e.target.value); set('video_url', e.target.value.trim() || null); }}
                    placeholder={t('admin.archive.form.video-url-placeholder')}
                    className={inputClass}
                  />
                  {videoUrlInput && (
                    <p className="text-[11px] text-foreground/40 mt-1">
                      YouTube, Vimeo, and direct MP4 links are supported.
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    disabled={uploading}
                    className="flex flex-col items-center justify-center gap-3 w-full min-h-[140px] border border-dashed border-border/60 hover:border-primary/50 transition-colors text-foreground/40 hover:text-foreground/70 disabled:opacity-50"
                  >
                    {uploading
                      ? <><Loader2 size={20} className="animate-spin" /><span className="text-xs">{t('admin.archive.form.uploading')}</span></>
                      : <><Video size={20} /><span className="text-xs">{t('admin.archive.form.video-upload-click')}</span><span className="text-[11px] text-foreground/30">{t('admin.archive.form.video-types')}</span></>}
                  </button>
                  {form.video_url && (
                    <p className="text-xs text-primary/70 mt-2 truncate">{form.video_url}</p>
                  )}
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/ogg"
                    className="sr-only"
                    onChange={handleVideoFileChange}
                  />
                </div>
              )}

              {/* Thumbnail */}
              <div>
                <label className={labelClass}>
                  {t('admin.archive.form.thumbnail-label')}{opt}
                </label>
                {thumbPreview ? (
                  <div className="relative inline-block">
                    <img src={thumbPreview} alt="Thumbnail" className="h-24 object-cover border border-border/50" />
                    <button
                      type="button"
                      onClick={() => { set('thumbnail_url', null); setThumbPreview(''); }}
                      className="absolute top-1 right-1 p-1 bg-background/80 border border-border text-foreground/60 hover:text-red-400 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => thumbInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-border/40 text-foreground/40 hover:border-primary/40 hover:text-foreground/60 transition-colors text-xs disabled:opacity-50"
                  >
                    <ImageIcon size={14} />
                    {t('admin.archive.form.thumbnail-click')}
                  </button>
                )}
                <input
                  ref={thumbInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={e => handleImageChange(e, 'thumbnail')}
                />
              </div>
            </section>
          )}

          {/* Upload error */}
          {uploadError && (
            <p className="text-sm text-red-400 border border-red-400/30 bg-red-400/5 px-4 py-3">
              {uploadError}
            </p>
          )}

          {/* Titles */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>{t('admin.archive.form.title-en')}{opt}</label>
              <input
                type="text"
                value={form.title_en ?? ''}
                onChange={e => set('title_en', e.target.value || null)}
                className={inputClass}
                placeholder="Title in English"
              />
            </div>
            <div>
              <label className={labelClass}>{t('admin.archive.form.title-ka')}{opt}</label>
              <input
                type="text"
                value={form.title_ka ?? ''}
                onChange={e => set('title_ka', e.target.value || null)}
                className={inputClass}
                placeholder="სათაური ქართულად"
              />
            </div>
          </section>

          {/* Descriptions */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>{t('admin.archive.form.desc-en')}{opt}</label>
              <textarea
                rows={3}
                value={form.description_en ?? ''}
                onChange={e => set('description_en', e.target.value || null)}
                className={inputClass + ' resize-none'}
                placeholder="Description in English"
              />
            </div>
            <div>
              <label className={labelClass}>{t('admin.archive.form.desc-ka')}{opt}</label>
              <textarea
                rows={3}
                value={form.description_ka ?? ''}
                onChange={e => set('description_ka', e.target.value || null)}
                className={inputClass + ' resize-none'}
                placeholder="აღწერა ქართულად"
              />
            </div>
          </section>

          {/* Sort order */}
          <section className="max-w-xs">
            <label className={labelClass}>{t('admin.archive.form.sort-order')}{opt}</label>
            <input
              type="number"
              value={form.sort_order ?? 0}
              onChange={e => set('sort_order', parseInt(e.target.value, 10) || 0)}
              className={inputClass}
            />
          </section>

          {/* Save error */}
          {saveError && (
            <p className="text-sm text-red-400 border border-red-400/30 bg-red-400/5 px-4 py-3">
              {saveError}
            </p>
          )}

          {/* Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving || uploading}
              className="flex-1 sm:flex-none px-6 md:px-8 py-3 bg-primary text-primary-foreground text-sm uppercase tracking-widest font-medium transition-opacity disabled:opacity-50 hover:opacity-90 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving
                ? t('admin.archive.form.saving')
                : existing
                ? t('admin.archive.form.update')
                : t('admin.archive.form.save')}
            </button>
            <button
              type="button"
              onClick={onSaved}
              className="flex-1 sm:flex-none px-5 md:px-6 py-3 border border-border text-foreground/70 text-sm uppercase tracking-widest hover:border-foreground/50 transition-colors text-center"
            >
              {t('admin.archive.form.cancel')}
            </button>
          </div>
        </form>
      </div>

      {/* Crop modal */}
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
