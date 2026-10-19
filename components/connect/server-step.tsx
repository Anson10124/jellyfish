'use client';

import type { ServerInfo } from '@/hooks/connect/use-connect-flow';
import { useTranslation } from '@/hooks/ui/use-translation';
import { ConnectionServerStep } from './connection-server-step';
export { slideVariants } from './connection-server-step';

interface ServerStepProps {
  direction: number;
  serverUrl: string;
  useProxy: boolean;
  onProxyChange: (useProxy: boolean) => void;
  setServerUrl: (url: string) => void;
  isVerifying: boolean;
  serverVerified: boolean;
  serverInfo: ServerInfo | null;
  verifyError: string | null;
  setServerVerified: (verified: boolean) => void;
  setVerifyError: (error: string | null) => void;
  onCheckServer: (url?: string) => void;
  onContinue: () => void;
}

export function ServerStep({
  direction,
  serverUrl,
  useProxy,
  onProxyChange,
  setServerUrl,
  isVerifying,
  serverVerified,
  serverInfo,
  verifyError,
  setServerVerified,
  setVerifyError,
  onCheckServer,
  onContinue,
}: ServerStepProps) {
  const { t } = useTranslation();
  const resetVerification = () => { setServerVerified(false); setVerifyError(null); };
  return <ConnectionServerStep service="Jellyfin" direction={direction}
    title={t('connect.title', 'Connect with your Jellyfin server to get started')}
    subtitle={useProxy
      ? t('connect.proxySubtitle', 'Proxied mode helps you connect when your server’s CORS settings block direct browser access.')
      : t('connect.subtitle', 'Jellyfish runs in your browser. Your server address and credentials stay safely on your local device.')}
    serverUrl={serverUrl} onUrlChange={(url) => { setServerUrl(url); resetVerification(); }}
    useProxy={useProxy} onProxyChange={(value) => { onProxyChange(value); resetVerification(); }}
    busy={isVerifying} verified={serverVerified} serverName={serverInfo?.name} version={serverInfo?.version}
    error={verifyError} onCheck={() => onCheckServer()} onContinue={onContinue} />;
}
