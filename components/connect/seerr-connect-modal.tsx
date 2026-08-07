'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Key, Loader2, CheckCircle2, AlertCircle, LogOut, User, Lock } from 'lucide-react';
import { useServerConfig } from '@/hooks/connect/use-server-config';
import { SeerrService } from '@/services/seerr.service';
import { useTranslation } from '@/hooks/ui/use-translation';
import { toast } from '@/components/ui/toast';
import { SeerrProxyToggle } from './seerr-proxy-toggle';
import type { SeerrAuthMethod } from '@/types/seerr';

interface SeerrConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SeerrConnectModal({ isOpen, onClose }: SeerrConnectModalProps) {
  const { t } = useTranslation();
  const { seerrConfig, saveSeerrConfig, disconnectSeerr, activeServer } = useServerConfig();

  const [serverUrl, setServerUrl] = useState('');
  const [authMethod, setAuthMethod] = useState<SeerrAuthMethod>('jellyfin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [useProxy, setUseProxy] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setServerUrl(seerrConfig?.serverUrl || '');
      setAuthMethod(seerrConfig?.authMethod || 'jellyfin');
      setUsername(seerrConfig?.username || activeServer?.username || '');
      setPassword('');
      setApiKey(seerrConfig?.apiKey || '');
      setUseProxy(seerrConfig?.useProxy ?? true);
      setError(null);
    }
  }, [isOpen, seerrConfig, activeServer]);

  if (!isOpen) return null;

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverUrl.trim()) {
      setError(t('seerr.enterServerUrl', 'Please enter your Seerr server address.'));
      return;
    }

    setIsTesting(true);
    setError(null);

    try {
      if (authMethod === 'jellyfin') {
        if (!username.trim()) {
          setError(t('connect.errors.enterUsername', 'Please enter your Jellyfin username.'));
          setIsTesting(false);
          return;
        }

        const user = await SeerrService.authenticateWithJellyfin(
          serverUrl.trim(),
          activeServer?.serverUrl || '',
          username.trim(),
          password,
          useProxy
        );
        setIsTesting(false);

        saveSeerrConfig({
          serverUrl: serverUrl.trim(),
          useProxy,
          username: user.username,
          authMethod: 'jellyfin',
          isConnected: true,
        });

        toast.success(
          'Seerr',
          t('seerr.connectedSuccess', 'Successfully connected to Seerr server!')
        );
        onClose();
      } else {
        if (!apiKey.trim()) {
          setError('Please enter your Seerr API key.');
          setIsTesting(false);
          return;
        }

        const res = await SeerrService.testConnection(serverUrl.trim(), apiKey.trim(), useProxy);
        setIsTesting(false);

        if (res.success) {
          saveSeerrConfig({
            serverUrl: serverUrl.trim(),
            apiKey: apiKey.trim(),
            useProxy,
            username: res.user?.username,
            version: res.version,
            appName: res.appName,
            authMethod: 'apikey',
            isConnected: true,
          });
          toast.success(
            res.appName || 'Seerr',
            t('seerr.connectedSuccess', 'Successfully connected to Seerr server!')
          );
          onClose();
        } else {
          setError(res.error || t('seerr.couldNotConnect', 'Could not connect to Seerr server.'));
        }
      }
    } catch (err: unknown) {
      setIsTesting(false);
      setError(err instanceof Error ? err.message : 'An error occurred during connection test.');
    }
  };

  const handleDisconnect = () => {
    disconnectSeerr();
    toast.info('Seerr', t('seerr.disconnected', 'Disconnected from Seerr server.'));
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-background/80 backdrop-blur-md"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-background/90 border border-border shadow-2xl p-6 backdrop-blur-2xl z-10 space-y-5"
        >
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  {t('seerr.settingsTitle', 'Seerr Integration')}
                </h3>
                {activeServer && (
                  <p className="text-[11px] text-foreground/50">
                    Bound to server: {activeServer.serverName || activeServer.serverUrl}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-foreground/50 hover:text-foreground hover:bg-foreground/10 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleTestAndSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                {t('connect.seerrUrlLabel', 'Seerr Server Address')}
              </label>
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-foreground/[0.05] border border-border focus-within:border-primary transition">
                <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                <input
                  type="url"
                  placeholder="http://localhost:5055"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  className="bg-transparent border-none outline-none text-sm text-foreground w-full placeholder:text-foreground/40"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
                {t('seerr.authTitle', 'Authentication Method')}
              </label>
              <div className="flex items-center gap-1 p-1 rounded-xl bg-foreground/[0.05] border border-border mb-3">
                <button
                  type="button"
                  onClick={() => setAuthMethod('jellyfin')}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    authMethod === 'jellyfin'
                      ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                      : 'text-foreground/50 hover:text-foreground/70 border border-transparent'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>{t('seerr.jellyfinSignInTitle', 'Jellyfin Login')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMethod('apikey')}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    authMethod === 'apikey'
                      ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                      : 'text-foreground/50 hover:text-foreground/70 border border-transparent'
                  }`}
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>{t('seerr.apiKeyTitle', 'API Key')}</span>
                </button>
              </div>

              {authMethod === 'jellyfin' ? (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-foreground/[0.05] border border-border focus-within:border-primary transition">
                    <User className="w-4 h-4 text-foreground/50 shrink-0" />
                    <input
                      type="text"
                      placeholder={t('connect.usernamePlaceholder', 'Username')}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="bg-transparent border-none outline-none text-sm text-foreground w-full placeholder:text-foreground/40"
                    />
                  </div>
                  <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-foreground/[0.05] border border-border focus-within:border-primary transition">
                    <Lock className="w-4 h-4 text-foreground/50 shrink-0" />
                    <input
                      type="password"
                      placeholder={t('connect.passwordPlaceholder', 'Password (optional)')}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-transparent border-none outline-none text-sm text-foreground w-full placeholder:text-foreground/40"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-foreground/[0.05] border border-border focus-within:border-primary transition">
                  <Key className="w-4 h-4 text-foreground/50 shrink-0" />
                  <input
                    type="password"
                    placeholder="Seerr Settings -> General -> API Key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="bg-transparent border-none outline-none text-sm text-foreground w-full placeholder:text-foreground/40"
                  />
                </div>
              )}
            </div>

            <SeerrProxyToggle useProxy={useProxy} onToggle={setUseProxy} variant="modal" />

            {seerrConfig?.isConnected && (
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium px-1">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  Currently connected to {seerrConfig.appName || 'Seerr'}
                  {seerrConfig.username ? ` as ${seerrConfig.username}` : ''}
                </span>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-xs text-rose-400 font-medium px-1">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between gap-3">
              {seerrConfig?.isConnected ? (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold text-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t('seerr.disconnect', 'Disconnect')}</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-foreground/70 hover:text-foreground hover:bg-foreground/10 transition cursor-pointer"
                >
                  {t('common.cancel', 'Cancel')}
                </button>

                <button
                  type="submit"
                  disabled={isTesting || !serverUrl.trim()}
                  className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 disabled:opacity-50 transition cursor-pointer flex items-center gap-2"
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{t('connect.testing', 'Connecting...')}</span>
                    </>
                  ) : (
                    <span>{t('seerr.saveConnection', 'Save Connection')}</span>
                  )}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
