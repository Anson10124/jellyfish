'use client';

import { useTranslation } from '@/hooks/ui/use-translation';
import { ConnectionServerStep } from './connection-server-step';
import type { ConnectionMode } from '@/lib/api/connection-mode';

interface SeerrServerStepProps {
  direction: number;
  seerrServerUrl: string;
  setSeerrServerUrl: (url: string) => void;
  seerrMode: ConnectionMode;
  setSeerrMode: (mode: ConnectionMode) => void;
  seerrUseProxy: boolean;
  isTestingSeerr: boolean;
  seerrVerified: boolean;
  seerrInfo: { appName?: string; version?: string } | null;
  seerrError: string | null;
  setSeerrVerified: (verified: boolean) => void;
  setSeerrError: (error: string | null) => void;
  onCheckSeerrServer: (url?: string) => void;
  onContinue: () => void;
  onSkip: () => void;
  onBack: () => void;
  hideBack?: boolean;
}

export function SeerrServerStep({
  direction,
  seerrServerUrl,
  setSeerrServerUrl,
  seerrMode,
  setSeerrMode,
  seerrUseProxy,
  isTestingSeerr,
  seerrVerified,
  seerrInfo,
  seerrError,
  setSeerrVerified,
  setSeerrError,
  onCheckSeerrServer,
  onContinue,
  onSkip,
  onBack,
  hideBack = false,
}: SeerrServerStepProps) {
  const { t } = useTranslation();
  const resetVerification = () => { setSeerrVerified(false); setSeerrError(null); };
  return <ConnectionServerStep service="Seerr" direction={direction}
    title={t('seerr.serverStepTitle', 'Connect with Seerr')}
    subtitle={t('seerr.serverStepSubtitle', 'Integrate your Seerr instance to search, request, and track movies & TV shows directly inside Jellyfish.')}
    serverUrl={seerrServerUrl} onUrlChange={(url) => { setSeerrServerUrl(url); resetVerification(); }}
    mode={seerrMode} onModeChange={(value) => { setSeerrMode(value); resetVerification(); }} useProxy={seerrUseProxy}
    busy={isTestingSeerr} verified={seerrVerified} serverName={seerrInfo?.appName} version={seerrInfo?.version}
    error={seerrError} onCheck={() => onCheckSeerrServer()} onContinue={onContinue}
    onBack={hideBack ? undefined : onBack} backLabel={t('connect.backToAuth', 'Account Login')} onSkip={onSkip} />;
}
