'use client';

import { Router, Cable } from 'lucide-react';
import { useTranslation } from '@/hooks/ui/use-translation';

interface ConnectionProxyToggleProps {
  service?: 'Seerr' | 'Jellyfin';
  disabled?: boolean;
  useProxy: boolean;
  onToggle: (useProxy: boolean) => void;
  variant?: 'glass' | 'modal' | 'embedded';
}

export function ConnectionProxyToggle({
  service = 'Seerr',
  disabled = false,
  useProxy,
  onToggle,
  variant = 'glass',
}: ConnectionProxyToggleProps) {
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

  const descClass = isModal ? 'text-foreground/60' : 'text-white/60';

  return (
    <div className={variant === 'embedded' ? 'space-y-3' : `p-4 rounded-2xl ${containerBg} backdrop-blur-xl space-y-3 border`}>
      <p className={`text-xs ${labelClass}`}>
        {t('connect.connectionMode', 'Connection mode')}
      </p>
      <div role="group" aria-label={t('connect.connectionMode', 'Connection mode')} className={`flex items-center gap-1 p-1 rounded-xl ${containerBg} border`}>
        <button
          type="button"
          disabled={disabled}
          aria-pressed={!useProxy}
          onClick={() => onToggle(false)}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer border disabled:cursor-wait focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
            !useProxy ? activeDirectClass : inactiveClass
          }`}
        >
          <Cable className="w-3.5 h-3.5" />
          <span>{t('seerr.directMode', 'Direct')}</span>
        </button>
        <button
          type="button"
          disabled={disabled}
          aria-pressed={useProxy}
          onClick={() => onToggle(true)}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer border disabled:cursor-wait focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
            useProxy ? activeProxyClass : inactiveClass
          }`}
        >
          <Router className="w-3.5 h-3.5" />
          <span>{t('seerr.proxyMode', 'Proxied')}</span>
        </button>
      </div>
      <p className={`text-xs leading-5 ${descClass}`}>
        {t(
          `${service.toLowerCase()}.useProxyDescription`,
          `Use Proxied if your ${service} server’s CORS settings block a direct connection. Your ${service} server handles sign-in.`
        )}
      </p>
    </div>
  );
}

export const SeerrProxyToggle = ConnectionProxyToggle;
