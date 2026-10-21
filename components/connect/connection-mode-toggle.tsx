'use client';

import { Router, Cable, Cpu } from 'lucide-react';
import { useTranslation } from '@/hooks/ui/use-translation';
import type { ConnectionMode } from '@/lib/api/connection-mode';

interface ConnectionModeToggleProps {
  service?: 'Seerr' | 'Jellyfin';
  disabled?: boolean;
  mode: ConnectionMode;
  onChange: (mode: ConnectionMode) => void;
  variant?: 'glass' | 'modal' | 'embedded';
}

export function ConnectionModeToggle({
  service = 'Seerr',
  disabled = false,
  mode,
  onChange,
  variant = 'glass',
}: ConnectionModeToggleProps) {
  const { t } = useTranslation();

  const isModal = variant === 'modal';

  const containerBg = isModal
    ? 'bg-foreground/[0.05] border-border'
    : 'bg-white/5 border-white/10';

  const activeClasses: Record<ConnectionMode, string> = isModal
    ? {
      auto: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
      direct: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      proxy: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    }
    : {
      auto: 'bg-white/15 text-white border-white/20',
      direct: 'bg-white/15 text-white border-white/20',
      proxy: 'bg-white/15 text-white border-white/20',
    };

  const inactiveClass = isModal
    ? 'text-foreground/50 hover:text-foreground/70 border-transparent'
    : 'text-white/50 hover:text-white/70 border-transparent';

  const labelClass = isModal
    ? 'text-foreground/80 font-semibold'
    : 'text-white/70 font-medium';

  const descClass = isModal ? 'text-foreground/60' : 'text-white/60';

  const options = [
    { value: 'auto' as const, icon: Cpu, label: t('connect.autoMode', 'Auto') },
    { value: 'direct' as const, icon: Cable, label: t('seerr.directMode', 'Direct') },
    { value: 'proxy' as const, icon: Router, label: t('seerr.proxyMode', 'Proxied') },
  ];

  const descriptions: Record<ConnectionMode, string> = {
    auto: service === 'Seerr'
      ? t('seerr.autoModeDescription', 'Jellyfish tries the proxy first and connects directly if the proxy cannot reach your Seerr server.')
      : t('jellyfin.autoModeDescription', 'Jellyfish connects directly and switches to the proxy if your browser blocks the connection.'),
    direct: t(`${service.toLowerCase()}.directModeDescription`,
      `Your browser connects to ${service} itself. The server must allow this site through CORS and use HTTPS when this page does.`),
    proxy: t(`${service.toLowerCase()}.useProxyDescription`,
      `Use Proxied if your ${service} server’s CORS settings block a direct connection. Your ${service} server handles sign-in.`),
  };

  return (
    <div className={variant === 'embedded' ? 'space-y-3' : `p-4 rounded-2xl ${containerBg} backdrop-blur-xl space-y-3 border`}>
      <p className={`text-xs ${labelClass}`}>
        {t('connect.connectionMode', 'Connection mode')}
      </p>
      <div role="group" aria-label={t('connect.connectionMode', 'Connection mode')} className={`flex items-center gap-1 p-1 rounded-xl ${containerBg} border`}>
        {options.map(({ value, icon: Icon, label }) => (
          <button
            key={value}
            type="button"
            disabled={disabled}
            aria-pressed={mode === value}
            onClick={() => onChange(value)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer border disabled:cursor-wait focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
              mode === value ? activeClasses[value] : inactiveClass
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{label}</span>
          </button>
        ))}
      </div>
      <p className={`text-xs leading-5 ${descClass}`}>{descriptions[mode]}</p>
    </div>
  );
}
