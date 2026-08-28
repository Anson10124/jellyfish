'use client';

import Link from 'next/link';
import { getTmdbImage } from '@/lib/utils/tmdb-image';
import { getGenreName } from '@/constants/genres';
import { useTranslation } from '@/hooks/ui/use-translation';
import { getMediaHref } from '@/lib/utils/media-format';

export interface PosterProps {
  id?: number | string;
  mediaType?: 'movie' | 'tv' | string;
  title: string;
  posterPath: string;
  year?: number | string;
  label?: string;
  genre?: string | number;
  showDetails?: boolean;
  href?: string;
}

export function Poster({
  id,
  mediaType = 'movie',
  title,
  posterPath,
  year,
  label,
  genre,
  showDetails = true,
  href,
}: PosterProps) {
  const { t } = useTranslation();
  const displayYear = year && year !== 0 ? year : null;
  const translatedGenre =
    typeof genre === 'number'
      ? getGenreName(genre, t)
      : typeof genre === 'string' && !isNaN(Number(genre))
      ? getGenreName(Number(genre), t)
      : genre;
  const displayLabel = label || translatedGenre;

  const subtitle = [displayYear, displayLabel].filter(Boolean).join(' • ');

  const targetHref = href || getMediaHref(id, mediaType);

  const content = (
    <div className="w-full shrink-0 text-left focus:outline-none select-none">
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-foreground/4 shadow-lg ring-1 ring-border transition-all duration-200 group-hover/card:scale-[1.025] group-hover/card:ring-foreground/40 group-focus-visible/card:scale-[1.03] group-focus-visible/card:ring-2 group-focus-visible/card:ring-white">
        <img
          src={getTmdbImage(posterPath, 'w342')}
          alt={title}
          loading="lazy"
          decoding="async"
          draggable={false}
          className="object-cover w-full h-full pointer-events-none select-none"
        />
      </div>
      {showDetails && (
        <div className="mt-2 min-w-0">
          <p className="truncate text-[12px] font-semibold transition-colors duration-200 group-hover/card:text-foreground group-focus-visible/card:text-foreground sm:text-[13px] text-foreground/80">
            {title}
          </p>
          {subtitle && (
            <p className="mt-0.5 text-[11px] font-medium leading-none text-foreground/60 drop-shadow-xl">
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );

  if (targetHref) {
    return (
      <Link
        href={targetHref}
        prefetch={false}
        data-focusable="true"
        tabIndex={0}
        className="block w-full focus:outline-none focus-visible:outline-none cursor-pointer rounded-xl group/card"
      >
        {content}
      </Link>
    );
  }

  return (
    <div
      tabIndex={0}
      data-focusable="true"
      className="block w-full focus:outline-none focus-visible:outline-none cursor-pointer rounded-xl group/card"
    >
      {content}
    </div>
  );
}

export default Poster;
