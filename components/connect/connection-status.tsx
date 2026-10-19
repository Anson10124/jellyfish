'use client';

import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export function ConnectionStatus({ children, variant = 'error', id }: {
  children: ReactNode;
  variant?: 'error' | 'success';
  id?: string;
}) {
  const Icon = variant === 'error' ? AlertCircle : CheckCircle2;
  return (
    <div
      id={id}
      role={variant === 'error' ? 'alert' : 'status'}
      className={`flex w-full min-w-0 items-start gap-3 rounded-xl border p-4 text-sm leading-6 ${
        variant === 'error' ? 'border-rose-400/20 bg-rose-400/5 text-rose-300' : 'border-emerald-400/20 bg-emerald-400/5 text-emerald-300'
      }`}
    >
      <Icon aria-hidden="true" className="mt-1 h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1 whitespace-pre-wrap [overflow-wrap:anywhere]">{children}</div>
    </div>
  );
}
