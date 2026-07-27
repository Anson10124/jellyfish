export function createWebDeviceProfile() {
  const isSafari = typeof navigator !== 'undefined' && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const directPlayProfiles = [
    {
      Container: 'mp4,m4v',
      Type: 'Video',
      VideoCodec: isSafari ? 'h264,hevc' : 'h264',
      AudioCodec: 'aac,mp3,flac,alac',
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