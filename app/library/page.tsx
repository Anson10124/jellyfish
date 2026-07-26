'use client';

import Link from 'next/link';
import { Cable } from 'lucide-react';
import { LibraryCarousel } from '@/components/media/carousels';
import { useTranslation } from '@/hooks/use-translation';
import { useServerConfig } from '@/hooks/use-server-config';

export default function LibraryPage() {
  const { t } = useTranslation();
  const { isConnected, isInitialized } = useServerConfig();

  return (
    <main className={`min-h-screen w-full pb-16 ${!isConnected && isInitialized ? 'flex items-center justify-center' : 'pt-28'}`}>
      <div className="w-full space-y-8">
        {!isInitialized ? null : !isConnected ? (
          <div className="w-full px-6 py-8 rounded-2xl text-center max-w-2xl mx-auto flex flex-col items-center justify-center space-y-6">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">
                {t('library.connectPromptTitle', 'Connect Your Jellyfin Server')}
              </h3>
              <p className="text-sm text-neutral-400 max-w-md">
                {t('library.connectPromptDesc', 'Connect your Jellyfin server to access your personal movies, TV shows, and music libraries directly.')}
              </p>
            </div>
            <Link
              href="/connect"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white text-black text-sm font-semibold hover:bg-neutral-200 transition-colors"
            >
              <span>{t('nav.connect', 'Connect Server')}</span>
            </Link>
          </div>
        ) : (
          <div className="w-full">
            <LibraryCarousel />
          </div>
        )}
      </div>
    </main>
  );
}

