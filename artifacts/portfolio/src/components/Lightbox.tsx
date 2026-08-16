import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Artwork } from '@/data/artworks';
import { useLanguage } from '@/i18n/LanguageContext';
import { Link } from 'wouter';

interface LightboxProps {
  artwork: Artwork;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
}

export const Lightbox: React.FC<LightboxProps> = ({ artwork, onClose, onNext, onPrev }) => {
  const { t, language } = useLanguage();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && onNext) onNext();
      if (e.key === 'ArrowLeft' && onPrev) onPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNext, onPrev]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  // Resolve displayed title — prefer the active language, fall back to the other
  const title =
    language === 'ka'
      ? (artwork.titleKa || artwork.titleEn || '')
      : (artwork.titleEn || artwork.titleKa || '');

  // Resolve medium
  const medium =
    language === 'ka' && artwork.mediumKa
      ? artwork.mediumKa
      : (artwork.medium || null);

  const isAvailable = artwork.status === 'available';
  const hasStatus   = artwork.status != null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm p-4 md:p-8"
        onClick={onClose}
        data-testid="lightbox-backdrop"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-7xl max-h-full flex flex-col md:flex-row bg-card border border-border shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Close */}
          <button
            onClick={onClose}
            data-testid="lightbox-close"
            className="absolute top-4 right-4 z-10 p-2 bg-background/50 hover:bg-background rounded-full transition-colors text-foreground"
            aria-label={t('lightbox.close')}
          >
            <X size={24} strokeWidth={1.5} />
          </button>

          {/* Prev / Next */}
          {onPrev && (
            <button
              onClick={onPrev}
              data-testid="lightbox-prev"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-background/30 hover:bg-background/80 rounded-full transition-colors text-foreground hidden md:flex"
            >
              <ChevronLeft size={32} strokeWidth={1} />
            </button>
          )}
          {onNext && (
            <button
              onClick={onNext}
              data-testid="lightbox-next"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-background/30 hover:bg-background/80 rounded-full transition-colors text-foreground hidden md:flex"
            >
              <ChevronRight size={32} strokeWidth={1} />
            </button>
          )}

          {/* Image */}
          <div className="w-full md:w-2/3 h-[50vh] md:h-[85vh] relative bg-black/20 flex items-center justify-center p-4">
            <motion.img
              key={artwork.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              src={artwork.imageUrl}
              alt={title || 'Artwork'}
              className="max-w-full max-h-full object-contain shadow-2xl"
            />
          </div>

          {/* Metadata Panel */}
          <div className="w-full md:w-1/3 p-6 md:p-12 flex flex-col justify-center bg-card border-l border-border/50 overflow-y-auto">
            {title && (
              <h2 className="font-serif text-3xl md:text-4xl mb-6 text-foreground leading-tight">
                {title}
              </h2>
            )}

            {/* Metadata rows — each hidden when value is absent */}
            <div className="space-y-4 text-sm md:text-base text-foreground/80 mb-10">
              {artwork.year != null && (
                <div className="flex justify-between border-b border-border/40 pb-2">
                  <span className="uppercase tracking-widest text-xs text-foreground/50 font-medium">
                    {t('lightbox.year')}
                  </span>
                  <span>{artwork.year}</span>
                </div>
              )}

              {medium && (
                <div className="flex justify-between border-b border-border/40 pb-2">
                  <span className="uppercase tracking-widest text-xs text-foreground/50 font-medium">
                    {t('lightbox.medium')}
                  </span>
                  <span className="text-right pl-4">{medium}</span>
                </div>
              )}

              {artwork.dimensions && (
                <div className="flex justify-between border-b border-border/40 pb-2">
                  <span className="uppercase tracking-widest text-xs text-foreground/50 font-medium">
                    {t('lightbox.dimensions')}
                  </span>
                  <span>{artwork.dimensions}</span>
                </div>
              )}

              {artwork.price != null && (
                <div className="flex justify-between border-b border-border/40 pb-2">
                  <span className="uppercase tracking-widest text-xs text-foreground/50 font-medium">
                    {language === 'ka' ? 'ფასი' : 'Price'}
                  </span>
                  <span className="font-medium text-primary">
                    {artwork.price.toLocaleString('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      maximumFractionDigits: 0,
                    })}
                  </span>
                </div>
              )}

              {hasStatus && (
                <div className="flex justify-between items-center pt-2">
                  <span className="uppercase tracking-widest text-xs text-foreground/50 font-medium">
                    {t('lightbox.status')}
                  </span>
                  <span
                    className={`px-3 py-1 text-xs tracking-wider uppercase font-medium border ${
                      isAvailable
                        ? 'border-primary text-primary bg-primary/5'
                        : 'border-border text-foreground/50'
                    }`}
                  >
                    {isAvailable ? t('lightbox.available') : t('lightbox.private-collection')}
                  </span>
                </div>
              )}
            </div>

            {/* CTA */}
            <div className="mt-auto pt-8">
              {hasStatus ? (
                isAvailable ? (
                  <Link href="/contact" onClick={onClose} className="block w-full">
                    <button className="w-full py-4 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-medium tracking-widest uppercase text-sm transition-all duration-300">
                      {t('lightbox.inquire')}
                    </button>
                  </Link>
                ) : (
                  <button disabled className="w-full py-4 px-6 bg-muted text-muted-foreground font-medium tracking-widest uppercase text-sm cursor-not-allowed">
                    {t('lightbox.private-collection')}
                  </button>
                )
              ) : (
                /* No status set — show a generic inquiry button */
                <Link href="/contact" onClick={onClose} className="block w-full">
                  <button className="w-full py-4 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-medium tracking-widest uppercase text-sm transition-all duration-300">
                    {t('lightbox.inquire')}
                  </button>
                </Link>
              )}
            </div>

            {/* Mobile Nav Controls */}
            <div className="flex justify-between mt-8 md:hidden">
              <button
                onClick={onPrev}
                disabled={!onPrev}
                className="flex items-center text-sm uppercase tracking-widest opacity-70 disabled:opacity-30"
              >
                <ChevronLeft size={16} className="mr-1" /> {t('lightbox.prev')}
              </button>
              <button
                onClick={onNext}
                disabled={!onNext}
                className="flex items-center text-sm uppercase tracking-widest opacity-70 disabled:opacity-30"
              >
                {t('lightbox.next')} <ChevronRight size={16} className="ml-1" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
