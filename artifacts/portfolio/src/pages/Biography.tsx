import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/i18n/LanguageContext';


const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] as const, delay: i * 0.12 },
  }),
};

export const Biography: React.FC = () => {
  const { t } = useLanguage();

  const paragraphs = [
    t('bio.paragraph1'),
    t('bio.paragraph2'),
    t('bio.paragraph3'),
    t('bio.paragraph4'),
  ];

  return (
    <div className="min-h-screen pt-28 pb-24">
      {/* Page heading */}
      <div className="container mx-auto px-6 md:px-12 mb-16 md:mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-end gap-6"
        >
          <span className="hidden md:block h-px flex-1 bg-border/50" />
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium tracking-wide text-foreground">
            {t('bio.title')}
          </h1>
          <span className="h-px flex-[3] bg-border/50" />
        </motion.div>
      </div>

      {/* Two-column layout */}
      <div className="container mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 md:gap-16 lg:gap-20 items-start">
          {/* Portrait column */}
          <motion.div
            className="md:col-span-2 md:sticky md:top-28"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          >
            <div className="relative overflow-hidden bg-card border border-border/50">
              <img
                src={`${import.meta.env.BASE_URL}portrait.jpg`}
                alt={t('bio.alt')}
                className="w-full object-cover object-top"
                style={{ minHeight: 'clamp(280px, 55vw, 480px)' }}
              />
            </div>
            {/* Caption strip */}
            <div className="mt-4 flex flex-col gap-1">
              <p className="text-xs uppercase tracking-widest text-foreground/50">
                {t('bio.alt')}
              </p>
            </div>

            {/* Key facts */}
            <div className="mt-8 grid grid-cols-1 gap-4">
              {[
                { label: t('bio.born') },
                { label: t('bio.union') },
                { label: t('bio.residence') },
              ].map(({ label }, i) => (
                <motion.div
                  key={i}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  animate="show"
                  className="flex items-start gap-3"
                >
                  <span className="mt-[6px] block w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                  <span className="text-sm text-foreground/70 leading-snug">{label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Text column */}
          <div className="md:col-span-3 flex flex-col gap-8">
            {paragraphs.map((para, i) => (
              <motion.p
                key={i}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                animate="show"
                className="font-sans text-base md:text-lg leading-[1.85] text-foreground/80"
              >
                {para}
              </motion.p>
            ))}

            {/* Professional activities — from main branch */}
            <motion.div
              custom={paragraphs.length}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="border-l-2 border-primary/30 pl-6 py-1 mt-2"
            >
              <p className="text-xs tracking-[0.2em] uppercase text-primary/60 mb-2 font-light">
                {t('bio.activities-label')}
              </p>
              <p className="font-serif text-lg leading-relaxed text-foreground/70 italic">
                {t('bio.activities')}
              </p>
            </motion.div>

            {/* Decorative closing rule */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ delay: 0.8, duration: 1, ease: [0.22, 1, 0.36, 1] }}
              style={{ originX: 0 }}
              className="mt-4 h-px bg-gradient-to-r from-primary/60 to-transparent w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
