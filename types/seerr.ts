export type SeerrMediaStatus = 1 | 2 | 3 | 4 | 5;

// Status
// 1 = UNKNOWN (Not requested)
// 2 = PENDING (Requested, waiting for approval)
// 3 = PROCESSING / APPROVED (Approved & downloading)
// 4 = AVAILABLE (Available in media server)
// 5 = PARTIALLY_AVAILABLE (For TV series, some seasons available)

export interface SeerrServerStatus {
  version: string;
  commitTag?: string;
  updateAvailable?: boolean;
  appName?: string;
}

export interface SeerrUser {
  id: number;
  email: string;
  username: string;
  avatar?: string;
  permissions?: number;
  userType?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SeerrMediaInfo {
  id: number;
  tmdbId: number;
  tvdbId?: number;
  status: SeerrMediaStatus;
  requests?: SeerrRequest[];
  createdAt?: string;
  updatedAt?: string;
}

export interface SeerrRequest {
  id: number;
  status: number; // 1 = PENDING, 2 = APPROVED, 3 = DECLINED
  media: SeerrMediaInfo;
  requestedBy: SeerrUser;
  modifiedBy?: SeerrUser;
  is4k?: boolean;
  serverId?: number;
  profileId?: number;
  rootFolder?: string;
  seasons?: { id: number; seasonNumber: number; status: number }[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateRequestPayload {
  mediaType: 'movie' | 'tv';
  mediaId: number;
  seasons?: number[] | 'all';
  is4k?: boolean;
  serverId?: number;
  profileId?: number;
  rootFolder?: string;
}

export interface SeerrTestResult {
  success: boolean;
  appName?: string;
  version?: string;
  user?: SeerrUser;
  error?: string;
}

export type SeerrAuthMethod = 'jellyfin' | 'apikey';

export interface SeerrConfig {
  serverId?: string;
  serverUrl: string;
  apiKey?: string;
  sessionToken?: string;
  username?: string;
  version?: string;
  appName?: string;
  isConnected?: boolean;
  useProxy?: boolean;
  authMethod?: SeerrAuthMethod;
}

export interface SeerrJellyfinAuthPayload {
  hostname: string;
  username: string;
  password?: string;
}

