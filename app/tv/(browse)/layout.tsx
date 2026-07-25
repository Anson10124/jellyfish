'use client';

import React from 'react';
import { MediaBrowseLayout } from '@/components/media';

export default function TvBrowseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MediaBrowseLayout mediaType="tv">{children}</MediaBrowseLayout>;
}
