'use client';

import Carousel from '@/components/media/carousel';
import Top10Carousel from '@/components/media/top-10-carousel';

export default function HomePage() {
  return (
    <main className="w-full max-w-full overflow-x-hidden py-6 space-y-10">
      <Top10Carousel
        title="Top 10 Movies"
        type="top_rated"
        mediaType="movie"
      />
      
      <Top10Carousel
        title="Top 10 TV Shows"
        type="top_rated"
        mediaType="tv"
      />

      <Carousel
        title="Trending Today"
        type="trending"
        mediaType="all"
        timeWindow="day"
        infinite={true}
      />
      <Carousel
        title="Action Blockbusters"
        genreId={28}
        mediaType="movie"
        infinite={true}
      />
      <Carousel
        title="Action & Adventure TV"
        genreId={28}
        mediaType="tv"
        infinite={true}
      />
      <Carousel
        title="Comedy Hits"
        genreId={35}
        mediaType="all"
        infinite={true}
      />
      <Carousel
        title="Popular Movies"
        type="popular"
        mediaType="movie"
        infinite={true}
      />
    </main>
  );
}