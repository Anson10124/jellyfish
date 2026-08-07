'use client';

import { Router, Cable } from 'lucide-react';
import { useTranslation } from '@/hooks/ui/use-translation';

interface SeerrProxyToggleProps {
  useProxy: boolean;
  onToggle: (useProxy: boolean) => void;
  variant?: 'glass' | 'modal';
}

export function SeerrProxyToggle({
  useProxy,
  onToggle,
  variant = 'glass',
}: SeerrProxyToggleProps) {
  const { t } = useTranslation();

  const isModal = variant === 'modal';

  const containerBg = isModal
    ? 'bg-foreground/[0.05] border-border'
    : 'bg-white/5 border-white/10';

  const activeDirectClass = isModal
    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
    : 'bg-white/15 text-white border-white/20';

  const activeProxyClass = isModal
    ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
    : 'bg-white/15 text-white border-white/20';

  const inactiveClass = isModal
    ? 'text-foreground/50 hover:text-foreground/70 border-transparent'
    : 'text-white/50 hover:text-white/70 border-transparent';

  const labelClass = isModal
    ? 'text-foreground/80 font-semibold'
    : 'text-white/70 font-medium';

  const descClass = isModal ? 'text-foreground/40' : 'text-white/40';

  return (
    <div className={`p-3 rounded-2xl ${containerBg} backdrop-blur-xl space-y-2 border`}>
      <label className={`block text-xs ${labelClass}`}>
        {t('seerr.useProxy', 'Connection Mode')}
      </label>
      <div className={`flex items-center gap-1 p-1 rounded-xl ${containerBg} border`}>
        <button
          type="button"
          onClick={() => onToggle(false)}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
            !useProxy ? activeDirectClass : inactiveClass
          }`}
        >
          <Cable className="w-3.5 h-3.5" />
          <span>{t('seerr.directMode', 'Direct')}</span>
        </button>
        <button
          type="button"
          onClick={() => onToggle(true)}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
            useProxy ? activeProxyClass : inactiveClass
          }`}
        >
          <Router className="w-3.5 h-3.5" />
          <span>{t('seerr.proxyMode', 'Proxied')}</span>
        </button>
      </div>
      <p className={`text-[11px] ${descClass} px-0.5`}>
        {t(
          'seerr.useProxyDescription',
          'Route requests through the app server to avoid CORS issues. Disable for direct connection if your Seerr instance allows it.'
        )}
      </p>
    </div>
  );
}
