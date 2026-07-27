'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Globe, Loader2, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { ServerInfo } from '@/hooks/connect/use-connect-flow';
import { useTranslation } from '@/hooks/ui/use-translation';

export const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 500 : -500,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -500 : 500,
    opacity: 0,
  }),
};

interface ServerStepProps {
  direction: number;
  serverUrl: string;
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

  return (
    <motion.main
      key="step-1"
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
      className="w-full max-w-3xl flex flex-col items-center z-10"
    >
      <div className="text-center max-w-2xl mb-8 space-y-3">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
          {t('connect.title', 'Connect with your Jellyfin server to get started')}
        </h1>

        <div className="flex items-center justify-center gap-2 text-sm text-white/60 font-normal max-w-lg mx-auto">
          <span>
            {t('connect.subtitle', 'Jellyfish runs in your browser. Your server address and credentials stay safely on your local device.')}
          </span>
        </div>
      </div>

      <div className="w-full max-w-xl mb-10">
        <div className="relative flex flex-col sm:flex-row items-center gap-2 p-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl transition-all focus-within:border-white/30">
          <div className="flex items-center gap-3 px-3 py-2 w-full">
            <Globe className="w-5 h-5 text-white/60 shrink-0" />
            <input
              type="url"
              placeholder={t('connect.serverUrlPlaceholder', 'http://localhost:8096')}
              value={serverUrl}
              onChange={(e) => {
                setServerUrl(e.target.value);
                setServerVerified(false);
                setVerifyError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onCheckServer();
                }
              }}
              className="bg-transparent border-none outline-none text-white text-sm w-full placeholder:text-white/60"
            />
          </div>

          <button
            type="button"
            onClick={() => onCheckServer()}
            disabled={isVerifying || !serverUrl.trim()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 disabled:opacity-50 text-white font-medium text-sm transition-all duration-200 shrink-0 flex items-center justify-center gap-2 cursor-pointer border border-white/10"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                <span>{t('connect.testing', 'Testing...')}</span>
              </>
            ) : serverVerified ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{t('connect.verified', 'Verified')}</span>
              </>
            ) : (
              <span>{t('connect.checkServer', 'Check Server')}</span>
            )}
          </button>
        </div>

        {serverVerified && serverInfo && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 flex items-center gap-2 text-xs font-medium px-4"
          >
            <span>
              {t('connect.connectedTo', 'Connected to')}{' '}
              <strong className="text-white">{serverInfo.name}</strong> (v{serverInfo.version})
            </span>
          </motion.div>
        )}

        {verifyError && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 flex items-center gap-2 text-xs text-rose-400 font-medium px-4"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{verifyError}</span>
          </motion.div>
        )}
      </div>

      <button
        type="button"
        onClick={onContinue}
        disabled={!serverVerified}
        className={`group relative inline-flex items-center justify-center gap-3 px-10 py-4 rounded-full font-bold text-base transition-all duration-300 cursor-pointer ${
          serverVerified
            ? 'bg-white text-black scale-100 hover:scale-105 active:scale-95'
            : 'bg-white/10 text-white/50 cursor-not-allowed scale-95 opacity-50'
        }`}
      >
        <span>{t('connect.continue', 'Continue')}</span>
        <ArrowRight className="w-5 h-5" />
      </button>
    </motion.main>
  );
}
