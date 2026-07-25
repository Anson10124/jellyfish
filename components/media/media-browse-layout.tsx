'use client';

import React from 'react';
import { GenreBar } from './genre-bar';

interface MediaBrowseLayoutProps {
  mediaType: 'movie' | 'tv';
  children: React.ReactNode;
}

export function MediaBrowseLayout({ mediaType, children }: MediaBrowseLayoutProps) {
  return (
    <main className="w-full max-w-full overflow-x-clip pt-20 pb-16 space-y-8">
      <GenreBar mediaType={mediaType} />
      {children}
    </main>
  );
}

export default MediaBrowseLayout;
