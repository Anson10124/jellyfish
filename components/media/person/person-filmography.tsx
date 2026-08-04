'use client';

import React, { useState, useMemo } from 'react';
import { Film, Tv } from 'lucide-react';
import { useTranslation } from '@/hooks/ui/use-translation';
import { PADDING_X_CLASSES } from '@/constants/carousel';
import { Poster } from '@/components/media/cards';
import { getCreditRoleLabel } from '@/lib/utils/media-format';
import type { PersonCastCredit, PersonCrewCredit } from '@/types/media';

export interface PersonFilmographyProps {
  actingCredits: PersonCastCredit[];
  crewCredits: PersonCrewCredit[];
}

export function PersonFilmography({
  actingCredits,
  crewCredits,
}: PersonFilmographyProps) {
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<'all' | 'acting' | 'crew'>('all');
  const [mediaFilter, setMediaFilter] = useState<'all' | 'movie' | 'tv'>('all');

  const filteredCredits = useMemo(() => {
    let credits: (PersonCastCredit | PersonCrewCredit)[] = [];

    if (activeTab === 'acting') {
      credits = actingCredits;
    } else if (activeTab === 'crew') {
      credits = crewCredits;
    } else {
      const combinedMap = new Map<string, PersonCastCredit | PersonCrewCredit>();
      [...actingCredits, ...crewCredits].forEach((item) => {
        const key = `${item.media_type}-${item.id}`;
        if (!combinedMap.has(key)) {
          combinedMap.set(key, item);
        }
      });
      credits = Array.from(combinedMap.values());
    }

    if (mediaFilter !== 'all') {
      credits = credits.filter((item) => item.media_type === mediaFilter);
    }

    return credits.slice().sort((a, b) => {
      const dateA = a.release_date || a.first_air_date || '0000-00-00';
      const dateB = b.release_date || b.first_air_date || '0000-00-00';
      return dateB.localeCompare(dateA);
    });
  }, [actingCredits, crewCredits, activeTab, mediaFilter]);

  const totalCount = actingCredits.length + crewCredits.length;

  return (
    <section className={`space-y-6 pt-4 ${PADDING_X_CLASSES}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          {t('person.appearances', 'Appearances')}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center p-1 rounded-xl bg-foreground/6 ring-1 ring-border">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-foreground/15 text-foreground shadow-sm'
                  : 'text-foreground/60 hover:text-foreground'
              }`}
            >
              {t('person.all', 'All')} ({totalCount})
            </button>
            {actingCredits.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('acting')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'acting'
                    ? 'bg-foreground/15 text-foreground shadow-sm'
                    : 'text-foreground/60 hover:text-foreground'
                }`}
              >
                {t('person.acting', 'Acting')} ({actingCredits.length})
              </button>
            )}
            {crewCredits.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('crew')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'crew'
                    ? 'bg-foreground/15 text-foreground shadow-sm'
                    : 'text-foreground/60 hover:text-foreground'
                }`}
              >
                {t('person.crew', 'Crew')} ({crewCredits.length})
              </button>
            )}
          </div>
          <div className="flex items-center p-1 rounded-xl bg-foreground/6 ring-1 ring-border">
            <button
              type="button"
              onClick={() => setMediaFilter('all')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                mediaFilter === 'all'
                  ? 'bg-foreground/15 text-foreground shadow-sm'
                  : 'text-foreground/60 hover:text-foreground'
              }`}
            >
              {t('common.all', 'All')}
            </button>
            <button
              type="button"
              onClick={() => setMediaFilter('movie')}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                mediaFilter === 'movie'
                  ? 'bg-foreground/15 text-foreground shadow-sm'
                  : 'text-foreground/60 hover:text-foreground'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              {t('person.movies', 'Movies')}
            </button>
            <button
              type="button"
              onClick={() => setMediaFilter('tv')}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                mediaFilter === 'tv'
                  ? 'bg-foreground/15 text-foreground shadow-sm'
                  : 'text-foreground/60 hover:text-foreground'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              {t('person.tvShows', 'TV Shows')}
            </button>
          </div>
        </div>
      </div>
      {filteredCredits.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4 sm:gap-5">
          {filteredCredits.map((item, idx) => {
            const title = item.title || item.name || 'Untitled';
            const roleLabel = getCreditRoleLabel(item);

            return (
              <Poster
                key={`${item.media_type}-${item.id}-${idx}`}
                id={item.id}
                mediaType={item.media_type}
                title={title}
                posterPath={(item.poster_path || item.backdrop_path || '') as string}
                label={roleLabel}
              />
            );
          })}
        </div>
      ) : (
        <div className="py-12 text-center text-foreground/50 text-sm">
          {t('person.noCreditsFound', 'No credits found for the selected filter.')}
        </div>
      )}
    </section>
  );
}

export default PersonFilmography;
