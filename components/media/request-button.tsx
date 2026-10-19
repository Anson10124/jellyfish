'use client';

import type { ComponentProps } from 'react';
import { CloudDownload, Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks/ui/use-translation';
import { cn } from '@/lib/utils';

interface RequestButtonProps extends ComponentProps<'button'> {
  isRequesting?: boolean;
}

export function RequestButton({ children, className, disabled, isRequesting = false, ...props }: RequestButtonProps) {
  const { t } = useTranslation();
  const Icon = isRequesting ? Loader2 : CloudDownload;

  return (
    <button
      type="button"
      data-focusable="true"
      tabIndex={0}
      disabled={disabled || isRequesting}
      aria-busy={isRequesting}
      className={cn(
        'inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-4 text-[13px] font-semibold shadow-none transition hover:bg-primary/90 active:scale-[0.98] text-primary-foreground cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:scale-[1.04] focus-visible:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
        className,
      )}
      {...props}
    >
      <Icon aria-hidden="true" className={cn('h-4 w-4 shrink-0', isRequesting && 'animate-spin')} />
      {children ?? t('common.request', 'Request')}
    </button>
  );
}
