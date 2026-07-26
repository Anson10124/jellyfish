'use client';

import { LibraryCarousel } from '@/components/media/carousels';
import { useTranslation } from '@/hooks/use-translation';

export default function LibraryPage() {
  const { t } = useTranslation();

  return (
    <main className="min-h-screen w-full pt-28 pb-16">
      <div className="w-full space-y-8">
        <div className="w-full">
          <LibraryCarousel />
        </div>
      </div>
    </main>
  );
}
