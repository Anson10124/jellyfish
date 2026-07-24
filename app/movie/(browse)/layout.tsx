'use client';

import React from 'react';
import { GenreBar } from '@/components/media';

export default function MovieBrowseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="w-full max-w-full overflow-x-clip pt-20 pb-16 space-y-8">
      <GenreBar />
      {children}
    </main>
  );
}
