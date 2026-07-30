import type {
  JellyfinMediaSource,
  FormattedMediaInfo,
  LanguageSupportRow,
} from '@/types/jellyfin';
import {
  ISO_639_2_TO_1,
  getNormalizedLanguageCode,
  formatLanguageName,
} from './language';

export { ISO_639_2_TO_1, getNormalizedLanguageCode, formatLanguageName };

export function extractFormattedMediaInfo(mediaSource?: JellyfinMediaSource | null): FormattedMediaInfo {
  if (!mediaSource) return {};

  const streams = mediaSource.MediaStreams || [];
  const videoStream = streams.find((s) => s.Type === 'Video');
  const audioStreams = streams.filter((s) => s.Type === 'Audio');
  const defaultAudio = audioStreams.find((s) => s.IsDefault) || audioStreams[0];

  const info: FormattedMediaInfo = {};

  // Resolution & Dimensions
  const height = videoStream?.Height || 0;
  const width = videoStream?.Width || 0;
  let qualityTag = '';
  if (height >= 2000 || width >= 3500) {
    qualityTag = '4K';
  } else if (height >= 1400 || width >= 2500) {
    qualityTag = '1440p';
  } else if (height >= 1000 || width >= 1800) {
    qualityTag = '1080p';
  } else if (height >= 700 || width >= 1200) {
    qualityTag = '720p';
  } else if (height > 0 || width > 0) {
    qualityTag = `${height}p`;
  }

  if (width > 0 && height > 0) {
    info.resolution = `${width}×${height}${qualityTag ? ` (${qualityTag})` : ''}`;
  } else if (qualityTag) {
    info.resolution = qualityTag;
  }

  // Aspect Ratio
  if (videoStream?.AspectRatio) {
    info.aspectRatio = videoStream.AspectRatio;
  } else if (width > 0 && height > 0) {
    info.aspectRatio = `${(width / height).toFixed(2)}:1`;
  }

  // Frame Rate
  const fps = videoStream?.RealFrameRate || videoStream?.AverageFrameRate;
  if (fps && fps > 0) {
    info.frameRate = `${Math.round(fps * 1000) / 1000} fps`;
  }

  // Bitrate
  const bitrate = videoStream?.BitRate;
  if (bitrate && bitrate > 0) {
    info.bitrate = `${(bitrate / 1000000).toFixed(2)} Mbps`;
  }

  // Bit Depth
  if (videoStream?.BitDepth && videoStream.BitDepth > 0) {
    info.bitDepth = `${videoStream.BitDepth}-bit`;
  }

  // Dynamic Range / Video Range
  const doVi = videoStream?.VideoDoViTitle;
  const rangeType = videoStream?.VideoRangeType;
  const range = videoStream?.VideoRange;

  if (doVi) {
    info.videoRange = doVi;
  } else if (rangeType && rangeType !== 'Unknown' && rangeType !== 'SDR') {
    info.videoRange = rangeType;
  } else if (range && range !== 'Unknown' && range !== 'SDR') {
    info.videoRange = range;
  } else if (videoStream) {
    info.videoRange = 'SDR';
  }

  // Color Space
  const cs = videoStream?.ColorSpace;
  const cp = videoStream?.ColorPrimaries;
  if (cs && cp && cs !== cp) {
    info.colorSpace = `${cs} (${cp})`;
  } else if (cs || cp) {
    info.colorSpace = cs || cp;
  }

  // Video Codec
  const rawVideoCodec = videoStream?.Codec?.toUpperCase() || '';
  if (rawVideoCodec === 'HEVC' || rawVideoCodec === 'H265') {
    info.videoCodec = 'HEVC (H.265)';
  } else if (rawVideoCodec === 'H264' || rawVideoCodec === 'AVC') {
    info.videoCodec = 'H.264 (AVC)';
  } else if (rawVideoCodec) {
    info.videoCodec = rawVideoCodec;
  }

  // Container
  if (mediaSource.Container) {
    info.container = mediaSource.Container.toUpperCase();
  }

  // File Size
  if (mediaSource.Size && mediaSource.Size > 0) {
    const bytes = mediaSource.Size;
    if (bytes >= 1073741824) {
      info.fileSize = `${(bytes / 1073741824).toFixed(2)} GB`;
    } else if (bytes >= 1048576) {
      info.fileSize = `${(bytes / 1048576).toFixed(1)} MB`;
    }
  }

  // Audio codec / layout summary
  if (defaultAudio) {
    if (defaultAudio.DisplayTitle) {
      info.audioCodec = defaultAudio.DisplayTitle;
    } else {
      const parts = [
        defaultAudio.Codec?.toUpperCase(),
        defaultAudio.ChannelLayout || (defaultAudio.Channels ? `${defaultAudio.Channels}ch` : null),
      ].filter(Boolean);
      if (parts.length > 0) {
        info.audioCodec = parts.join(' ');
      }
    }
  }

  return info;
}

export function extractLanguageSupportTable(
  mediaSource?: JellyfinMediaSource | null,
  userLocale: string = 'en'
): LanguageSupportRow[] {
  if (!mediaSource || !mediaSource.MediaStreams || mediaSource.MediaStreams.length === 0) {
    return [];
  }

  const map = new Map<string, LanguageSupportRow>();

  for (const stream of mediaSource.MediaStreams) {
    if (stream.Type !== 'Audio' && stream.Type !== 'Subtitle') {
      continue;
    }

    const langCode = stream.Language || 'und';
    const title = stream.DisplayTitle || stream.Title || '';
    const langName = formatLanguageName(langCode, title, userLocale);

    const key = langName.toLowerCase();

    if (!map.has(key)) {
      map.set(key, {
        code: langCode,
        name: langName,
        hasAudio: false,
        hasSubtitles: false,
        audioTitles: [],
        subtitleTitles: [],
      });
    }

    const entry = map.get(key)!;

    if (stream.Type === 'Audio') {
      entry.hasAudio = true;
      if (title && !entry.audioTitles.includes(title)) {
        entry.audioTitles.push(title);
      }
    } else if (stream.Type === 'Subtitle') {
      entry.hasSubtitles = true;
      if (title && !entry.subtitleTitles.includes(title)) {
        entry.subtitleTitles.push(title);
      }
    }
  }

  const rows = Array.from(map.values());
  const userLangName = formatLanguageName(userLocale, null, userLocale).toLowerCase();
  const normalizedUserCode = getNormalizedLanguageCode(userLocale, null);

  const getPriority = (row: LanguageSupportRow): number => {
    const normalizedRowCode = getNormalizedLanguageCode(row.code, row.name);

    const isUserLocale =
      row.name.toLowerCase() === userLangName ||
      (userLocale && row.code.toLowerCase() === userLocale.toLowerCase()) ||
      (userLocale && ISO_639_2_TO_1[row.code.toLowerCase()] === userLocale.toLowerCase()) ||
      Boolean(normalizedUserCode && normalizedRowCode && normalizedUserCode === normalizedRowCode);

    if (isUserLocale) return 0;
    if (row.hasAudio && row.hasSubtitles) return 1;
    if (row.hasAudio) return 2;
    if (row.hasSubtitles) return 3;
    return 4;
  };

  rows.sort((a, b) => {
    const pA = getPriority(a);
    const pB = getPriority(b);
    if (pA !== pB) return pA - pB;
    return a.name.localeCompare(b.name, userLocale);
  });

  return rows;
}
