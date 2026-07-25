'use client';

import React from 'react';
import { GenreBrowseView } from '@/components/media';

interface MovieGenrePageProps {
  params: Promise<{ id: string }>;
}

export default function MovieGenrePage({ params }: MovieGenrePageProps) {
  return <GenreBrowseView mediaType="movie" params={params} />;
}
