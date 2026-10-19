'use client';

import { useId } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, CheckCircle2, Globe, Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks/ui/use-translation';
import { ConnectionProxyToggle } from './seerr-proxy-toggle';
import { ConnectionStatus } from './connection-status';
import { UrlPrefillOptions } from './url-prefill-options';

export const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 500 : -500, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -500 : 500, opacity: 0 }),
};

interface ConnectionServerStepProps {
  service: 'Jellyfin' | 'Seerr';
  title: string;
  subtitle: string;
  direction: number;
  serverUrl: string;
  onUrlChange: (url: string) => void;
  useProxy: boolean;
  onProxyChange: (value: boolean) => void;
  busy: boolean;
  verified: boolean;
  serverName?: string;
  version?: string;
  error: string | null;
  onCheck: () => void;
  onContinue: () => void;
  onBack?: () => void;
  backLabel?: string;
  onSkip?: () => void;
}

export function ConnectionServerStep({ service, title, subtitle, direction, serverUrl, onUrlChange,
  useProxy, onProxyChange, busy, verified, serverName, version, error, onCheck, onContinue,
  onBack, backLabel, onSkip }: ConnectionServerStepProps) {
  const { t } = useTranslation();
  const id = useId();
  const presets = service === 'Jellyfin'
    ? ['http://localhost:8096', 'https://jellyfin.example.com']
    : ['http://localhost:5055', 'https://seerr.example.com'];

  return (
    <motion.main custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit"
      transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
      className="z-10 flex w-full max-w-3xl flex-col items-center">
      {onBack && (
        <div className="mb-6 w-full max-w-xl">
          <button type="button" onClick={onBack} disabled={busy}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50">
            <ArrowLeft className="h-4 w-4" />{backLabel}
          </button>
        </div>
      )}
      <div className="mb-8 max-w-2xl space-y-4 text-center">
        <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">{title}</h1>
        <p className="mx-auto flex min-h-12 max-w-lg items-center justify-center text-sm leading-6 text-white/60">{subtitle}</p>
      </div>
      <form noValidate onSubmit={(event) => { event.preventDefault(); if (!busy && serverUrl.trim()) onCheck(); }}
        aria-busy={busy} className="mb-8 w-full max-w-xl rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
        <label htmlFor={`${id}-url`} className="mb-3 block text-xs font-medium text-white/70">
          {t('connect.serverAddress', 'Server address')}
        </label>
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-2 transition focus-within:border-white/30 sm:flex-row">
          <div className="flex w-full min-w-0 items-center gap-3 px-3 py-2">
            <Globe aria-hidden="true" className="h-5 w-5 shrink-0 text-white/60" />
            <input id={`${id}-url`} type="url" autoComplete="url" spellCheck={false} data-focusable="true"
              placeholder={presets[0]} value={serverUrl} disabled={busy}
              aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-status` : undefined}
              onChange={(event) => onUrlChange(event.target.value)}
              className="w-full min-w-0 border-none bg-transparent text-sm text-white outline-none placeholder:text-white/60 disabled:opacity-60" />
          </div>
          <button type="submit" data-focusable="true" disabled={busy || !serverUrl.trim()}
            className="flex w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/10 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : verified ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : null}
            {busy ? t('connect.testing', 'Testing...') : verified ? t('connect.verified', 'Verified') : t('connect.checkServer', 'Check Server')}
          </button>
        </div>
        <UrlPrefillOptions urls={presets} value={serverUrl} onSelect={onUrlChange} disabled={busy}
          label={t('connect.suggestedAddresses', 'Suggested server addresses')} />
        <div className="mt-6 border-t border-white/10 pt-6">
          <ConnectionProxyToggle service={service} useProxy={useProxy} onToggle={onProxyChange} disabled={busy} variant="embedded" />
        </div>
        {(error || verified) && (
          <div className="mt-6">
            <ConnectionStatus id={`${id}-status`} variant={error ? 'error' : 'success'}>
              {error || <>{t('connect.connectedTo', 'Connected to')} <strong>{serverName || service}</strong>{version ? ` (v${version})` : ''}</>}
            </ConnectionStatus>
          </div>
        )}
      </form>
      <div className="flex w-full max-w-xl flex-col items-center gap-3">
        <button type="button" onClick={onContinue} disabled={!verified || busy} data-focusable="true"
          className="inline-flex items-center justify-center gap-3 rounded-full bg-white px-10 py-4 text-base font-bold text-black transition hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40 disabled:hover:scale-100">
          {t('connect.continue', 'Continue')}<ArrowRight className="h-5 w-5" />
        </button>
        {onSkip && <button type="button" onClick={onSkip} disabled={busy}
          className="rounded-full px-6 py-3 text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50">
          {t('connect.skipForNow', 'Skip for now')}
        </button>}
      </div>
    </motion.main>
  );
}
