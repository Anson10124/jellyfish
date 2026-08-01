'use client';

import React, { use } from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/hooks/ui/use-translation';
import { usePersonDetails } from '@/hooks/media/use-person-details';
import { PADDING_X_CLASSES, SLIDE_WIDTH_CLASS } from '@/constants/carousel';
import { Poster } from '@/components/media/cards';
import { CarouselWrapper } from '@/components/media/carousels/carousel-wrapper';
import { useEmblaNavigation } from '@/hooks/ui/use-embla-navigation';
import { PersonHeader, PersonFilmography, PersonSkeleton } from '@/components/media/person';
import { getCreditRoleLabel } from '@/lib/utils/media-format';

interface PersonDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function PersonDetailPage({ params }: PersonDetailPageProps) {
  const resolvedParams = use(params);
  const personId = resolvedParams.id;
  const { t } = useTranslation();

  const {
    person,
    loading,
    error,
    knownForCredits,
    actingCredits,
    crewCredits,
  } = usePersonDetails(personId);

  const { emblaRef, isBeginning, isEnd, handlePrev, handleNext } = useEmblaNavigation();

  if (loading) {
    return <PersonSkeleton />;
  }

  if (error || !person) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-foreground px-4">
        <h2 className="text-2xl font-bold">{t('person.personNotFound', 'Person not found')}</h2>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-foreground/10 hover:bg-foreground/20 text-sm font-semibold transition cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('common.back', 'Back')}
        </Link>
      </div>
    );
  }

  return (
    <main className="relative min-h-screen w-full max-w-full overflow-x-hidden bg-background text-foreground">
      <div className="relative z-10 w-full pt-32 sm:pt-36 lg:pt-40 pb-24 space-y-14 lg:space-y-16">
        <PersonHeader person={person} />
        {knownForCredits.length > 0 && (
          <section className="space-y-4">
            <CarouselWrapper
              title={t('person.knownFor', 'Known For')}
              isBeginning={isBeginning}
              isEnd={isEnd}
              onPrev={handlePrev}
              onNext={handleNext}
              emblaRef={emblaRef}
            >
              {knownForCredits.map((item, index) => {
                const title = item.title || item.name || 'Untitled';
                const roleLabel = getCreditRoleLabel(item);

                return (
                  <div key={`${item.media_type}-${item.id}-${index}`} className={SLIDE_WIDTH_CLASS}>
                    <Poster
                      id={item.id}
                      mediaType={item.media_type}
                      title={title}
                      posterPath={(item.poster_path || item.backdrop_path || '') as string}
                      label={roleLabel}
                    />
                  </div>
                );
              })}
            </CarouselWrapper>
          </section>
        )}
        <PersonFilmography
          actingCredits={actingCredits}
          crewCredits={crewCredits}
        />
      </div>
    </main>
  );
}
