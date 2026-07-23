'use client';

import Carousel from '@/components/media/carousel';

export default function HomePage() {
  return (
    <main className="w-full max-w-full overflow-x-hidden py-6 space-y-10">
      <Carousel
        title="Trending Today"
        subtitle="What everyone is watching right now across movies & TV"
        type="trending"
        mediaType="all"
        timeWindow="day"
        infinite={true}
      />
      <Carousel
        title="Action Blockbusters"
        subtitle="Adrenaline-filled action movies"
        genreId={28}
        mediaType="movie"
        infinite={true}
      />
      <Carousel
        title="Action & Adventure TV"
        subtitle="High-octane action TV series"
        genreId={28}
        mediaType="tv"
        infinite={true}
      />
      <Carousel
        title="Comedy Hits"
        subtitle="Hilarious movies & TV series"
        genreId={35}
        mediaType="all"
        infinite={true}
      />
      <Carousel
        title="Popular Movies"
        subtitle="Most popular movies"
        type="popular"
        mediaType="movie"
        infinite={true}
      />
    </main>
  );
}