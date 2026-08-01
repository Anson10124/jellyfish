'use client';

import React from 'react';
import {
  ImdbIcon,
  InstagramIcon,
  XIcon,
  FacebookIcon,
  TiktokIcon,
  YoutubeIcon,
} from '@/components/ui';
import { getPersonSocialUrls } from '@/lib/utils/person-social';
import type { PersonExternalIds } from '@/types/media';

export interface PersonSocialLinksProps {
  externalIds?: PersonExternalIds;
  imdbId?: string | null;
  className?: string;
}

export function PersonSocialLinks({
  externalIds,
  imdbId,
  className = '',
}: PersonSocialLinksProps) {
  const {
    imdbUrl,
    instagramUrl,
    twitterUrl,
    facebookUrl,
    tiktokUrl,
    youtubeUrl,
  } = getPersonSocialUrls(externalIds, imdbId);

  const links = [
    { url: imdbUrl, title: 'IMDb', Icon: ImdbIcon },
    { url: instagramUrl, title: 'Instagram', Icon: InstagramIcon },
    { url: twitterUrl, title: 'X (Twitter)', Icon: XIcon },
    { url: facebookUrl, title: 'Facebook', Icon: FacebookIcon },
    { url: tiktokUrl, title: 'TikTok', Icon: TiktokIcon },
    { url: youtubeUrl, title: 'YouTube', Icon: YoutubeIcon },
  ].filter((item) => item.url);

  if (links.length === 0) return null;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {links.map(({ url, title, Icon }) => (
        <a
          key={title}
          href={url!}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1 text-foreground/75 hover:text-foreground transition-colors duration-200 cursor-pointer"
          title={title}
          aria-label={title}
        >
          <Icon className="w-5 h-5" />
        </a>
      ))}
    </div>
  );
}

export default PersonSocialLinks;
