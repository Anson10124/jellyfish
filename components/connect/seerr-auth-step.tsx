'use client';

import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Loader2, User, Lock, Key, AlertCircle, CheckCircle2 } from 'lucide-react';
import { slideVariants } from './server-step';
import { useTranslation } from '@/hooks/ui/use-translation';
import type { SeerrAuthMethod } from '@/types/seerr';

interface SeerrAuthStepProps {
  direction: number;
  seerrServerUrl: string;
  selectedMethod: SeerrAuthMethod;
  onSelectMethod: (method: SeerrAuthMethod) => void;
  // Jellyfin auth fields
  seerrUsername: string;
  setSeerrUsername: (val: string) => void;
  seerrPassword: string;
  setSeerrPassword: (val: string) => void;
  // API Key auth field
  seerrApiKey: string;
  setSeerrApiKey: (key: string) => void;
  // Statuses
  isAuthenticating: boolean;
  authError: string | null;
  canSubmit: boolean;
  onBack: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onSkip: () => void;
}

export function SeerrAuthStep({
  direction,
  seerrServerUrl,
  selectedMethod,
  onSelectMethod,
  seerrUsername,
  setSeerrUsername,
  seerrPassword,
  setSeerrPassword,
  seerrApiKey,
  setSeerrApiKey,
  isAuthenticating,
  authError,
  canSubmit,
  onBack,
  onSubmit,
  onSkip,
}: SeerrAuthStepProps) {
  const { t } = useTranslation();

  return (
    <motion.main
      key="step-4"
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
      className="w-full max-w-4xl flex flex-col items-center z-10"
    >
      <div className="w-full flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 text-white/70 hover:text-white text-sm font-medium transition-all cursor-pointer border border-white/10 backdrop-blur-xl"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('seerr.backToServer', 'Change Seerr Server')}</span>
        </button>
      </div>

      <div className="text-center max-w-2xl mb-8 space-y-3">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
          {t('seerr.authTitle', 'Authenticate with Seerr')}
        </h1>
        <p className="text-white/60 text-sm font-normal">
          {t('seerr.authSubtitle', 'Choose how to log in to your Seerr server')}{' '}
          <strong className="text-white">{seerrServerUrl}</strong>
        </p>
      </div>

      <form onSubmit={onSubmit} className="w-full flex flex-col items-center">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-10">
          <div
            onClick={() => onSelectMethod('jellyfin')}
            className={`group relative flex flex-col rounded-3xl p-6 transition-all duration-300 border backdrop-blur-xl cursor-pointer min-h-[300px] ${
              selectedMethod === 'jellyfin'
                ? 'border-white/30 bg-white/[0.08] shadow-2xl'
                : 'border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/[0.08] shadow-xl'
            }`}
          >
            <h2 className="text-xl font-bold text-white mb-2 flex items-center justify-between">
              <span>{t('seerr.jellyfinSignInTitle', 'Sign in with Jellyfin')}</span>
              {selectedMethod === 'jellyfin' && (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
            </h2>
            <p className="text-sm text-white/60 mb-6 leading-relaxed">
              {t(
                'seerr.jellyfinSignInDesc',
                'Log in using your Jellyfin account registered on your Seerr instance.'
              )}
            </p>

            <div className="mt-auto space-y-3 pt-4 border-t border-white/10">
              <div className="relative flex items-center">
                <User className="absolute left-3.5 w-4 h-4 text-white/60" />
                <input
                  type="text"
                  placeholder={t('connect.usernamePlaceholder', 'Username')}
                  value={seerrUsername}
                  onChange={(e) => {
                    onSelectMethod('jellyfin');
                    setSeerrUsername(e.target.value);
                  }}
                  onFocus={() => onSelectMethod('jellyfin')}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none placeholder:text-white/60 focus:border-white/30 transition-all"
                />
              </div>

              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 w-4 h-4 text-white/60" />
                <input
                  type="password"
                  placeholder={t('connect.passwordPlaceholder', 'Password (optional if none set)')}
                  value={seerrPassword}
                  onChange={(e) => {
                    onSelectMethod('jellyfin');
                    setSeerrPassword(e.target.value);
                  }}
                  onFocus={() => onSelectMethod('jellyfin')}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none placeholder:text-white/60 focus:border-white/30 transition-all"
                />
              </div>

              {selectedMethod === 'jellyfin' && authError && (
                <p className="text-xs text-rose-400 flex items-center gap-1.5 pt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{authError}</span>
                </p>
              )}
            </div>
          </div>

          <div
            onClick={() => onSelectMethod('apikey')}
            className={`group relative flex flex-col rounded-3xl p-6 transition-all duration-300 border backdrop-blur-xl cursor-pointer min-h-[300px] ${
              selectedMethod === 'apikey'
                ? 'border-white/30 bg-white/[0.08] shadow-2xl'
                : 'border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/[0.08] shadow-xl'
            }`}
          >
            <h2 className="text-xl font-bold text-white mb-2 flex items-center justify-between">
              <span>{t('seerr.apiKeyTitle', 'API Key')}</span>
              {selectedMethod === 'apikey' && (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
            </h2>
            <p className="text-sm text-white/60 mb-6 leading-relaxed">
              {t(
                'seerr.apiKeyDesc',
                'Authenticate using your Seerr API key found in Seerr Settings -> General.'
              )}
            </p>

            <div className="mt-auto space-y-3 pt-4 border-t border-white/10">
              <div className="relative flex items-center">
                <Key className="absolute left-3.5 w-4 h-4 text-white/60" />
                <input
                  type="password"
                  placeholder={t('connect.seerrApiKeyPlaceholder', 'Found in Seerr Settings -> General -> API Key')}
                  value={seerrApiKey}
                  onChange={(e) => {
                    onSelectMethod('apikey');
                    setSeerrApiKey(e.target.value);
                  }}
                  onFocus={() => onSelectMethod('apikey')}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none placeholder:text-white/60 focus:border-white/30 transition-all"
                />
              </div>

              {selectedMethod === 'apikey' && authError && (
                <p className="text-xs text-rose-400 flex items-center gap-1.5 pt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{authError}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            type="submit"
            disabled={!canSubmit || isAuthenticating}
            className={`group relative inline-flex items-center justify-center gap-3 px-10 py-4 rounded-full font-bold text-base transition-all duration-300 cursor-pointer ${
              canSubmit && !isAuthenticating
                ? 'bg-white text-black scale-100 hover:scale-105 active:scale-95'
                : 'bg-white/10 text-white/50 cursor-not-allowed scale-95 opacity-50'
            }`}
          >
            {isAuthenticating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-black" />
                <span>{t('connect.connecting', 'Connecting...')}</span>
              </>
            ) : (
              <>
                <span>{t('connect.finishSetup', 'Finish & Launch')}</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onSkip}
            className="px-6 py-4 rounded-full font-semibold text-sm text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200 cursor-pointer"
          >
            {t('connect.skipForNow', 'Skip for now')}
          </button>
        </div>
      </form>
    </motion.main>
  );
}
