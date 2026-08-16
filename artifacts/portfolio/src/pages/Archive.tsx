/**
 * Archive — public archive page with dynamic categories from Supabase.
 * Falls back to static poster data when Supabase is not configured.
 *
 * Supports:
 *  • Image items  → click to open a lightbox
 *  • Video items  → click to open a video modal (YouTube / Vimeo / direct MP4)
 */
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { X, ChevronLeft, ChevronRight, Play, Loader2, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import {
  fetchArchiveCategories,
  fetchArchiveItems,
  supabaseConfigured,
  type ArchiveCategoryDB,
  type ArchiveItemDB,
} from '@/lib/supabase';

const BASE = import.meta.env.BASE_URL;

// ── Animation helpers ─────────────────────────────────────────────────────────

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as [number,number,number,number], delay },
});

const fadeIn = (delay = 0) => ({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.5, ease: 'easeOut', delay },
});

// ── Static fallback data (shown when Supabase is not configured) ───────────────

interface StaticPoster {
  src: string;
  year: string;
  titleEn: string;
  titleKa: string;
  subtitleEn?: string;
  subtitleKa?: string;
  captionEn: string;
  captionKa: string;
}

const STATIC_POSTERS: StaticPoster[] = [
  {
    src: `${BASE}poster-2003.jpg`,
    year: '2003',
    titleEn: 'Compte-Tours',
    titleKa: 'კომპტ-ტური',
    subtitleEn: 'Galerie Ileana Bouboulis, Paris',
    subtitleKa: 'გალერეა Ileana Bouboulis, პარიზი',
    captionEn: 'Poster 2003',
    captionKa: 'აფიშა 2003',
  },
  {
    src: `${BASE}poster-2009.jpg`,
    year: '2009',
    titleEn: "Etudes for the 'Kornet' by Rainer Maria Rilke",
    titleKa: "ეტიუდები რაინერ მარია რილკეს 'კორნეტის' მიხედვით",
    captionEn: 'Poster 2009',
    captionKa: 'აფიშა 2009',
  },
  {
    src: `${BASE}poster-2025.jpg`,
    year: '2025',
    titleEn: 'On the Verge',
    titleKa: 'ზღვარზე',
    captionEn: 'Poster 2025',
    captionKa: 'აფიშა 2025',
  },
  {
    src: `${BASE}poster-2026.jpg`,
    year: '2026',
    titleEn: 'The Lost City',
    titleKa: 'დაკარგული ქალაქი',
    captionEn: 'Poster 2026',
    captionKa: 'აფიშა 2026',
  },
];

// ── Video URL helpers ─────────────────────────────────────────────────────────

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function getVimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(\d+)/);
  return m ? m[1] : null;
}

function getEmbedUrl(url: string): { type: 'iframe' | 'video'; src: string } {
  const ytId = getYouTubeId(url);
  if (ytId) {
    return {
      type: 'iframe',
      src: `https://www.youtube-nocookie.com/embed/${ytId}?rel=0&modestbranding=1&autoplay=1`,
    };
  }
  const vimeoId = getVimeoId(url);
  if (vimeoId) {
    return {
      type: 'iframe',
      src: `https://player.vimeo.com/video/${vimeoId}?autoplay=1`,
    };
  }
  // Direct MP4/WebM or Supabase storage
  return { type: 'video', src: url };
}

function getVideoThumbnailUrl(videoUrl: string): string | null {
  const ytId = getYouTubeId(videoUrl);
  if (ytId) return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
  return null;
}

// ── Lightbox (for image items) ────────────────────────────────────────────────

interface LightboxItem {
  src: string;
  title: string;
  subtitle?: string;
  caption?: string;
}

interface LightboxProps {
  items: LightboxItem[];
  index: number;
  onClose: () => void;
  onNav:   (dir: 1 | -1) => void;
}

const ImageLightbox: React.FC<LightboxProps> = ({ items, index, onClose, onNav }) => {
  const item = items[index];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape')      onClose();
      if (e.key === 'ArrowLeft')   onNav(-1);
      if (e.key === 'ArrowRight')  onNav(1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, onNav]);

  return (
    <motion.div
      key="lightbox"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/96 backdrop-blur-sm p-4 md:p-10"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-5 right-5 p-2 text-foreground/50 hover:text-foreground transition-colors"
        aria-label="Close"
      >
        <X size={22} strokeWidth={1.5} />
      </button>

      {index > 0 && (
        <button
          onClick={e => { e.stopPropagation(); onNav(-1); }}
          className="absolute left-4 md:left-8 p-3 text-foreground/40 hover:text-foreground transition-colors"
          aria-label="Previous"
        >
          <ChevronLeft size={28} strokeWidth={1.2} />
        </button>
      )}

      <motion.div
        key={index}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center gap-5 max-h-full"
        onClick={e => e.stopPropagation()}
      >
        <img
          src={item.src}
          alt={item.title}
          className="max-h-[75vh] max-w-[85vw] md:max-w-[65vw] object-contain shadow-2xl"
        />
        <div className="text-center">
          {item.caption && (
            <p className="font-mono text-[10px] tracking-[0.3em] text-primary/60 mb-1.5">
              {item.caption}
            </p>
          )}
          <p className="font-serif text-lg text-foreground/90 mb-1">{item.title}</p>
          {item.subtitle && (
            <p className="text-xs uppercase tracking-widest text-foreground/40">{item.subtitle}</p>
          )}
        </div>
      </motion.div>

      {index < items.length - 1 && (
        <button
          onClick={e => { e.stopPropagation(); onNav(1); }}
          className="absolute right-4 md:right-8 p-3 text-foreground/40 hover:text-foreground transition-colors"
          aria-label="Next"
        >
          <ChevronRight size={28} strokeWidth={1.2} />
        </button>
      )}

      {items.length > 1 && (
        <div className="absolute bottom-5 flex gap-2">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={e => { e.stopPropagation(); onNav((i - index) as 1 | -1); }}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                i === index ? 'bg-primary' : 'bg-foreground/20 hover:bg-foreground/40'
              }`}
              aria-label={`Go to item ${i + 1}`}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};

// ── Video modal ───────────────────────────────────────────────────────────────

interface VideoModalProps {
  item: ArchiveItemDB;
  title: string;
  onClose: () => void;
}

const VideoModal: React.FC<VideoModalProps> = ({ item, title, onClose }) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!item.video_url) return null;

  const embed = getEmbedUrl(item.video_url);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/97 backdrop-blur-sm p-4 md:p-10"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-5 right-5 p-2 text-foreground/50 hover:text-foreground transition-colors z-10"
        aria-label="Close"
      >
        <X size={22} strokeWidth={1.5} />
      </button>

      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-4xl flex flex-col gap-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Player */}
        {embed.type === 'iframe' ? (
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              src={embed.src}
              title={title}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full border-0 bg-black"
            />
          </div>
        ) : (
          <video
            src={embed.src}
            controls
            autoPlay
            className="w-full max-h-[70vh] bg-black"
          />
        )}

        {/* Caption */}
        <div className="text-center">
          <p className="font-serif text-lg text-foreground/90">{title}</p>
          {item.description_en && (
            <p className="text-xs text-foreground/50 mt-1">{item.description_en}</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// ── Archive item card ─────────────────────────────────────────────────────────

interface ItemCardProps {
  item:      ArchiveItemDB;
  language:  'en' | 'ka';
  delay?:    number;
  onClickImage: (item: ArchiveItemDB) => void;
  onClickVideo: (item: ArchiveItemDB) => void;
}

const ArchiveCard: React.FC<ItemCardProps> = ({
  item, language, delay = 0, onClickImage, onClickVideo,
}) => {
  const title  = (language === 'ka' ? item.title_ka  : item.title_en)  || item.title_en  || item.title_ka  || '';
  const desc   = (language === 'ka' ? item.description_ka : item.description_en) || '';
  const thumb  = item.thumbnail_url ?? item.image_url;
  const ytThumb = item.video_url ? getVideoThumbnailUrl(item.video_url) : null;
  const displayThumb = thumb || ytThumb;

  const isVideo  = item.media_type === 'video';
  const handleClick = () => isVideo ? onClickVideo(item) : onClickImage(item);

  return (
    <motion.article
      {...fadeIn(delay)}
      className="group flex flex-col gap-3 cursor-pointer"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && handleClick()}
      aria-label={title || (isVideo ? 'Video' : 'Photo')}
    >
      {/* Thumbnail */}
      <div className="relative overflow-hidden bg-foreground/5 border border-border/30 group-hover:border-primary/30 transition-colors duration-500 aspect-[4/3]">
        {displayThumb ? (
          <img
            src={displayThumb}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-foreground/20">
            {isVideo
              ? <Play size={32} strokeWidth={1} />
              : <span className="text-xs uppercase tracking-widest">Photo</span>}
          </div>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-background/0 group-hover:bg-background/40 transition-colors duration-500 flex items-center justify-center">
          {isVideo ? (
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-foreground/90 border border-foreground/50 pl-5 pr-6 py-2.5">
              <Play size={12} strokeWidth={1.5} />
              Play
            </span>
          ) : (
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[10px] uppercase tracking-[0.3em] text-foreground/80 border border-foreground/40 px-4 py-2">
              View
            </span>
          )}
        </div>
      </div>

      {/* Caption */}
      {(title || desc) && (
        <figcaption className="flex flex-col gap-0.5">
          {title && (
            <p className="font-serif text-sm text-foreground/80 leading-snug line-clamp-2">{title}</p>
          )}
          {desc && (
            <p className="text-[11px] text-foreground/40 leading-relaxed line-clamp-2">{desc}</p>
          )}
        </figcaption>
      )}
    </motion.article>
  );
};

// ── Static poster card (fallback) ─────────────────────────────────────────────

const StaticPosterCard: React.FC<{
  poster: StaticPoster;
  language: 'en' | 'ka';
  delay?: number;
  onClick: (p: StaticPoster) => void;
}> = ({ poster, language, delay = 0, onClick }) => {
  const title = language === 'ka' ? poster.titleKa : poster.titleEn;
  const sub   = language === 'ka' ? poster.subtitleKa : poster.subtitleEn;
  const label = language === 'ka' ? poster.captionKa  : poster.captionEn;

  return (
    <motion.article
      {...fadeIn(delay)}
      className="group flex flex-col gap-3 cursor-pointer"
      onClick={() => onClick(poster)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick(poster)}
      aria-label={`Open poster: ${title}`}
    >
      <div className="relative overflow-hidden bg-foreground/5 border border-border/30 group-hover:border-primary/30 transition-colors duration-500">
        <img
          src={poster.src}
          alt={title}
          className="w-full object-contain transition-transform duration-700 ease-out group-hover:scale-[1.025]"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-background/0 group-hover:bg-background/30 transition-colors duration-500 flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[10px] uppercase tracking-[0.3em] text-foreground/80 border border-foreground/40 px-4 py-2">
            {language === 'ka' ? 'გახსნა' : 'View'}
          </span>
        </div>
      </div>
      <figcaption className="flex flex-col gap-1">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-[10px] tracking-widest text-primary/70 shrink-0">
            {poster.year}
          </span>
          <span className="text-[11px] uppercase tracking-[0.18em] text-foreground/35">
            {label}
          </span>
        </div>
        <p className="font-serif text-sm text-foreground/70 leading-snug">{title}</p>
        {sub && <p className="text-[11px] text-foreground/35 leading-relaxed">{sub}</p>}
      </figcaption>
    </motion.article>
  );
};

// ── Main Archive component ────────────────────────────────────────────────────

export const Archive: React.FC = () => {
  const { t, language } = useLanguage();

  // Category state
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);

  // Lightbox state (for image items)
  type LBState = { items: LightboxItem[]; index: number } | null;
  const [lightbox, setLightbox] = useState<LBState>(null);

  // Video modal state
  const [videoItem, setVideoItem] = useState<ArchiveItemDB | null>(null);

  // Static poster lightbox (fallback mode)
  const [staticIndex, setStaticIndex] = useState<number | null>(null);

  // ── Data fetching ───────────────────────────────────────────────────────────

  const {
    data: categories = [],
    isLoading: catsLoading,
    error: catsError,
    isFetched: catsFetched,
  } = useQuery<ArchiveCategoryDB[]>({
    queryKey: ['archive-categories'],
    queryFn:  fetchArchiveCategories,
    enabled:  supabaseConfigured,
    staleTime: 5 * 60_000,
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Set first category as default once loaded
  useEffect(() => {
    if (categories.length > 0 && activeCategoryId === null) {
      setActiveCategoryId(categories[0].id);
    }
  }, [categories, activeCategoryId]);

  const { data: items = [], isLoading: itemsLoading, error: itemsError } = useQuery<ArchiveItemDB[]>({
    queryKey: ['archive-items-public', activeCategoryId],
    queryFn:  () => fetchArchiveItems(activeCategoryId),
    enabled:  supabaseConfigured && !!activeCategoryId,
    staleTime: 2 * 60_000,
  });

  // ── Body scroll lock ────────────────────────────────────────────────────────

  useEffect(() => {
    const locked = lightbox !== null || videoItem !== null || staticIndex !== null;
    document.body.style.overflow = locked ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [lightbox, videoItem, staticIndex]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const openImage = useCallback((item: ArchiveItemDB) => {
    if (!item.image_url) return;
    // Collect all image items in current category for navigation
    const imageItems = items
      .filter(i => i.media_type === 'image' && i.image_url)
      .map(i => ({
        src:      i.image_url!,
        title:    (language === 'ka' ? i.title_ka : i.title_en) || i.title_en || '',
        subtitle: (language === 'ka' ? i.description_ka : i.description_en) || undefined,
      }));
    const idx = imageItems.findIndex(li => li.src === item.image_url);
    setLightbox({ items: imageItems, index: Math.max(0, idx) });
  }, [items, language]);

  const closeLightbox = useCallback(() => setLightbox(null), []);
  const navLightbox   = useCallback((dir: 1 | -1) => {
    setLightbox(prev =>
      prev === null ? null : {
        ...prev,
        index: Math.min(Math.max(prev.index + dir, 0), prev.items.length - 1),
      },
    );
  }, []);

  const openVideo  = useCallback((item: ArchiveItemDB) => setVideoItem(item), []);
  const closeVideo = useCallback(() => setVideoItem(null), []);

  // Static poster handlers
  const openStaticPoster  = useCallback((p: StaticPoster) => setStaticIndex(STATIC_POSTERS.indexOf(p)), []);
  const closeStaticLightbox = useCallback(() => setStaticIndex(null), []);
  const navStatic = useCallback((dir: 1 | -1) => {
    setStaticIndex(prev =>
      prev === null ? null : Math.min(Math.max(prev + dir, 0), STATIC_POSTERS.length - 1),
    );
  }, []);

  // ── Active category label ────────────────────────────────────────────────────

  const activeCategory = categories.find(c => c.id === activeCategoryId);

  // ── Render ──────────────────────────────────────────────────────────────────

  const isLoading = catsLoading || itemsLoading;

  // Use static poster fallback when:
  //  • Supabase isn't configured at all
  //  • Categories query errored (table doesn't exist yet)
  //  • Query finished but returned no categories
  const useStaticFallback =
    !supabaseConfigured ||
    !!catsError ||
    (catsFetched && !catsLoading && categories.length === 0);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* Page heading */}
      <div className="pt-28 pb-6 container mx-auto px-6 md:px-12">
        <motion.div {...fadeUp(0)} className="flex items-end gap-4 md:gap-6">
          <span className="hidden md:block h-px flex-1 bg-border/40" />
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium tracking-wide shrink-0">
            {t('nav.archive')}
          </h1>
          <span className="h-px flex-[3] bg-border/40" />
        </motion.div>
      </div>

      {/* ── Dynamic mode (Supabase configured + tables exist) ─── */}
      {!useStaticFallback ? (
        <>
          {/* Category tabs */}
          {!catsLoading && categories.length > 0 && (
            <div className="border-b border-border/30 px-6 md:px-12">
              <div className="container mx-auto overflow-x-auto no-scrollbar">
                <div className="flex gap-1 md:gap-0">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategoryId(cat.id)}
                      className={`shrink-0 px-4 md:px-6 py-3.5 text-xs uppercase tracking-widest border-b-2 transition-colors whitespace-nowrap ${
                        activeCategoryId === cat.id
                          ? 'border-primary text-primary'
                          : 'border-transparent text-foreground/50 hover:text-foreground'
                      }`}
                    >
                      {language === 'ka' ? cat.name_ka : cat.name_en}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Section label */}
          {activeCategory && (
            <motion.div
              {...fadeUp(0)}
              key={activeCategory.id}
              className="pt-12 md:pt-16 pb-6 container mx-auto px-6 md:px-12"
            >
              <div className="flex items-end gap-4 md:gap-6">
                <div className="shrink-0">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-foreground/30 mb-3">
                    {t('nav.archive')}
                  </p>
                  <h2 className="font-serif text-2xl md:text-3xl text-foreground">
                    {language === 'ka' ? activeCategory.name_ka : activeCategory.name_en}
                  </h2>
                </div>
                <span className="h-px flex-1 bg-border/20 mb-2" />
              </div>
            </motion.div>
          )}

          {/* Content */}
          <section className="pb-20 md:pb-28 container mx-auto px-6 md:px-12">
            {isLoading && (
              <div className="flex items-center justify-center gap-3 py-24 text-foreground/40">
                <Loader2 size={20} className="animate-spin" />
                <span className="text-sm">{t('archive.loading')}</span>
              </div>
            )}

            {itemsError && (
              <div className="flex items-center gap-3 py-16 text-red-400/70 text-sm">
                <AlertCircle size={18} className="shrink-0" />
                <span>{t('archive.error')}</span>
              </div>
            )}

            {!isLoading && !itemsError && items.length === 0 && activeCategoryId && (
              <p className="py-24 text-center text-sm text-foreground/30 font-serif text-xl">
                {t('archive.empty')}
              </p>
            )}

            {!isLoading && !itemsError && items.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-8">
                {items.map((item, i) => (
                  <ArchiveCard
                    key={item.id}
                    item={item}
                    language={language}
                    delay={i * 0.05}
                    onClickImage={openImage}
                    onClickVideo={openVideo}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      ) : (
        /* ── Static fallback (Supabase not configured or tables not yet created) ── */
        <section className="pt-10 md:pt-16 pb-20 md:pb-28 container mx-auto px-6 md:px-12">
          <motion.div {...fadeUp(0)} className="flex items-end gap-4 md:gap-6 mb-10 md:mb-16">
            <div className="shrink-0">
              <p className="text-[10px] uppercase tracking-[0.3em] text-foreground/30 mb-3">
                {language === 'ka' ? 'გამოფენის აფიშები' : 'Exhibition Posters'}
              </p>
              <h2 className="font-serif text-2xl md:text-3xl lg:text-4xl text-foreground">
                {language === 'ka' ? 'პლაკატთა სარქველი' : 'Posters Archive'}
              </h2>
            </div>
            <span className="h-px flex-1 bg-border/30 mb-2" />
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
            {STATIC_POSTERS.map((poster, i) => (
              <StaticPosterCard
                key={poster.year}
                poster={poster}
                language={language}
                delay={i * 0.08}
                onClick={openStaticPoster}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Image lightbox ── */}
      <AnimatePresence>
        {lightbox && (
          <ImageLightbox
            items={lightbox.items}
            index={lightbox.index}
            onClose={closeLightbox}
            onNav={navLightbox}
          />
        )}
      </AnimatePresence>

      {/* ── Video modal ── */}
      <AnimatePresence>
        {videoItem && (
          <VideoModal
            item={videoItem}
            title={
              (language === 'ka' ? videoItem.title_ka : videoItem.title_en) ||
              videoItem.title_en || ''
            }
            onClose={closeVideo}
          />
        )}
      </AnimatePresence>

      {/* ── Static poster lightbox ── */}
      <AnimatePresence>
        {staticIndex !== null && (
          <ImageLightbox
            items={STATIC_POSTERS.map(p => ({
              src:      p.src,
              title:    language === 'ka' ? p.titleKa : p.titleEn,
              subtitle: language === 'ka' ? p.subtitleKa : p.subtitleEn,
              caption:  language === 'ka' ? p.captionKa  : p.captionEn,
            }))}
            index={staticIndex}
            onClose={closeStaticLightbox}
            onNav={navStatic}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
