'use client';

import Link from 'next/link';
import { getTmdbImage } from '@/lib/utils/tmdb-image';
import { getGenreName } from '@/constants/genres';
import { useTranslation } from '@/hooks/use-translation';
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
    <div className="group w-full shrink-0 text-left focus:outline-none cursor-pointer select-none">
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-white/4 shadow-lg ring-1 ring-white/5 transition duration-300 group-hover:scale-[1.025] group-hover:ring-white/40">
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
          <p className="truncate text-[12px] font-semibold transition-colors duration-300 group-hover:text-white sm:text-[13px] text-white/80">
            {title}
          </p>
          {subtitle && (
            <p className="mt-0.5 text-[11px] font-medium leading-none text-white/60 drop-shadow-xl">
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );

  if (targetHref) {
    return (
      <Link href={targetHref} className="block w-full focus:outline-none">
        {content}
      </Link>
    );
  }

  return content;
}

export default Poster;