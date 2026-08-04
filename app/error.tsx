'use client';

import { useEffect } from 'react';
import { toast } from '@/components/ui/toast';
import { useTranslation } from '@/hooks/ui/use-translation';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation();

  useEffect(() => {
    console.error('Unhandled app error:', error);
    toast.error(
      t('errors.somethingWentWrong', 'Something went wrong'),
      error.message || t('errors.unhandledError', 'An unexpected error occurred.')
    );
  }, [error, t]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 text-destructive mb-4">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">
        {t('errors.somethingWentWrong', 'Something went wrong')}
      </h1>
      <p className="text-sm text-muted-foreground max-w-md mb-6">
        {error.message || t('errors.unhandledError', 'An unexpected error occurred. Please try again or refresh the page.')}
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition shadow-sm cursor-pointer"
      >
        <RefreshCw className="w-4 h-4" />
        {t('errors.tryAgain', 'Try Again')}
      </button>
    </div>
  );
}
