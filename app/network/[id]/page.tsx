/* eslint-disable @next/next/no-img-element */
'use client';

import React, { use, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Globe, MapPin, Tv } from 'lucide-react';
import { useTranslation } from '@/hooks/ui/use-translation';
import { useNetworkDetails } from '@/hooks/media/use-network-details';
import { useNetworkMedia } from '@/hooks/media/use-network-media';
import { NetworkLogo } from '@/components/media/network-logo';
import { PosterGrid } from '@/components/media/poster-grid';
import { Poster } from '@/components/media/cards';
import { LiquidGlass } from '@/components/ui/liquid-glass';
import { Skeleton } from '@/components/ui';
import { PADDING_X_CLASSES } from '@/constants/carousel';
import type { NetworkSort } from '@/constants/networks';
import { getTmdbImage } from '@/lib/utils/tmdb-image';
import { getMediaTitle, getMediaYear, getMediaSubtitleLabel } from '@/lib/utils/media-format';

interface NetworkDetailPageProps {
  params: Promise<{ id: string }>;
}

const SORT_OPTIONS: { value: NetworkSort; key: string; fallback: string }[] = [
  { value: 'popular', key: 'network.sortPopular', fallback: 'Popular' },
  { value: 'top_rated', key: 'network.sortTopRated', fallback: 'Top Rated' },
  { value: 'newest', key: 'network.sortNewest', fallback: 'Newest' },
];

function formatRegion(code: string | undefined, locale: string): string | null {
  if (!code) return null;
  try {
    return new Intl.DisplayNames([locale, 'en'], { type: 'region' }).of(code) || code;
  } catch {
    return code;
  }
}

const BADGE_CLASSES =
  'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-foreground/10 text-xs sm:text-sm font-medium text-foreground/90';

export default function NetworkDetailPage({ params }: NetworkDetailPageProps) {
  const resolvedParams = use(params);
  const parsedId = parseInt(resolvedParams.id, 10);
  const networkId = isNaN(parsedId) ? undefined : parsedId;

  const { t, locale } = useTranslation();
  const [sort, setSort] = useState<NetworkSort>('popular');

  const { network, loading: networkLoading, error } = useNetworkDetails(networkId);
  const { items, loading, loadingMore, totalResults, observerRef } = useNetworkMedia({ networkId, sort });

  // The backdrop follows the first show with artwork, like the collection page
  const backdropUrl = useMemo(() => {
    const backdrop = items.find((item) => item.backdrop_path)?.backdrop_path;
    return backdrop ? getTmdbImage(backdrop, 'original') : null;
  }, [items]);

  const country = formatRegion(network?.origin_country, locale);

  if (!networkId || error || (!networkLoading && !network)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-foreground px-4">
        <h2 className="text-2xl font-bold">{t('network.notFound', 'Network not found')}</h2>
        <Link
          href="/tv"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-foreground/10 hover:bg-foreground/20 text-sm font-semibold transition cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('network.backToTv', 'Back to TV Shows')}
        </Link>
      </div>
    );
  }

  // Selected chip is solid; the rest are glass, matching the genre bar
  const getChipProps = (isSelected: boolean) => ({
    radius: 'capsule' as const,
    'data-focusable': 'true',
    tabIndex: 0,
    className: `shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:scale-[1.05] ${
      isSelected
        ? 'bg-foreground text-background shadow-md scale-[1.02]'
        : 'text-foreground/70 hover:bg-foreground/20 hover:text-foreground'
    }`,
    glassClassName: isSelected ? undefined : 'bg-card/65',
    glass: { blur: 4 },
    fallbackClassName: isSelected ? 'backdrop-blur-xl' : 'bg-card/65 ring-1 ring-foreground/10 backdrop-blur-xl',
  });

  return (
    <main className="relative min-h-screen w-full max-w-full overflow-x-hidden bg-background text-foreground">
      {backdropUrl && (
        <div className="fixed inset-0 h-screen w-screen select-none pointer-events-none z-0 overflow-hidden">
          <img
            src={backdropUrl}
            alt=""
            className="h-full w-full object-cover object-center blur-3xl opacity-40 scale-110"
            draggable={false}
          />
        </div>
      )}

      <div className="relative z-10 w-full pt-28 sm:pt-32 lg:pt-36 pb-20 space-y-10 lg:space-y-12">
        {/* Hero */}
        <div className={PADDING_X_CLASSES}>
          {networkLoading || !network ? (
            <div className="flex flex-col items-center md:items-start gap-5">
              <Skeleton className="h-16 sm:h-20 w-56 sm:w-72 rounded-xl" />
              <div className="flex gap-2">
                <Skeleton className="h-7 w-24 rounded-lg" />
                <Skeleton className="h-7 w-20 rounded-lg" />
                <Skeleton className="h-7 w-28 rounded-lg" />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center md:items-start gap-5 text-center md:text-left">
              {network.logo_path ? (
                <>
                  <h1 className="sr-only">{network.name}</h1>
                  <NetworkLogo
                    name={network.name}
                    logoPath={network.logo_path}
                    className="h-14 sm:h-16 lg:h-20 w-auto max-w-[80vw] sm:max-w-md drop-shadow-md"
                  />
                </>
              ) : (
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground drop-shadow-md">
                  {network.name}
                </h1>
              )}

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                {!loading && totalResults > 0 && (
                  <span className={BADGE_CLASSES}>
                    <Tv className="h-3.5 w-3.5 opacity-70" />
                    {t('network.showCount', '{count} shows', { count: totalResults.toLocaleString(locale) })}
                  </span>
                )}

                {country && (
                  <span className={BADGE_CLASSES}>
                    <Globe className="h-3.5 w-3.5 opacity-70" />
                    {country}
                  </span>
                )}

                {network.headquarters && (
                  <span className={BADGE_CLASSES}>
                    <MapPin className="h-3.5 w-3.5 opacity-70" />
                    {network.headquarters}
                  </span>
                )}

                {network.homepage && (
                  <a
                    href={network.homepage}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-focusable="true"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-foreground/5 text-xs sm:text-sm font-medium text-foreground/75 border border-border/40 hover:bg-foreground/10 hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                    {t('network.website', 'Website')}
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sort */}
        <div className={`flex flex-wrap items-center justify-center md:justify-start gap-2 sm:gap-2.5 ${PADDING_X_CLASSES}`}>
          {SORT_OPTIONS.map((option) => (
            <LiquidGlass
              key={option.value}
              render={<button type="button" />}
              onClick={() => setSort(option.value)}
              aria-pressed={sort === option.value}
              {...getChipProps(sort === option.value)}
            >
              {t(option.key, option.fallback)}
            </LiquidGlass>
          ))}
        </div>

        {/* Shows */}
        <PosterGrid
          loading={loading}
          loadingMore={loadingMore}
          observerRef={observerRef}
          isEmpty={!loading && items.length === 0}
          emptyState={
            <p className="py-12 text-center text-sm text-foreground/50">
              {t('network.noShows', 'No shows found for this network.')}
            </p>
          }
        >
          {items.map((item, idx) => (
            <Poster
              key={`${item.id}-${idx}`}
              id={item.id}
              mediaType="tv"
              title={getMediaTitle(item)}
              posterPath={item.poster_path || ''}
              year={getMediaYear(item)}
              label={getMediaSubtitleLabel(item, { mediaType: 'tv' }, t)}
            />
          ))}
        </PosterGrid>
      </div>
    </main>
  );
}
