import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/i18n/LanguageContext';

// Detailed exhibition data sourced from the artist's actual CV
interface Exhibition {
  year: number | string;
  venue: string;
  location: string;
}

const personal: Exhibition[] = [
  { year: 1992, venue: 'Museum of Fine Arts', location: 'Tbilisi / სახვითი ხელოვნების მუზეუმი, თბილისი' },
  { year: 1994, venue: 'Galerie Etienne de Causans', location: 'Paris' },
  { year: 1994, venue: 'Galerie Darial', location: 'Paris' },
  { year: 1995, venue: 'Galerie Carhlian', location: 'Paris' },
  { year: 1996, venue: 'Centre Culturel', location: 'Ciney, Belgium / ქალაქ სინეს კულტურული ცენტრი, ბელგია' },
  { year: 1997, venue: 'Ivert-Bank', location: 'Tbilisi / ივერთ-ბანკი, თბილისი' },
  { year: 1998, venue: 'Atelier d\'artiste', location: 'Tbilisi / მხატვრის სახელოსნო, თბილისი' },
  { year: 1999, venue: 'Atelier d\'Archy-Yulzari', location: 'Paris' },
  { year: 2000, venue: 'Cité Internationale des Arts', location: 'Paris' },
  { year: 2000, venue: 'L\'Association Philomuses', location: 'Paris' },
  { year: 2002, venue: 'Galerie Samedi', location: 'Montfort l\'Amaury, France' },
  { year: 2003, venue: 'Galerie Ileana Bouboulis', location: 'Paris' },
  { year: 2004, venue: 'Gallery Orient', location: 'Tbilisi / გალერეა ორიენტი, თბილისი' },
  { year: 2007, venue: 'Gallery Baia', location: 'Tbilisi / ბაიას გალერეა, თბილისი' },
  { year: 2008, venue: 'Gallery Opera Design', location: 'Tbilisi / გალერეა ოპერა დიზაინ, თბილისი' },
  { year: 2009, venue: 'Tsinandali Palace', location: 'Georgia / ჭავჭავაძეების სასახლე, წინანდალი' },
  { year: 2009, venue: 'L\'Association Philomuses', location: 'Paris' },
  { year: 2010, venue: 'Atelier d\'Archy-Yulzari', location: 'Paris' },
  { year: 2015, venue: 'Gallery Baia', location: 'Tbilisi / ბაიას გალერეა, თბილისი' },
  { year: 2019, venue: 'L\'Association Philomuses', location: 'Paris' },
  { year: 2025, venue: 'Gallery Chardin', location: 'Tbilisi / გალერეა შარდენი, თბილისი' },
  { year: 2025, venue: 'Resident, Cité Internationale des Arts', location: 'Paris' },
  { year: 2026, venue: 'Gallery Chardin', location: 'Tbilisi / გალერეა შარდენი, თბილისი' },
];

const group: Exhibition[] = [
  { year: 1990, venue: 'Gallérie Moscow', location: 'Toronto, Canada' },
  { year: 1993, venue: 'La Franche-Comté', location: 'Tourinnes-La-Grosse, Belgium' },
  { year: 2000, venue: 'Galerie Ileana Bouboulis', location: 'Paris' },
  { year: 2001, venue: 'Galerie Claudine Legrand', location: 'Paris' },
  { year: 2003, venue: '6ème Pavillon des Antiquaires et des Beaux-Arts', location: 'Paris' },
  { year: 2009, venue: 'Grand Palais', location: 'Paris' },
  { year: 2018, venue: 'Tbilisi Art Fair', location: 'Tbilisi / არტ ფეარი, თბილისი' },
  { year: 2019, venue: 'Gallery Chardin', location: 'Tbilisi / გალერეა შარდენი, თბილისი' },
  { year: 2020, venue: 'Gallery Baia', location: 'Tbilisi / ბაიას გალერეა, თბილისი' },
  { year: 2022, venue: 'Tbilisi Art Fair', location: 'Tbilisi / არტ ფეარი, თბილისი' },
  { year: 2024, venue: 'Tbilisi Art Fair', location: 'Tbilisi / არტ ფეარი, თბილისი' },
  { year: 2024, venue: 'Gallery Chardin', location: 'Tbilisi / გალერეა შარდენი, თბილისი' },
  { year: 2026, venue: 'Tbilisi Art Fair', location: 'Tbilisi / არტ ფეარი, თბილისი' },
];

type Tab = 'personal' | 'group';

const TimelineEntry: React.FC<{
  ex: Exhibition;
  index: number;
  isLast: boolean;
}> = ({ ex, index, isLast }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 20 }}
    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: index * 0.05 }}
    className="relative flex gap-6 md:gap-10 group"
  >
    {/* Timeline spine */}
    <div className="flex flex-col items-center flex-shrink-0 w-14 md:w-20">
      <div className="w-3 h-3 rounded-full border-2 border-primary bg-background mt-1 flex-shrink-0 group-hover:bg-primary transition-colors duration-300 z-10" />
      {!isLast && <div className="w-px flex-1 bg-border/40 mt-1" />}
    </div>

    {/* Content */}
    <div className="pb-10 flex-1">
      <span className="inline-block font-mono text-xs text-primary tracking-widest mb-2">
        {ex.year}
      </span>
      <h3 className="font-serif text-xl md:text-2xl text-foreground leading-tight mb-1 group-hover:text-primary transition-colors duration-300">
        {ex.venue}
      </h3>
      <p className="text-sm text-foreground/50 tracking-wide">
        {ex.location}
      </p>
    </div>
  </motion.div>
);

export const Exhibitions: React.FC = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<Tab>('personal');

  const entries = activeTab === 'personal' ? personal : group;

  return (
    <div className="min-h-screen pt-28 pb-24">
      {/* Page heading */}
      <div className="container mx-auto px-6 md:px-12 mb-12 md:mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-end gap-6"
        >
          <span className="hidden md:block h-px flex-1 bg-border/50" />
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium tracking-wide text-foreground">
            {t('exhibitions.title')}
          </h1>
          <span className="h-px flex-[3] bg-border/50" />
        </motion.div>
      </div>

      <div className="container mx-auto px-6 md:px-12">
        {/* Tab toggle */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="flex gap-2 mb-14 border-b border-border/40"
        >
          {(['personal', 'group'] as Tab[]).map((tab) => (
            <button
              key={tab}
              data-testid={`tab-${tab}`}
              onClick={() => setActiveTab(tab)}
              className={`relative pb-4 px-1 text-sm uppercase tracking-widest transition-colors duration-300 ${
                activeTab === tab ? 'text-primary' : 'text-foreground/50 hover:text-foreground'
              }`}
            >
              {tab === 'personal' ? t('exhibitions.personal') : t('exhibitions.group')}
              {activeTab === tab && (
                <motion.span
                  layoutId="tab-underline"
                  className="absolute bottom-0 left-0 right-0 h-px bg-primary"
                />
              )}
            </button>
          ))}
        </motion.div>

        {/* Timeline */}
        <div className="max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {entries.map((ex, i) => (
                <TimelineEntry
                  key={`${ex.year}-${ex.venue}-${i}`}
                  ex={ex}
                  index={i}
                  isLast={i === entries.length - 1}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
