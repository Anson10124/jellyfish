'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, EyeOff } from 'lucide-react';
import { useTranslation } from '@/hooks/ui/use-translation';

interface NsfwWarningProps {
  onContinue: () => void;
}

export function NsfwWarning({ onContinue }: NsfwWarningProps) {
  const { t } = useTranslation();
  const router = useRouter();

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-[70vh] px-4 pt-20 text-center bg-background text-foreground">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 text-destructive mb-4">
        <EyeOff className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">
        {t('nsfw.title', 'Adult content')}
      </h1>
      <p className="text-sm text-muted-foreground max-w-md mb-6">
        {t(
          'nsfw.description',
          'This title is marked as adult (NSFW) content. You can enable NSFW content in Settings to stop seeing this warning.'
        )}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          data-focusable="true"
          onClick={handleBack}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition shadow-sm cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('nsfw.goBack', 'Go back')}
        </button>
        <button
          type="button"
          data-focusable="true"
          onClick={onContinue}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-foreground/10 hover:bg-foreground/20 text-foreground font-semibold text-sm transition cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-foreground"
        >
          {t('nsfw.continue', 'Continue anyway')}
        </button>
      </div>
    </main>
  );
}
