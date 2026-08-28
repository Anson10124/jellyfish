'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { JellyfinUserView } from '@/types/jellyfin';
import { JellyfinService } from '@/services/jellyfin.service';

export interface LibraryCardProps {
  library: JellyfinUserView;
  serverUrl?: string;
  className?: string;
}

export function LibraryCard({ library, serverUrl, className = '' }: LibraryCardProps) {
  const [imgError, setImgError] = useState(false);

  const imageUrl =
    serverUrl && library.Id && !imgError
      ? JellyfinService.getImageUrl(serverUrl, library.Id, { width: 640, type: 'Primary' })
      : null;

  const libraryPath =
    library.Path ||
    (library.Locations && library.Locations.length > 0 ? library.Locations[0] : null) ||
    (library.CollectionType ? `/${library.CollectionType.toLowerCase()}` : `/${library.Name.toLowerCase()}`);

  return (
    <Link
      href={`/library/${library.Id}`}
      prefetch={false}
      data-focusable="true"
      tabIndex={0}
      className={`block group/lib w-full shrink-0 text-left select-none cursor-pointer focus:outline-none focus-visible:outline-none rounded-xl ${className}`}
    >
      <div className="relative aspect-[16/9] overflow-hidden rounded-xl shadow-lg ring-1 ring-white/10 transition-all duration-200 group-hover/lib:scale-[1.025] group-hover/lib:ring-white/40 group-focus-visible/lib:scale-[1.03] group-focus-visible/lib:ring-2 group-focus-visible/lib:ring-white">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={library.Name}
            loading="lazy"
            decoding="async"
            draggable={false}
            onError={() => setImgError(true)}
            className="object-cover w-full h-full pointer-events-none select-none"
          />
        ) : (
          <img
            src={`https://placehold.co/640x360/18181b/a1a1aa?text=${encodeURIComponent(library.Name)}`}
            alt={library.Name}
            loading="lazy"
            decoding="async"
            draggable={false}
            onError={() => setImgError(true)}
            className="object-cover w-full h-full pointer-events-none select-none"
          />
        )}
      </div>
      <div className="mt-2.5 min-w-0">
        <p className="truncate text-[13px] font-semibold transition-colors duration-200 group-hover/lib:text-white group-focus-visible/lib:text-white sm:text-[14px] text-white/90">
          {library.Name}
        </p>
        <p className="mt-0.5 truncate text-[11px] font-medium leading-none text-white/50">
          {libraryPath}
        </p>
      </div>
    </Link>
  );
}

export default LibraryCard;
