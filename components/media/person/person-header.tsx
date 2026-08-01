'use client';

import React from 'react';
import { Calendar, MapPin, User, ChevronDown } from 'lucide-react';
import { getTmdbImage } from '@/lib/utils/tmdb-image';
import { calculateAge, formatGender } from '@/lib/utils/media-format';
import { useTranslation } from '@/hooks/ui/use-translation';
import { useIsMobile } from '@/hooks/device/use-mobile';
import { PADDING_X_CLASSES } from '@/constants/carousel';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui';
import { PersonSocialLinks } from './person-social-links';
import type { PersonDetails } from '@/types/media';

export interface PersonHeaderProps {
  person: PersonDetails;
}

export function PersonHeader({ person }: PersonHeaderProps) {
  const { t, formatDate } = useTranslation();
  const isMobile = useIsMobile();

  const profileImage = person.profile_path
    ? getTmdbImage(person.profile_path, 'h632')
    : null;

  const age = calculateAge(person.birthday, person.deathday);
  const genderLabel = formatGender(person.gender);

  const formattedBirthday = person.birthday ? formatDate(person.birthday) : null;
  const formattedDeathday = person.deathday ? formatDate(person.deathday) : null;

  const bioText = person.biography || '';
  const isLongBio = bioText.length > 380;

  return (
    <div className={`max-w-7xl mx-auto ${PADDING_X_CLASSES}`}>
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-center lg:items-start">
        <div className="w-48 lg:w-72 shrink-0 space-y-4">
          <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-foreground/5 shadow-2xl ring-1 ring-border">
            {profileImage ? (
              <img
                src={profileImage}
                alt={person.name}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-foreground/10 text-foreground/40">
                <User className="w-16 h-16" />
              </div>
            )}
          </div>

          <PersonSocialLinks
            externalIds={person.external_ids}
            imdbId={person.imdb_id}
            className="justify-center lg:justify-start pt-1"
          />
        </div>

        <div className="flex-1 text-center lg:text-left space-y-5 w-full">
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight drop-shadow-md">
              {person.name}
            </h1>
            {person.known_for_department && (
              <p className="mt-1 text-sm sm:text-base font-semibold text-primary/90">
                {person.known_for_department}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 text-xs sm:text-sm font-medium text-foreground/70">
            {genderLabel && (
              <span className="px-3 py-1 rounded-full bg-foreground/8 ring-1 ring-border">
                {genderLabel}
              </span>
            )}
            {formattedBirthday && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-foreground/8 ring-1 ring-border">
                <Calendar className="w-3.5 h-3.5 text-foreground/50" />
                {formattedBirthday} {age !== null && `(${age} yrs)`}
              </span>
            )}
            {formattedDeathday && (
              <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/30">
                {t('person.deathday', 'Died')}: {formattedDeathday}
              </span>
            )}
            {person.place_of_birth && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-foreground/8 ring-1 ring-border">
                <MapPin className="w-3.5 h-3.5 text-foreground/50" />
                {person.place_of_birth}
              </span>
            )}
          </div>

          {bioText && (
            <div className="space-y-2 pt-2">
              <h3 className="text-lg font-bold text-foreground">
                {t('person.biography', 'Biography')}
              </h3>
              <p className="text-sm sm:text-base leading-relaxed text-foreground/80 whitespace-pre-line">
                {isLongBio ? `${bioText.slice(0, 320)}...` : bioText}
              </p>
              {isLongBio &&
                (isMobile ? (
                  <Drawer showSwipeHandle>
                    <DrawerTrigger className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-primary hover:text-primary/80 hover:underline cursor-pointer pt-1 transition">
                      <span>{t('person.readMore', 'Read More')}</span>
                      <ChevronDown className="h-3.5 w-3.5" />
                    </DrawerTrigger>
                    <DrawerContent className="bg-background/95 backdrop-blur-2xl border-t border-border">
                      <DrawerHeader className="text-left border-b border-border/40 pb-3">
                        <DrawerTitle className="font-bold text-base text-foreground">
                          {t('person.biography', 'Biography')}
                        </DrawerTitle>
                      </DrawerHeader>
                      <div className="p-4 pb-8 max-h-[65vh] overflow-y-auto">
                        <p className="text-sm leading-relaxed text-foreground/85 whitespace-pre-line">
                          {bioText}
                        </p>
                      </div>
                    </DrawerContent>
                  </Drawer>
                ) : (
                  <Popover>
                    <PopoverTrigger className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-primary hover:text-primary/80 hover:underline cursor-pointer pt-1 transition">
                      <span>{t('person.readMore', 'Read More')}</span>
                      <ChevronDown className="h-3.5 w-3.5" />
                    </PopoverTrigger>
                    <PopoverContent
                      side="right"
                      align="center"
                      sideOffset={12}
                      className="w-[88vw] max-w-lg sm:max-w-xl p-4 bg-background/95 backdrop-blur-2xl border border-border shadow-2xl rounded-2xl text-foreground"
                    >
                      <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                        <div className="flex items-center justify-between border-b border-border/40 pb-2">
                          <h4 className="font-bold text-sm sm:text-base text-foreground">
                            {t('person.biography', 'Biography')}
                          </h4>
                        </div>
                        <p className="text-xs sm:text-sm leading-relaxed text-foreground/85 whitespace-pre-line">
                          {bioText}
                        </p>
                      </div>
                    </PopoverContent>
                  </Popover>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PersonHeader;
