'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useServerConfig } from '@/hooks/connect/use-server-config';
import { JellyfinService } from '@/services/jellyfin.service';
import { SeerrService } from '@/services/seerr.service';
import { useTranslation } from '@/hooks/ui/use-translation';
import { getErrorMessage } from '@/lib/utils';
import type { SeerrAuthMethod } from '@/types/seerr';

export type AuthMethod = 'credentials' | 'quickconnect';
export type QuickConnectStatus = 'idle' | 'waiting' | 'authorized' | 'error';

export interface ServerInfo {
  name?: string;
  version?: string;
}

export function useConnectFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const {
    jellyfinConfig,
    servers,
    connectWithPassword,
    connectWithQuickConnect,
    verifyServerUrl,
    saveSeerrConfig,
  } = useServerConfig();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  useEffect(() => {
    const stepParam = searchParams?.get('step');
    if (stepParam === 'seerr' || stepParam === '3') {
      setStep(3);
    }
  }, [searchParams]);


  const [direction, setDirection] = useState<1 | -1>(1);

  // Step 1: Jellyfin Server URL
  const [serverUrl, setServerUrl] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [serverVerified, setServerVerified] = useState(false);
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Step 2: Jellyfin Auth
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

  // Step 3 & 4: Seerr Server & Auth
  const [seerrServerUrl, setSeerrServerUrl] = useState('');
  const [seerrUseProxy, setSeerrUseProxy] = useState(true);
  const [isTestingSeerr, setIsTestingSeerr] = useState(false);
  const [seerrVerified, setSeerrVerified] = useState(false);
  const [seerrInfo, setSeerrInfo] = useState<{ appName?: string; version?: string } | null>(null);
  const [seerrError, setSeerrError] = useState<string | null>(null);

  // Step 4 Seerr Auth
  const [seerrAuthMethod, setSeerrAuthMethod] = useState<SeerrAuthMethod>('jellyfin');
  const [seerrUsername, setSeerrUsername] = useState('');
  const [seerrPassword, setSeerrPassword] = useState('');
  const [seerrApiKey, setSeerrApiKey] = useState('');
  const [isAuthenticatingSeerr, setIsAuthenticatingSeerr] = useState(false);
  const [seerrAuthError, setSeerrAuthError] = useState<string | null>(null);

  const [isExiting, setIsExiting] = useState(false);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Pre-fill Seerr username from Jellyfin credentials when username changes or steps advance
  useEffect(() => {
    if (username && !seerrUsername) {
      setSeerrUsername(username);
    }
  }, [username, seerrUsername]);

  const handleCheckServer = useCallback(
    async (urlToCheck?: string) => {
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
    },
    [serverUrl, t, verifyServerUrl]
  );

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
        setIsAuthenticating(false);
        setDirection(1);
        setStep(3);
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
        setIsAuthenticating(false);
        setDirection(1);
        setStep(3);
      } catch (err: unknown) {
        setIsAuthenticating(false);
        setQcError(getErrorMessage(err) || t('connect.errors.quickConnectLoginFailed', 'Quick Connect login failed.'));
      }
    }
  };

  // Step 3: Seerr Server URL check
  const handleCheckSeerrServer = async (urlToCheck?: string) => {
    const targetUrl = typeof urlToCheck === 'string' ? urlToCheck : seerrServerUrl;
    const cleanUrl = targetUrl.trim();

    if (!cleanUrl) {
      setSeerrError(t('seerr.enterServerUrl', 'Please enter your Seerr server address.'));
      setSeerrVerified(false);
      return false;
    }

    setIsTestingSeerr(true);
    setSeerrError(null);
    setSeerrVerified(false);
    setSeerrInfo(null);

    const res = await SeerrService.testConnection(cleanUrl, undefined, seerrUseProxy);
    setIsTestingSeerr(false);

    if (res.success) {
      setSeerrVerified(true);
      setSeerrInfo({
        appName: res.appName || 'Seerr',
        version: res.version,
      });
      return true;
    } else {
      setSeerrVerified(false);
      setSeerrError(res.error || t('seerr.couldNotConnect', 'Could not connect to Seerr server.'));
      return false;
    }
  };

  const handleContinueToStep4 = () => {
    if (!seerrVerified) return;
    setDirection(1);
    setStep(4);
  };

  const handleBackToStep2 = () => {
    const stepParam = searchParams?.get('step');
    if (jellyfinConfig && (stepParam === 'seerr' || stepParam === '3')) {
      router.push('/');
    } else {
      setDirection(-1);
      setStep(2);
    }
  };



  const handleBackToStep3 = () => {
    setDirection(-1);
    setStep(3);
  };

  // Step 4: Submit Seerr Authentication
  const handleFinishSeerr = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSeerrAuthError(null);

    if (seerrAuthMethod === 'jellyfin') {
      if (!seerrUsername.trim()) {
        setSeerrAuthError(t('connect.errors.enterUsername', 'Please enter your Jellyfin username.'));
        return;
      }

      setIsAuthenticatingSeerr(true);
      try {
        const user = await SeerrService.authenticateWithJellyfin(
          seerrServerUrl.trim(),
          serverUrl.trim(),
          seerrUsername.trim(),
          seerrPassword,
          seerrUseProxy
        );
        setIsAuthenticatingSeerr(false);

        saveSeerrConfig({
          serverUrl: seerrServerUrl.trim(),
          useProxy: seerrUseProxy,
          username: user.username,
          version: seerrInfo?.version,
          appName: seerrInfo?.appName,
          authMethod: 'jellyfin',
          isConnected: true,
        });

        triggerExitAndNavigate();
      } catch (err: unknown) {
        setIsAuthenticatingSeerr(false);
        setSeerrAuthError(getErrorMessage(err) || 'Jellyfin authentication with Seerr failed.');
      }
    } else {
      // API Key method
      if (!seerrApiKey.trim()) {
        setSeerrAuthError('Please enter your Seerr API key.');
        return;
      }

      setIsAuthenticatingSeerr(true);
      try {
        const res = await SeerrService.testConnection(
          seerrServerUrl.trim(),
          seerrApiKey.trim(),
          seerrUseProxy
        );
        setIsAuthenticatingSeerr(false);

        if (res.success) {
          saveSeerrConfig({
            serverUrl: seerrServerUrl.trim(),
            apiKey: seerrApiKey.trim(),
            useProxy: seerrUseProxy,
            username: res.user?.username,
            version: res.version || seerrInfo?.version,
            appName: res.appName || seerrInfo?.appName,
            authMethod: 'apikey',
            isConnected: true,
          });

          triggerExitAndNavigate();
        } else {
          setSeerrAuthError(res.error || t('seerr.couldNotConnect', 'Could not connect to Seerr server.'));
        }
      } catch (err: unknown) {
        setIsAuthenticatingSeerr(false);
        setSeerrAuthError(getErrorMessage(err) || 'Failed to authenticate API key with Seerr.');
      }
    }
  };

  const handleSkipSeerr = () => {
    triggerExitAndNavigate();
  };

  const canSubmitStep2 =
    (selectedMethod === 'credentials' && username.trim().length > 0) ||
    (selectedMethod === 'quickconnect' && qcStatus === 'authorized');

  const canSubmitStep4 =
    (seerrAuthMethod === 'jellyfin' && seerrUsername.trim().length > 0) ||
    (seerrAuthMethod === 'apikey' && seerrApiKey.trim().length > 0);

  const isDirectSeerrStep = Boolean(jellyfinConfig && (searchParams?.get('step') === 'seerr' || searchParams?.get('step') === '3'));

  return {
    step,
    direction,
    isExiting,
    isDirectSeerrStep,
    // Step 1

    serverUrl,
    setServerUrl,
    isVerifying,
    serverVerified,
    serverInfo,
    verifyError,
    setVerifyError,
    setServerVerified,
    handleCheckServer,
    handleContinueToStep2,
    // Step 2
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
    handleBackToStep1,
    handleSelectMethod,
    handleLetsStart,
    startQuickConnectFlow,
    // Step 3 Seerr Server
    seerrServerUrl,
    setSeerrServerUrl,
    seerrUseProxy,
    setSeerrUseProxy,
    isTestingSeerr,
    seerrVerified,
    seerrInfo,
    seerrError,
    setSeerrVerified,
    setSeerrError,
    handleCheckSeerrServer,
    handleContinueToStep4,
    handleBackToStep2,
    // Step 4 Seerr Auth
    seerrAuthMethod,
    setSeerrAuthMethod,
    seerrUsername,
    setSeerrUsername,
    seerrPassword,
    setSeerrPassword,
    seerrApiKey,
    setSeerrApiKey,
    isAuthenticatingSeerr,
    seerrAuthError,
    canSubmitStep4,
    handleBackToStep3,
    handleFinishSeerr,
    handleSkipSeerr,
  };
}
