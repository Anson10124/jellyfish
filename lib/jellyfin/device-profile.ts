function checkMediaSourceSupport(mimeType: string): boolean {
  if (typeof window === 'undefined' || typeof MediaSource === 'undefined') return false;
  try {
    return MediaSource.isTypeSupported(mimeType);
  } catch {
    return false;
  }
}

export function createWebDeviceProfile() {
  const isSafari = typeof navigator !== 'undefined' && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  const supportsHevc =
    isSafari ||
    checkMediaSourceSupport('video/mp4; codecs="hvc1.1.6.L93.B0"') ||
    checkMediaSourceSupport('video/mp4; codecs="hev1.1.6.L93.B0"');

  const supportsAv1 = checkMediaSourceSupport('video/mp4; codecs="av01.0.08M.08"');

  const mp4Codecs = ['h264'];
  if (supportsHevc) mp4Codecs.push('hevc');
  if (supportsAv1) mp4Codecs.push('av1');

  const directPlayProfiles = [
    {
      Container: 'mp4,m4v,mkv',
      Type: 'Video',
      VideoCodec: mp4Codecs.join(','),
      AudioCodec: 'aac,mp3,flac,alac,opus,vorbis',
    },
    {
      Container: 'webm',
      Type: 'Video',
      VideoCodec: 'vp8,vp9,av1',
      AudioCodec: 'vorbis,opus',
    },
  ];

  return {
    Name: 'Jellyfish',
    MaxStreamingBitrate: 140000000,
    DirectPlayProfiles: directPlayProfiles,
    TranscodingProfiles: [
      {
        Container: 'ts',
        Type: 'Video',
        VideoCodec: 'h264',
        AudioCodec: 'aac',
        Protocol: 'hls',
        EstimateContentLength: false,
        EnableMuxing: true,
        EnableSubtitlesInManifest: true,
      },
      {
        Container: 'mp4',
        Type: 'Video',
        VideoCodec: 'h264',
        AudioCodec: 'aac',
        Protocol: 'hls',
        EstimateContentLength: false,
        EnableMuxing: true,
      },
    ],
    ContainerProfiles: [],
    CodecProfiles: [],
    SubtitleProfiles: [
      { Format: 'vtt', Method: 'External' },
      { Format: 'srt', Method: 'External' },
      { Format: 'subrip', Method: 'External' },
      { Format: 'ass', Method: 'Embed' },
      { Format: 'ssa', Method: 'Embed' },
      { Format: 'pgs', Method: 'Embed' },
      { Format: 'dvdsub', Method: 'Embed' },
    ],
  };
}