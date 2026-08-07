'use client';

import { motion } from 'motion/react';
import { Globe, Loader2, CheckCircle2, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { slideVariants } from './server-step';
import { SeerrProxyToggle } from './seerr-proxy-toggle';
import { useTranslation } from '@/hooks/ui/use-translation';

interface SeerrServerStepProps {
  direction: number;
  seerrServerUrl: string;
  setSeerrServerUrl: (url: string) => void;
  seerrUseProxy: boolean;
  setSeerrUseProxy: (useProxy: boolean) => void;
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
  seerrUseProxy,
  setSeerrUseProxy,
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

  return (
    <motion.main
      key="step-3"
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
      className="w-full max-w-3xl flex flex-col items-center z-10"
    >
      {!hideBack && (
        <div className="w-full flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 text-white/70 hover:text-white text-sm font-medium transition-all cursor-pointer border border-white/10 backdrop-blur-xl"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('connect.backToAuth', 'Account Login')}</span>
          </button>
        </div>
      )}


      <div className="text-center max-w-2xl mb-8 space-y-3">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
          {t('seerr.serverStepTitle', 'Connect with Seerr')}
        </h1>

        <div className="flex items-center justify-center gap-2 text-sm text-white/60 font-normal max-w-lg mx-auto">
          <span>
            {t(
              'seerr.serverStepSubtitle',
              'Integrate your Seerr instance to search, request, and track movies & TV shows directly inside Jellyfish.'
            )}
          </span>
        </div>
      </div>

      <div className="w-full max-w-xl mb-10 space-y-4">
        <div className="relative flex flex-col sm:flex-row items-center gap-2 p-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl transition-all focus-within:border-white/30">
          <div className="flex items-center gap-3 px-3 py-2 w-full">
            <Globe className="w-5 h-5 text-white/60 shrink-0" />
            <input
              type="url"
              placeholder={t('connect.seerrUrlPlaceholder', 'http://localhost:5055')}
              value={seerrServerUrl}
              onChange={(e) => {
                setSeerrServerUrl(e.target.value);
                setSeerrVerified(false);
                setSeerrError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onCheckSeerrServer();
                }
              }}
              className="bg-transparent border-none outline-none text-white text-sm w-full placeholder:text-white/60"
            />
          </div>

          <button
            type="button"
            onClick={() => onCheckSeerrServer()}
            disabled={isTestingSeerr || !seerrServerUrl.trim()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 disabled:opacity-50 text-white font-medium text-sm transition-all duration-200 shrink-0 flex items-center justify-center gap-2 cursor-pointer border border-white/10"
          >
            {isTestingSeerr ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                <span>{t('connect.testing', 'Testing...')}</span>
              </>
            ) : seerrVerified ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{t('connect.verified', 'Verified')}</span>
              </>
            ) : (
              <span>{t('connect.checkServer', 'Check Server')}</span>
            )}
          </button>
        </div>

        <SeerrProxyToggle useProxy={seerrUseProxy} onToggle={setSeerrUseProxy} variant="glass" />

        {seerrVerified && seerrInfo && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 flex items-center gap-2 text-xs font-medium px-4"
          >
            <span>
              Connected to <strong className="text-white">{seerrInfo.appName || 'Seerr'}</strong> (v{seerrInfo.version || 'latest'})
            </span>
          </motion.div>
        )}

        {seerrError && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 flex items-center gap-2 text-xs text-rose-400 font-medium px-4"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{seerrError}</span>
          </motion.div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onContinue}
          disabled={!seerrVerified}
          className={`group relative inline-flex items-center justify-center gap-3 px-10 py-4 rounded-full font-bold text-base transition-all duration-300 cursor-pointer ${
            seerrVerified
              ? 'bg-white text-black scale-100 hover:scale-105 active:scale-95'
              : 'bg-white/10 text-white/50 cursor-not-allowed scale-95 opacity-50'
          }`}
        >
          <span>{t('connect.continue', 'Continue')}</span>
          <ArrowRight className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={onSkip}
          className="px-6 py-4 rounded-full font-semibold text-sm text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200 cursor-pointer"
        >
          {t('connect.skipForNow', 'Skip for now')}
        </button>
      </div>
    </motion.main>
  );
}
