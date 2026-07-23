'use client';

import React from 'react';
import { getTmdbImage } from '@/lib/utils/tmdb-image';
import type { CastMember, CrewMember } from '@/types/media';

export interface CastCardProps {
  cast?: CastMember | CrewMember;
  name?: string;
  character?: string;
  role?: string;
  profilePath?: string | null;
  className?: string;
}

export function CastCard({
  cast,
  name,
  character,
  role,
  profilePath,
  className = '',
}: CastCardProps) {
  const displayName = name || cast?.name || 'Unknown';
  const displayRole =
    character ||
    role ||
    (cast && 'character' in cast && cast.character ? cast.character : undefined) ||
    (cast && 'job' in cast && cast.job ? cast.job : undefined);
  const rawPath = profilePath !== undefined ? profilePath : cast?.profile_path;

  const imageUrl = rawPath
    ? getTmdbImage(rawPath, 'w342')
    : `https://placehold.co/342x513/18181b/a1a1aa?text=${encodeURIComponent(displayName)}`;

  return (
    <div className={`group w-full shrink-0 text-left focus:outline-none cursor-pointer select-none ${className}`}>
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-white/4 shadow-lg ring-1 ring-white/5 transition duration-300 group-hover:scale-[1.025] group-hover:ring-white/40">
        <img
          src={imageUrl}
          alt={displayName}
          loading="lazy"
          decoding="async"
          draggable={false}
          className="object-cover w-full h-full pointer-events-none select-none"
        />
      </div>
      <div className="mt-2 min-w-0">
        <p className="truncate text-[12px] font-semibold transition-colors duration-300 group-hover:text-white sm:text-[13px] text-white/80">
          {displayName}
        </p>
        {displayRole && (
          <p className="mt-0.5 truncate text-[11px] font-medium leading-none text-white/60 drop-shadow-xl">
            {displayRole}
          </p>
        )}
      </div>
    </div>
  );
}

export default CastCard;
