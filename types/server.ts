export type ConnectionStatus = 'disconnected' | 'testing' | 'connected' | 'error';

export interface JellyfinConfig {
  id: string;
  serverUrl: string;
  username: string;
  accessToken: string;
  userId: string;
  deviceId: string;
  deviceName?: string;
  clientVersion?: string;
  serverName?: string;
  version?: string;
  userPrimaryImageTag?: string;
}

export interface MultiServerStore {
  servers: JellyfinConfig[];
  activeServerId: string | null;
}

export interface SeerrConfig {
  serverUrl: string;
  apiKey?: string;
  sessionToken?: string;
}

export interface ServerConnectionState {
  status: ConnectionStatus;
  serverName?: string;
  version?: string;
  error?: string | null;
  publicInfo?: {
    Id?: string;
    ServerName?: string;
    Version?: string;
    ProductName?: string;
    OperatingSystem?: string;
    StartupWizardCompleted?: boolean;
  };
}

export interface QuickConnectState {
  code: string;
  secret: string;
  authenticated: boolean;
  token?: string;
  userId?: string;
  error?: string | null;
}
