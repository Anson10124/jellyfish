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
}

export interface JellyfinBaseItem {
  Id: string;
  Name: string;
  ServerId?: string;
  Type: string;
  Overview?: string;
  Taglines?: string[];
  Genres?: string[];
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
}
