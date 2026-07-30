export interface JellyfinPublicSystemInfo {
  Id?: string;
  ServerName?: string;
  Version?: string;
  ProductName?: string;
  OperatingSystem?: string;
  StartupWizardCompleted?: boolean;
}

export interface JellyfinUser {
  Id: string;
  Name: string;
  HasPassword?: boolean;
  HasConfiguredPassword?: boolean;
  HasConfiguredEasyPassword?: boolean;
  EnableAutoLogin?: boolean;
  LastLoginDate?: string;
  LastActivityDate?: string;
  PrimaryImageTag?: string;
}

export interface JellyfinAuthResult {
  User: JellyfinUser;
  AccessToken: string;
  ServerId: string;
}

export interface JellyfinQuickConnectResult {
  Authenticated: boolean;
  Secret: string;
  Code: string;
  Authentication: string;
  Error?: string;
  Date?: string;
}

export interface JellyfinUserView {
  Id: string;
  Name: string;
  ServerId?: string;
  CollectionType?: string; // 'movies', 'tvshows', 'music', etc.
  Type?: string;
  Path?: string;
  Locations?: string[];
}

export interface JellyfinUserData {
  PlaybackPositionTicks?: number;
  PlayCount?: number;
  IsFavorite?: boolean;
  Played?: boolean;
  UnplayedItemCount?: number;
}

export interface JellyfinMediaStream {
  Codec?: string;
  CodecTag?: string;
  Language?: string;
  TimeBase?: string;
  Title?: string;
  DisplayTitle?: string;
  IsInterlaced?: boolean;
  ChannelLayout?: string;
  Channels?: number;
  BitRate?: number;
  SampleRate?: number;
  IsDefault?: boolean;
  IsForced?: boolean;
  Type?: 'Audio' | 'Video' | 'Subtitle';
  Index?: number;
  Height?: number;
  Width?: number;
  VideoDoViTitle?: string;
  VideoRangeType?: string;
  VideoRange?: string;
  RealFrameRate?: number;
  AverageFrameRate?: number;
  AspectRatio?: string;
  IsExternal?: boolean;
  IsTextSubtitleStream?: boolean;
  ColorSpace?: string;
  ColorTransfer?: string;
  ColorPrimaries?: string;
  BitDepth?: number;
}

export interface JellyfinMediaSource {
  Id?: string;
  Path?: string;
  Protocol?: string;
  Container?: string;
  Size?: number;
  Name?: string;
  IsRemote?: boolean;
  ETag?: string;
  RunTimeTicks?: number;
  SupportsDirectPlay?: boolean;
  SupportsDirectStream?: boolean;
  SupportsTranscoding?: boolean;
  TranscodingUrl?: string;
  MediaStreams?: JellyfinMediaStream[];
}

export interface JellyfinBaseItem {
  Id: string;
  Name: string;
  ServerId?: string;
  Type: string;
  IsFolder?: boolean;
  MediaType?: string;
  CollectionType?: string;
  RecursiveItemCount?: number;
  ChildCount?: number;
  UserData?: JellyfinUserData;
  ProviderIds?: Record<string, string>;
  Overview?: string;
  Taglines?: string[];
  Genres?: string[];
  GenreItems?: Array<{ Name: string; Id: string }>;
  RunTimeTicks?: number;
  ProductionYear?: number;
  PremiereDate?: string;
  OfficialRating?: string;
  CommunityRating?: number;
  CriticRating?: number;
  PrimaryImageAspectRatio?: number;
  ImageTags?: Record<string, string>;
  BackdropImageTags?: string[];
  SeriesName?: string;
  SeriesId?: string;
  SeasonName?: string;
  SeasonId?: string;
  IndexNumber?: number;
  ParentIndexNumber?: number;
  MediaSources?: JellyfinMediaSource[];
  MediaStreams?: JellyfinMediaStream[];
}

export interface FormattedMediaInfo {
  resolution?: string;
  aspectRatio?: string;
  frameRate?: string;
  bitrate?: string;
  bitDepth?: string;
  videoRange?: string;
  colorSpace?: string;
  videoCodec?: string;
  audioCodec?: string;
  container?: string;
  fileSize?: string;
}

export interface LanguageSupportRow {
  code: string;
  name: string;
  hasAudio: boolean;
  hasSubtitles: boolean;
  audioTitles: string[];
  subtitleTitles: string[];
}

