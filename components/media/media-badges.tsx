'use client';

import React from 'react';
import { Star, Calendar, Clock, Tv } from 'lucide-react';
import { getGenreName } from '@/constants/genres';
import { useTranslation } from '@/hooks/ui/use-translation';
import { LiquidGlass, type LiquidGlassProps } from '@/components/ui/liquid-glass';

export interface MediaBadgesProps {
  voteAverage?: string | number | null;
  releaseYear?: string | number | null;
  formattedAirYears?: string | null;
  runtime?: string | null;
  numberOfSeasons?: number | null;
  genres?: { id: number; name?: string }[];
  genreIds?: number[];
  maxGenres?: number;
  className?: string;
}

function Badge(props: LiquidGlassProps) {
  return (
    <LiquidGlass
      radius={14}
      className="inline-flex h-9 items-center gap-2 rounded-xl px-4 text-[13px] font-medium text-foreground/80"
      glassClassName="bg-foreground/8"
      fallbackClassName="bg-foreground/12 ring-1 ring-foreground/8 backdrop-blur-2xl"
      {...props}
    />
  );
}

export function MediaBadges({
  voteAverage,
  releaseYear,
  formattedAirYears,
  runtime,
  numberOfSeasons,
  genres,
  genreIds,
  maxGenres,
  className = '',
}: MediaBadgesProps) {
  const { t } = useTranslation();

  const formattedVote = voteAverage
    ? typeof voteAverage === 'number'
      ? voteAverage.toFixed(1)
      : voteAverage
    : null;

  const displayYear = releaseYear || formattedAirYears;

  const resolvedGenres = React.useMemo(() => {
    let list: { id: number; name: string }[] = [];
    if (genres && genres.length > 0) {
      list = genres
        .map((g) => ({ id: g.id, name: getGenreName(g.id, t) || g.name || '' }))
        .filter((g) => Boolean(g.name));
    } else if (genreIds && genreIds.length > 0) {
      list = genreIds
        .map((gId) => ({ id: gId, name: getGenreName(gId, t) }))
        .filter((g) => Boolean(g.name));
    }
    if (maxGenres && maxGenres > 0) {
      return list.slice(0, maxGenres);
    }
    return list;
  }, [genres, genreIds, maxGenres, t]);

  if (!formattedVote && !displayYear && !runtime && !numberOfSeasons && resolvedGenres.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 sm:gap-2.5 ${className}`}>
      {formattedVote && (
        <Badge>
          <Star className="h-4 w-4 text-foreground fill-foreground" />
          <span>{formattedVote}</span>
        </Badge>
      )}

      {displayYear && (
        <Badge>
          <Calendar className="h-4 w-4 text-foreground/70" />
          <span>{displayYear}</span>
        </Badge>
      )}

      {numberOfSeasons !== undefined && numberOfSeasons !== null && numberOfSeasons > 0 && (
        <Badge>
          <Tv className="h-4 w-4 text-foreground/70" />
          <span>
            {numberOfSeasons}{' '}
            {numberOfSeasons === 1 ? t('tv.season', 'Season') : t('tv.seasons', 'Seasons')}
          </span>
        </Badge>
      )}

      {runtime && (
        <Badge>
          <Clock className="h-4 w-4 text-foreground/70" />
          <span>{runtime}</span>
        </Badge>
      )}

      {resolvedGenres.map((g) => (
        <Badge key={g.id} render={<span />}>
          {g.name}
        </Badge>
      ))}
    </div>
  );
}

export default MediaBadges;
