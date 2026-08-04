'use client';

import React from 'react';
import { PADDING_X_CLASSES } from '@/constants/carousel';
import { useTranslation } from '@/hooks/ui/use-translation';

export interface FactItem {
  key: string;
  label: string;
  value: React.ReactNode;
}

export interface MediaFactsGridProps {
  items: (FactItem | null | undefined)[];
  title?: string;
  className?: string;
}

export function MediaFactsGrid({ items, title, className = '' }: MediaFactsGridProps) {
  const { t } = useTranslation();
  const validItems = items.filter((item): item is FactItem => Boolean(item && item.value));

  if (validItems.length === 0) return null;

  return (
    <section className={`relative z-10 ${PADDING_X_CLASSES} ${className}`}>
      <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground mb-4">
        {title || t('movies.details', 'Details')}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 sm:gap-6 text-xs sm:text-sm">
        {validItems.map((item) => (
          <div key={item.key}>
            <p className="text-foreground/50 font-medium">{item.label}</p>
            <p className="text-foreground/90 font-semibold mt-1">{item.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
