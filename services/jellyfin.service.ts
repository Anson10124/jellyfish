import { serverFetch, normalizeServerUrl } from '@/lib/api/fetch-client';
import { JellyfinAuthResult, JellyfinBaseItem, JellyfinPublicSystemInfo, JellyfinQuickConnectResult, JellyfinUserView } from '@/types/jellyfin';
import { getStoredDeviceId } from '@/lib/storage/server-storage';

const JELLYFIN_DEFAULT_FIELDS =
  'Overview,Genres,PrimaryImageAspectRatio,ProductionYear,PremiereDate,ProviderIds,GenreItems,RecursiveItemCount,ChildCount,UserData,MediaSources';

function extractAudioStreamInfo(item?: JellyfinBaseItem | null) {
  const primaryMediaSource = item?.MediaSources?.[0];
  const mediaSourceId = primaryMediaSource?.Id || item?.Id;
  const runTimeTicks = primaryMediaSource?.RunTimeTicks || item?.RunTimeTicks;
  const container = (primaryMediaSource?.Container || '').toLowerCase();

  const streams = primaryMediaSource?.MediaStreams || item?.MediaStreams;
  let audioStreamIndex: number | undefined;
  let audioCodec: string | undefined;

  if (streams && streams.length > 0) {
    const audioStreams = streams.filter((s) => s.Type === 'Audio');
    if (audioStreams.length > 0) {
      const defaultAudio = audioStreams.find((s) => s.IsDefault) || audioStreams[0];
      if (defaultAudio.Index !== undefined) {
        audioStreamIndex = defaultAudio.Index;
      }
      if (defaultAudio.Codec) {
        audioCodec = defaultAudio.Codec.toLowerCase();
      }
    }
  }

  return { primaryMediaSource, mediaSourceId, runTimeTicks, container, audioStreamIndex, audioCodec };
}

export const JellyfinService = {
  // Test connection
  async testConnection(serverUrl: string): Promise<JellyfinPublicSystemInfo> {
    return serverFetch<JellyfinPublicSystemInfo>(serverUrl, '/System/Info/Public', {
      timeoutMs: 8000,
    });
  },

  // Authenticate using username & password
  async authenticateByName(
    serverUrl: string,
    username: string,
    password?: string
  ): Promise<JellyfinAuthResult> {
    const deviceId = getStoredDeviceId();
    try {
      return await serverFetch<JellyfinAuthResult>(serverUrl, '/Users/AuthenticateByName', {
        method: 'POST',
        deviceId,
        body: JSON.stringify({
          Username: username,
          Pw: password || '',
        }),
      });
    } catch (err: any) {
      if (err?.message?.includes('Server returned status 401')) {
        throw new Error('AUTH_INVALID_CREDENTIALS');
      }
      throw err;
    }
  },

  // Initiate Quick Connect session
  async initiateQuickConnect(serverUrl: string): Promise<JellyfinQuickConnectResult> {
    const deviceId = getStoredDeviceId();
    return serverFetch<JellyfinQuickConnectResult>(serverUrl, '/QuickConnect/Initiate', {
      method: 'POST',
      deviceId,
    });
  },

  // Check status of Quick Connect session
  async checkQuickConnect(serverUrl: string, secret: string): Promise<JellyfinQuickConnectResult> {
    const deviceId = getStoredDeviceId();
    return serverFetch<JellyfinQuickConnectResult>(
      serverUrl,
      `/QuickConnect/Connect?secret=${encodeURIComponent(secret)}`,
      {
        method: 'GET',
        deviceId,
      }
    );
  },

  // Get User Libraries/Views
  async getUserViews(serverUrl: string, userId: string, token: string): Promise<JellyfinUserView[]> {
    const res = await serverFetch<{ Items: JellyfinUserView[]; TotalRecordCount: number }>(
      serverUrl,
      `/Users/${userId}/Views`,
      { token }
    );
    return res.Items || [];
  },

  // Get items in a library
  async getItems(
    serverUrl: string,
    userId: string,
    token: string,
    options: {
      parentId?: string;
      startIndex?: number;
      limit?: number;
      recursive?: boolean;
      sortBy?: string;
      sortOrder?: 'Ascending' | 'Descending';
      includeItemTypes?: string;
    } = {}
  ): Promise<{ Items: JellyfinBaseItem[]; TotalRecordCount: number }> {
    const params = new URLSearchParams();
    if (options.parentId) params.set('ParentId', options.parentId);
    if (options.recursive ?? true) params.set('Recursive', 'true');
    if (options.startIndex !== undefined) params.set('StartIndex', options.startIndex.toString());
    if (options.limit !== undefined) params.set('Limit', options.limit.toString());
    if (options.sortBy) params.set('SortBy', options.sortBy);
    if (options.sortOrder) params.set('SortOrder', options.sortOrder);
    if (options.includeItemTypes) params.set('IncludeItemTypes', options.includeItemTypes);
    params.set('Fields', JELLYFIN_DEFAULT_FIELDS);

    const endpoint = `/Users/${userId}/Items?${params.toString()}`;
    return serverFetch<{ Items: JellyfinBaseItem[]; TotalRecordCount: number }>(serverUrl, endpoint, { token });
  },

  // Get single item / library details by ID
  async getItem(serverUrl: string, userId: string, token: string, itemId: string): Promise<JellyfinBaseItem> {
    return serverFetch<JellyfinBaseItem>(serverUrl, `/Users/${userId}/Items/${itemId}?Fields=MediaSources`, { token });
  },

  // Search items by Provider ID and optional Title
  async searchByProviderId(
    serverUrl: string,
    userId: string,
    token: string,
    provider: 'tmdb' | 'imdb' | 'tvdb',
    providerId: string,
    includeItemTypes?: string,
    title?: string
  ): Promise<{ Items: JellyfinBaseItem[]; TotalRecordCount: number }> {
    const pidLower = String(providerId).toLowerCase();

    // 1. Try SearchTerm query first if title is provided
    if (title) {
      const searchParams = new URLSearchParams();
      searchParams.set('SearchTerm', title);
      searchParams.set('Recursive', 'true');
      if (includeItemTypes) searchParams.set('IncludeItemTypes', includeItemTypes);
      searchParams.set('Fields', JELLYFIN_DEFAULT_FIELDS);

      try {
        const searchRes = await serverFetch<{ Items: JellyfinBaseItem[]; TotalRecordCount: number }>(
          serverUrl,
          `/Users/${userId}/Items?${searchParams.toString()}`,
          { token }
        );

        const searchItems = searchRes.Items || [];

        // Match by Provider ID or exact Title
        const matches = searchItems.filter((item) => {
          const tmdbId = item.ProviderIds?.Tmdb || item.ProviderIds?.tmdb || item.ProviderIds?.[provider];
          if (tmdbId && String(tmdbId).toLowerCase() === pidLower) return true;
          if (item.Name && item.Name.toLowerCase().trim() === title.toLowerCase().trim()) return true;
          return false;
        });

        if (matches.length > 0) {
          return { Items: matches, TotalRecordCount: matches.length };
        }
      } catch (err) {
        console.warn('SearchTerm query failed, falling back to AnyProviderIdEquals:', err);
      }
    }

    // 2. Fallback to AnyProviderIdEquals
    const params = new URLSearchParams();
    params.set('AnyProviderIdEquals', `${provider}.${providerId}`);
    params.set('Recursive', 'true');
    if (includeItemTypes) params.set('IncludeItemTypes', includeItemTypes);
    params.set('Fields', JELLYFIN_DEFAULT_FIELDS);

    const endpoint = `/Users/${userId}/Items?${params.toString()}`;
    const response = await serverFetch<{ Items: JellyfinBaseItem[]; TotalRecordCount: number }>(
      serverUrl,
      endpoint,
      { token }
    );

    const matchedItems = (response.Items || []).filter((item) => {
      const itemProviderId = item.ProviderIds?.[provider] || item.ProviderIds?.Tmdb || item.ProviderIds?.tmdb;
      return itemProviderId && String(itemProviderId).toLowerCase() === pidLower;
    });

    return {
      Items: matchedItems,
      TotalRecordCount: matchedItems.length,
    };
  },

  // Construct stream URL for browser playback
  getStreamUrl(serverUrl: string, itemId: string, token: string, item?: JellyfinBaseItem | null): string {
    const base = normalizeServerUrl(serverUrl);
    const deviceId = getStoredDeviceId();

    const { primaryMediaSource, mediaSourceId, container, audioStreamIndex, audioCodec } = extractAudioStreamInfo(item);

    const isBrowserDirectPlayAudio = audioCodec === 'aac' || audioCodec === 'mp3' || audioCodec === 'flac';
    const isBrowserDirectPlayContainer = container === 'mp4' || container === 'm4v' || container === 'webm';

    if (isBrowserDirectPlayAudio && isBrowserDirectPlayContainer && primaryMediaSource?.SupportsDirectPlay !== false) {
      return `${base}/Videos/${itemId}/stream?static=true&api_key=${token}`;
    }

    const params = new URLSearchParams({
      DeviceId: deviceId,
      MediaSourceId: mediaSourceId || itemId,
      VideoCodec: 'av1,hevc,h264,vp9',
      AudioCodec: 'aac',
      VideoBitrate: '140000000',
      AudioBitrate: '384000',
      TranscodingMaxAudioChannels: '2',
      MaxAudioChannels: '2',
      RequireAvc: 'false',
      EnableAudioVbrEncoding: 'true',
      SegmentContainer: 'mp4',
      MinSegments: '1',
      BreakOnNonKeyFrames: 'false',
      api_key: token,
    });

    if (audioStreamIndex !== undefined) {
      params.set('AudioStreamIndex', audioStreamIndex.toString());
    }

    return `${base}/videos/${itemId}/master.m3u8?${params.toString()}`;
  },

  // Construct primary image URL
  getImageUrl(serverUrl: string, itemId: string, options: { width?: number; height?: number; tag?: string; type?: 'Primary' | 'Backdrop' | 'Thumb' } = {}): string {
    const base = normalizeServerUrl(serverUrl);
    const imgType = options.type || 'Primary';
    let url = `${base}/Items/${itemId}/Images/${imgType}`;
    const params = new URLSearchParams();
    if (options.width) params.set('fillWidth', options.width.toString());
    if (options.height) params.set('fillHeight', options.height.toString());
    if (options.tag) params.set('tag', options.tag);

    const query = params.toString();
    return query ? `${url}?${query}` : url;
  },

  // Report playback start
  async reportPlaybackStart(
    serverUrl: string,
    token: string,
    itemId: string,
    positionTicks: number = 0
  ): Promise<void> {
    try {
      await serverFetch(serverUrl, '/Sessions/Playing', {
        method: 'POST',
        token,
        body: JSON.stringify({
          ItemId: itemId,
          PlayMethod: 'DirectPlay',
          PositionTicks: positionTicks,
        }),
      });
    } catch (err) {
      console.warn('Failed to report playback start:', err);
    }
  },

  // Report playback progress heartbeat
  async reportPlaybackProgress(
    serverUrl: string,
    token: string,
    itemId: string,
    positionTicks: number = 0,
    isPaused: boolean = false
  ): Promise<void> {
    try {
      await serverFetch(serverUrl, '/Sessions/Playing/Progress', {
        method: 'POST',
        token,
        body: JSON.stringify({
          ItemId: itemId,
          PlayMethod: 'DirectPlay',
          PositionTicks: positionTicks,
          IsPaused: isPaused,
        }),
      });
    } catch (err) {
      console.warn('Failed to report playback progress:', err);
    }
  },

  // Report playback stopped
  async reportPlaybackStopped(
    serverUrl: string,
    token: string,
    itemId: string,
    positionTicks: number = 0
  ): Promise<void> {
    try {
      await serverFetch(serverUrl, '/Sessions/Playing/Stopped', {
        method: 'POST',
        token,
        body: JSON.stringify({
          ItemId: itemId,
          PositionTicks: positionTicks,
        }),
      });
    } catch (err) {
      console.warn('Failed to report playback stopped:', err);
    }
  },
};

