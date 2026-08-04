'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useServerConfig } from '@/hooks/connect/use-server-config';
import { JellyfinService } from '@/services/jellyfin.service';
import { useTranslation } from '@/hooks/ui/use-translation';
import { getErrorMessage } from '@/lib/utils';

export type AuthMethod = 'credentials' | 'quickconnect';
export type QuickConnectStatus = 'idle' | 'waiting' | 'authorized' | 'error';

export interface ServerInfo {
  name?: string;
  version?: string;
}

export function useConnectFlow() {
  const router = useRouter();
  const { t } = useTranslation();
  const {
    jellyfinConfig,
    servers,
    connectWithPassword,
    connectWithQuickConnect,
    verifyServerUrl,
  } = useServerConfig();

  const [step, setStep] = useState<1 | 2>(1);
  const [direction, setDirection] = useState<1 | -1>(1);

  const [serverUrl, setServerUrl] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [serverVerified, setServerVerified] = useState(false);
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const [selectedMethod, setSelectedMethod] = useState<AuthMethod>('credentials');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [quickConnectCode, setQuickConnectCode] = useState<string | null>(null);
  const [quickConnectSecret, setQuickConnectSecret] = useState<string | null>(null);
  const [isGeneratingQC, setIsGeneratingQC] = useState(false);
  const [qcStatus, setQcStatus] = useState<QuickConnectStatus>('idle');
  const [qcError, setQcError] = useState<string | null>(null);

  const [isExiting, setIsExiting] = useState(false);

  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleCheckServer = useCallback(async (urlToCheck?: string) => {
    const targetUrl = urlToCheck || serverUrl;
    if (!targetUrl.trim()) {
      setVerifyError(t('connect.errors.enterServerAddress', 'Please enter your Jellyfin server address.'));
      setServerVerified(false);
      return;
    }

    setIsVerifying(true);
    setVerifyError(null);
    setServerVerified(false);
    setServerInfo(null);

    const res = await verifyServerUrl(targetUrl);
    setIsVerifying(false);

    if (res.success && res.info) {
      setServerVerified(true);
      setServerInfo({
        name: res.info.ServerName || t('connect.defaultServerName', 'Jellyfin Server'),
        version: res.info.Version || t('connect.latestVersion', 'Latest'),
      });
    } else {
      setServerVerified(false);
      setVerifyError(res.error || t('connect.errors.couldNotConnect', 'Could not connect to Jellyfin server.'));
    }
  }, [serverUrl, t]);

  // Only pre-fill the server URL when there are no servers yet (reconnecting).
  // When adding a new server (servers.length > 0), start with a fresh form.
  useEffect(() => {
    if (servers.length === 0 && jellyfinConfig?.serverUrl) {
      const url = jellyfinConfig.serverUrl;
      Promise.resolve().then(() => {
        setServerUrl(url);
        handleCheckServer(url);
      });
    }
  }, [jellyfinConfig, servers.length, handleCheckServer]);

  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  const startQuickConnectFlow = async () => {
    if (!serverUrl || !serverVerified) return;

    setIsGeneratingQC(true);
    setQcError(null);
    setQcStatus('idle');

    if (pollTimerRef.current) clearInterval(pollTimerRef.current);

    try {
      const qcRes = await JellyfinService.initiateQuickConnect(serverUrl);
      setQuickConnectCode(qcRes.Code);
      setQuickConnectSecret(qcRes.Secret);
      setQcStatus('waiting');
      setIsGeneratingQC(false);

      pollTimerRef.current = setInterval(async () => {
        try {
          const status = await JellyfinService.checkQuickConnect(serverUrl, qcRes.Secret);
          if (status.Authenticated && status.Authentication) {
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
            setQcStatus('authorized');
          }
        } catch {
          // Ignore errors
        }
      }, 3000);
    } catch (err: unknown) {
      setIsGeneratingQC(false);
      setQcStatus('error');
      setQcError(getErrorMessage(err) || t('connect.errors.quickConnectFailed', 'Failed to initiate Quick Connect on server.'));
    }
  };

  const handleContinueToStep2 = () => {
    if (!serverVerified) return;
    setDirection(1);
    setStep(2);
    if (selectedMethod === 'quickconnect' && !quickConnectCode) {
      startQuickConnectFlow();
    }
  };

  const handleBackToStep1 = () => {
    setDirection(-1);
    setStep(1);
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
  };

  const handleSelectMethod = (method: AuthMethod) => {
    setSelectedMethod(method);
    setAuthError(null);
    setQcError(null);

    if (method === 'quickconnect' && !quickConnectCode) {
      startQuickConnectFlow();
    }
  };

  const triggerExitAndNavigate = () => {
    setIsExiting(true);
    setTimeout(() => {
      router.push('/');
    }, 450);
  };

  const handleLetsStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setQcError(null);

    if (selectedMethod === 'credentials') {
      if (!username.trim()) {
        setAuthError(t('connect.errors.enterUsername', 'Please enter your Jellyfin username.'));
        return;
      }

      setIsAuthenticating(true);
      try {
        await connectWithPassword(serverUrl, username, password);
        triggerExitAndNavigate();
      } catch (err: unknown) {
        setIsAuthenticating(false);
        setAuthError(getErrorMessage(err) || t('connect.errors.loginFailed', 'Login failed. Please check your credentials.'));
      }
    } else {
      if (qcStatus !== 'authorized' || !quickConnectSecret) {
        setQcError(t('connect.errors.approveQuickConnect', 'Please approve the Quick Connect code on your Jellyfin server first.'));
        return;
      }

      setIsAuthenticating(true);
      try {
        await connectWithQuickConnect(serverUrl, quickConnectSecret);
        triggerExitAndNavigate();
      } catch (err: unknown) {
        setIsAuthenticating(false);
        setQcError(getErrorMessage(err) || t('connect.errors.quickConnectLoginFailed', 'Quick Connect login failed.'));
      }
    }
  };

  const canSubmitStep2 =
    (selectedMethod === 'credentials' && username.trim().length > 0) ||
    (selectedMethod === 'quickconnect' && qcStatus === 'authorized');

  return {
    step,
    direction,
    isExiting,
    serverUrl,
    setServerUrl,
    isVerifying,
    serverVerified,
    serverInfo,
    verifyError,
    setVerifyError,
    setServerVerified,
    selectedMethod,
    username,
    setUsername,
    password,
    setPassword,
    isAuthenticating,
    authError,
    quickConnectCode,
    isGeneratingQC,
    qcStatus,
    qcError,
    canSubmitStep2,
    handleCheckServer,
    handleContinueToStep2,
    handleBackToStep1,
    handleSelectMethod,
    handleLetsStart,
    startQuickConnectFlow,
  };
}
