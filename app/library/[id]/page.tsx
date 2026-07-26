'use client';

import React from 'react';
import { LibraryBrowseView } from '@/components/media';

interface LibraryDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function LibraryDetailPage({ params }: LibraryDetailPageProps) {
  return (
    <main className="w-full max-w-full overflow-x-clip pt-28 pb-16 space-y-8">
      <LibraryBrowseView params={params} />
    </main>
  );
}
