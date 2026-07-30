'use client';

import React from 'react';
import { Check, ChevronDown, Minus } from 'lucide-react';
import type { JellyfinBaseItem, JellyfinMediaSource, LanguageSupportRow } from '@/types/jellyfin';
import { useJellyfinMediaInfo } from '@/hooks/media/use-jellyfin-media-info';
import { useTranslation } from '@/hooks/ui/use-translation';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

export interface JellyfinMediaInfoProps {
  item?: JellyfinBaseItem | null;
  fallbackMediaSource?: JellyfinMediaSource | null;
  className?: string;
}

interface LanguageSupportTableProps {
  languages: LanguageSupportRow[];
  isCompact?: boolean;
  t: (key: string, defaultText?: string) => string;
}

function LanguageSupportTable({ languages, isCompact = false, t }: LanguageSupportTableProps) {
  const cellPadding = isCompact ? 'py-2 px-3' : 'py-2.5 px-4';
  const colWidth = isCompact ? 'w-20' : 'w-24 sm:w-28';
  const headerTextSize = isCompact ? 'text-xs' : 'text-[11px] sm:text-[12px]';
  const stickyHeaderClass = isCompact ? 'sticky top-0 z-10' : '';
  const rowHoverClass = isCompact ? 'hover:bg-foreground/[0.03]' : '';
  const iconSize = isCompact ? 'h-3.5 w-3.5' : 'h-4 w-4';
  const keyPrefix = isCompact ? 'popover-' : '';

  return (
    <table className="w-full text-left text-xs sm:text-sm border-collapse">
      <thead>
        <tr className={`border-b border-border/60 text-foreground/50 font-medium ${headerTextSize} ${stickyHeaderClass}`}>
          <th className={`${cellPadding} font-medium`}>{t('mediaInfo.language', 'Language')}</th>
          <th className={`${cellPadding} text-center font-medium ${colWidth}`}>
            {t('mediaInfo.audio', 'Audio')}
          </th>
          <th className={`${cellPadding} text-center font-medium ${colWidth}`}>
            {t('mediaInfo.subtitles', 'Subtitles')}
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border/30 text-foreground/90">
        {languages.map((lang) => (
          <tr key={`${keyPrefix}${lang.code}-${lang.name}`} className={rowHoverClass}>
            <td className={`${cellPadding} font-semibold`}>{lang.name}</td>
            <td className={`${cellPadding} text-center`}>
              {lang.hasAudio ? (
                <div
                  className="inline-flex items-center justify-center text-foreground"
                  title={lang.audioTitles.join(', ')}
                >
                  <Check className={`${iconSize} stroke-[3]`} />
                </div>
              ) : (
                <div className="inline-flex items-center justify-center text-foreground/30">
                  <Minus className={`${iconSize} stroke-[2]`} />
                </div>
              )}
            </td>
            <td className={`${cellPadding} text-center`}>
              {lang.hasSubtitles ? (
                <div
                  className="inline-flex items-center justify-center text-foreground"
                  title={lang.subtitleTitles.join(', ')}
                >
                  <Check className={`${iconSize} stroke-[3]`} />
                </div>
              ) : (
                <div className="inline-flex items-center justify-center text-foreground/30">
                  <Minus className={`${iconSize} stroke-[2]`} />
                </div>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function JellyfinMediaInfo({ item, fallbackMediaSource, className = '' }: JellyfinMediaInfoProps) {
  const { t } = useTranslation();
  const { info, languages, hasContent } = useJellyfinMediaInfo({ item, fallbackMediaSource });

  if (!hasContent) return null;

  const rawCards = [
    info.resolution
      ? { key: 'resolution', label: t('mediaInfo.resolution', 'Resolution'), value: info.resolution }
      : null,
    info.frameRate
      ? { key: 'frameRate', label: t('mediaInfo.frameRate', 'Framerate'), value: info.frameRate }
      : null,
    info.bitrate
      ? { key: 'bitrate', label: t('mediaInfo.bitrate', 'Bitrate'), value: info.bitrate }
      : null,
    info.bitDepth
      ? { key: 'bitDepth', label: t('mediaInfo.bitDepth', 'Bit Depth'), value: info.bitDepth }
      : null,
    info.videoRange
      ? { key: 'videoRange', label: t('mediaInfo.hdr', 'Video Range'), value: info.videoRange }
      : null,
    info.colorSpace
      ? { key: 'colorSpace', label: t('mediaInfo.colorSpace', 'Color Space'), value: info.colorSpace }
      : null,
    info.videoCodec
      ? { key: 'videoCodec', label: t('mediaInfo.videoCodec', 'Video Codec'), value: info.videoCodec }
      : null,
    info.fileSize
      ? {
        key: 'fileSize',
        label: t('mediaInfo.fileSize', 'Size & Format'),
        value: `${info.fileSize}${info.container ? ` (${info.container})` : ''}`,
      }
      : null,
  ];

  const singleCards = rawCards.filter((card): card is NonNullable<typeof card> => card !== null);
  const hasInfoCards = singleCards.length > 0 || Boolean(info.audioCodec);

  const visibleLanguages = languages.slice(0, 5);
  const hasMoreLanguages = languages.length > 5;

  const seeAllText = t('mediaInfo.seeAllLanguages', `See all ${languages.length} languages`).replace(
    '{{count}}',
    String(languages.length)
  );

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
        {hasInfoCards && (
          <div className="space-y-4">
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
              {t('mediaInfo.title', 'Media Information')}
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6 text-xs sm:text-sm">
              {singleCards.map((card) => (
                <div key={card.key}>
                  <p className="text-foreground/50 font-medium">{card.label}</p>
                  <p className="text-foreground/90 font-semibold mt-1 truncate" title={card.value}>
                    {card.value}
                  </p>
                </div>
              ))}

              {info.audioCodec && (
                <div className="col-span-2 sm:col-span-3 md:col-span-4">
                  <p className="text-foreground/50 font-medium">{t('mediaInfo.audioFormat', 'Audio Format')}</p>
                  <p className="text-foreground/90 font-semibold mt-1 truncate" title={info.audioCodec}>
                    {info.audioCodec}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {languages.length > 0 && (
          <div className="space-y-4">
            <div className="overflow-hidden rounded-xl border border-border/40">
              <LanguageSupportTable languages={visibleLanguages} t={t} />
            </div>

            {hasMoreLanguages && (
              <div className="pt-1">
                <Popover>
                  <PopoverTrigger className="w-full text-center text-xs font-semibold text-primary hover:text-primary/80 hover:underline flex items-center justify-center gap-1.5 py-1 cursor-pointer transition">
                    <span>{seeAllText}</span>
                    <ChevronDown className="h-3.5 w-3.5" />
                  </PopoverTrigger>
                  <PopoverContent align="center" side="top" className="w-80 sm:w-96 p-1 bg-transparent backdrop-blur-2xl">
                    <div className="max-h-72 overflow-y-auto">
                      <LanguageSupportTable languages={languages} isCompact t={t} />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default JellyfinMediaInfo;
