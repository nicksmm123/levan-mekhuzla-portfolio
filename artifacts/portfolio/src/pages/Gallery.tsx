import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { artworks as staticArtworks, type Artwork } from '@/data/artworks';
import { fetchArtworksDB, dbToArtwork, supabaseConfigured } from '@/lib/supabase';
import { useLanguage } from '@/i18n/LanguageContext';
import { Lightbox } from '@/components/Lightbox';
import { Loader2 } from 'lucide-react';

// Explicit union so FilterType is stable even when Artwork['category'] is optional
type CategorySlug = 'original-paintings' | 'limited-edition-prints' | 'graphic-works';
type FilterType = 'all' | CategorySlug;

export const Gallery: React.FC = () => {
  const { t, language } = useLanguage();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedArtworkIndex, setSelectedArtworkIndex] = useState<number | null>(null);

  const { data: liveArtworks, isLoading } = useQuery({
    queryKey: ['artworks'],
    queryFn: async () => {
      const rows = await fetchArtworksDB();
      return rows.map(dbToArtwork);
    },
    enabled: supabaseConfigured,
    staleTime: 30_000,
    retry: 1,
  });

  const artworks: Artwork[] = useMemo(() => {
    if (!supabaseConfigured) return staticArtworks;
    if (liveArtworks !== undefined) return liveArtworks;
    return staticArtworks;
  }, [liveArtworks]);

  const filters: { id: FilterType; label: string }[] = [
    { id: 'all', label: t('filter.all') },
    { id: 'original-paintings', label: t('filter.original-paintings') },
    { id: 'limited-edition-prints', label: t('filter.limited-edition-prints') },
    { id: 'graphic-works', label: t('filter.graphic-works') },
  ];

  const filteredArtworks = useMemo(() => {
    if (activeFilter === 'all') return artworks;
    // Artworks with null/undefined category only appear under 'all'
    return artworks.filter(art => art.category === activeFilter);
  }, [activeFilter, artworks]);

  const handleArtworkClick = (id: string) => {
    const idx = filteredArtworks.findIndex(a => a.id === id);
    if (idx !== -1) setSelectedArtworkIndex(idx);
  };

  const handleCloseLightbox = () => setSelectedArtworkIndex(null);
  const handleNext = () => {
    if (selectedArtworkIndex !== null && selectedArtworkIndex < filteredArtworks.length - 1)
      setSelectedArtworkIndex(selectedArtworkIndex + 1);
  };
  const handlePrev = () => {
    if (selectedArtworkIndex !== null && selectedArtworkIndex > 0)
      setSelectedArtworkIndex(selectedArtworkIndex - 1);
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.3 } },
  };

  return (
    <div className="pt-32 pb-24 px-6 md:px-12 container mx-auto">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-center gap-3 md:gap-8 mb-10 md:mb-16">
        {filters.map(filter => (
          <button
            key={filter.id}
            data-testid={`filter-${filter.id}`}
            onClick={() => setActiveFilter(filter.id)}
            className={`text-xs md:text-sm uppercase tracking-widest transition-all duration-300 pb-1 border-b ${
              activeFilter === filter.id
                ? 'border-primary text-primary font-medium'
                : 'border-transparent text-foreground/60 hover:text-foreground'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {isLoading && !liveArtworks && (
        <div className="flex justify-center mb-8">
          <Loader2 size={18} className="animate-spin text-foreground/30" />
        </div>
      )}

      {/* Masonry Gallery */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="columns-1 md:columns-2 lg:columns-3 gap-6 md:gap-8"
      >
        <AnimatePresence mode="popLayout">
          {filteredArtworks.map(artwork => {
            // Resolve display title with graceful fallback
            const title =
              language === 'ka'
                ? (artwork.titleKa || artwork.titleEn || '')
                : (artwork.titleEn || artwork.titleKa || '');

            return (
              <motion.div
                key={artwork.id}
                layout
                variants={itemVariants}
                initial="hidden"
                animate="show"
                exit="exit"
                className="relative group cursor-pointer break-inside-avoid overflow-hidden bg-card border border-border/50 mb-6 md:mb-8"
                onClick={() => handleArtworkClick(artwork.id)}
                data-testid={`gallery-card-${artwork.id}`}
              >
                <div className="w-full relative aspect-auto">
                  <img
                    src={artwork.imageUrl}
                    alt={title || 'Artwork'}
                    className="w-full h-auto object-cover transform transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                  {/* Hover Overlay — only shown when there's something to display */}
                  {(title || artwork.year != null) && (
                    <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm">
                      {title && (
                        <h3 className="font-serif text-2xl text-foreground mb-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                          {title}
                        </h3>
                      )}
                      {artwork.year != null && (
                        <p className="text-primary tracking-widest text-sm uppercase transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 delay-75">
                          {artwork.year}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {filteredArtworks.length === 0 && !isLoading && (
        <div className="py-32 text-center text-foreground/50">
          <p className="font-serif text-2xl">No works found in this category.</p>
        </div>
      )}

      {selectedArtworkIndex !== null && (
        <Lightbox
          artwork={filteredArtworks[selectedArtworkIndex]}
          onClose={handleCloseLightbox}
          onNext={selectedArtworkIndex < filteredArtworks.length - 1 ? handleNext : undefined}
          onPrev={selectedArtworkIndex > 0 ? handlePrev : undefined}
        />
      )}
    </div>
  );
};
