import { getTmdbImage } from '@/lib/utils/tmdb-image';

interface PosterProps {
  title: string;
  posterPath: string;
  year?: number | string;
  label?: string;
  genre?: string;
  showDetails?: boolean;
}

export function Poster({
  title,
  posterPath,
  year,
  label,
  genre,
  showDetails = true,
}: PosterProps) {
  const displayYear = year && year !== 0 ? year : null;
  const displayLabel = label || genre;

  const subtitle = [displayYear, displayLabel].filter(Boolean).join(' • ');

  return (
    <div className="group w-full shrink-0 snap-start text-left focus:outline-none cursor-pointer select-none">
      <div className="relative aspect-[2/3] overflow-hidden rounded-[14px] bg-white/4 shadow-lg ring-1 ring-white/5 transition duration-300 group-hover:scale-[1.025] group-hover:ring-white/40">
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
            <p className="mt-[3px] text-[11px] font-medium leading-none text-white/[0.60] drop-shadow-xl">
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
}