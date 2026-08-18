'use client';

import { NumberedMediaCard } from '@/components/media/cards';
import { useCollection } from '@/hooks/media/use-collection';
import { useTranslation } from '@/hooks/ui/use-translation';
import { useEmblaNavigation } from '@/hooks/ui/use-embla-navigation';
import type { CollectionDetails, MediaItem } from '@/types/media';
import { CarouselWrapper } from './carousel-wrapper';
import { NumberedCarouselSkeleton } from './numbered-carousel-skeleton';

export interface CollectionCarouselProps {
  collectionId?: number | string | null;
  collectionName?: string | null;
  initialCollection?: CollectionDetails;
  title?: string;
  subtitle?: string;
  disableTitleLink?: boolean;
}

export function CollectionCarousel({
  collectionId,
  collectionName,
  initialCollection,
  title,
  subtitle,
  disableTitleLink = false,
}: CollectionCarouselProps) {
  const { t } = useTranslation();
  const { collection, parts, loading } = useCollection(collectionId, initialCollection);
  const { emblaRef, isBeginning, isEnd, handlePrev, handleNext } = useEmblaNavigation();

  if (loading) {
    return <NumberedCarouselSkeleton count={4} />;
  }

  if (!collection || parts.length === 0) {
    return null;
  }

  const rawName = (collectionName || collection.name || '').trim();
  const formattedCollectionName = rawName.toLowerCase().endsWith('collection')
    ? rawName
    : `${rawName} Collection`.trim();

  const defaultTitle = rawName
    ? t('movies.moreFromCollection', `More from the ${formattedCollectionName}`, {
        name: formattedCollectionName,
      })
    : t('movies.collection', 'Collection');

  const carouselTitle = title ?? defaultTitle;
  const targetId = collectionId || collection.id;
  const titleHref = !disableTitleLink && targetId ? `/collection/${targetId}` : undefined;

  return (
    <CarouselWrapper
      title={carouselTitle}
      subtitle={subtitle}
      titleHref={titleHref}
      isBeginning={isBeginning}
      isEnd={isEnd}
      onPrev={handlePrev}
      onNext={handleNext}
      emblaRef={emblaRef}
    >
      {parts.map((item: MediaItem, index: number) => (
        <NumberedMediaCard
          key={`${item.id}-${index}`}
          item={item}
          rank={index + 1}
          mediaType="movie"
        />
      ))}
    </CarouselWrapper>
  );
}

export default CollectionCarousel;
