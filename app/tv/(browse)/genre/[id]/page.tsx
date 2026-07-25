'use client';

import React from 'react';
import { GenreBrowseView } from '@/components/media';

interface TvGenrePageProps {
  params: Promise<{ id: string }>;
}

export default function TvGenrePage({ params }: TvGenrePageProps) {
  return <GenreBrowseView mediaType="tv" params={params} />;
}
