'use client';

import { Banner, Carousel, Top10Carousel } from '@/components/media';
import { useTranslation } from '@/hooks/ui/use-translation';

export default function HomePage() {
  const { t } = useTranslation();

  return (
    <main className="w-full max-w-full overflow-x-hidden pb-10 space-y-10">
      <Banner type="trending" mediaType="all" />

      <Carousel
        title={t('home.trendingToday', 'Trending Today')}
        type="trending"
        mediaType="all"
        timeWindow="day"
        infinite={true}
      />

      <Top10Carousel
        title={t('home.top10Movies', 'Top 10 Movies')}
        type="top_rated"
        mediaType="movie"
      />

      <Top10Carousel
        title={t('home.top10TvShows', 'Top 10 TV Shows')}
        type="top_rated"
        mediaType="tv"
      />

      <Carousel
        title={t('home.actionTitle', 'Big-Time Action')}
        genreId={28}
        mediaType="movie"
        infinite={true}
      />
      <Carousel
        title={t('home.comedyTitle', 'Comedy Hits')}
        genreId={35}
        mediaType="all"
        infinite={true}
      />
      <Carousel
        title={t('home.popularMovies', 'Popular Movies')}
        type="popular"
        mediaType="movie"
        infinite={true}
      />
      <Carousel
        title={t('home.trendingThisWeek', 'Trending This Week')}
        type="trending"
        mediaType="all"
        timeWindow="week"
        infinite={true}
      />
      <Carousel
        title={t('home.popularTvShows', 'Popular TV Shows')}
        type="popular"
        mediaType="tv"
        infinite={true}
      />
      <Carousel
        title={t('home.sciFiTitle', 'Sci-Fi & Fantasy')}
        genreId={878}
        mediaType="all"
        infinite={true}
      />
      <Carousel
        title={t('home.dramaTitle', 'Gripping Dramas')}
        genreId={18}
        mediaType="all"
        infinite={true}
      />
      <Carousel
        title={t('home.horrorTitle', 'Horror Nights')}
        genreId={27}
        mediaType="movie"
        infinite={true}
      />
      <Carousel
        title={t('home.animationTitle', 'Animation')}
        genreId={16}
        mediaType="all"
        infinite={true}
      />
      <Carousel
        title={t('home.crimeTitle', 'Crime & Thrillers')}
        genreId={80}
        mediaType="all"
        infinite={true}
      />
      <Carousel
        title={t('home.documentaryTitle', 'Documentaries')}
        genreId={99}
        mediaType="all"
        infinite={true}
      />
    </main>
  );
}