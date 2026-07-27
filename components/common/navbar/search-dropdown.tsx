'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Film, Tv, Loader2 } from 'lucide-react';
import { SearchResult } from '@/hooks/media/use-search';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w92';

interface SearchDropdownProps {
  dropdownVisible: boolean;
  searchQuery: string;
  searchLoading: boolean;
  results: SearchResult[];
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  dropdownPos: { left?: number; width?: number };
  handleResultClick: (mediaType: string, id: number) => void;
  t: (key: string, fallback: string) => string;
}

export function SearchDropdown({
  dropdownVisible,
  searchQuery,
  searchLoading,
  results,
  dropdownRef,
  dropdownPos,
  handleResultClick,
  t,
}: SearchDropdownProps) {
  const showDropdown = dropdownVisible && searchQuery.trim().length >= 2;
  if (!showDropdown) return null;

  const getYear = (dateStr?: string) => {
    if (!dateStr) return '';
    return dateStr.split('-')[0];
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={dropdownRef}
        initial={{ opacity: 0, y: -8, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.97 }}
        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
        className="absolute top-full mt-2 w-[325px] max-h-[420px] overflow-y-auto rounded-2xl bg-[#121215]/65 backdrop-blur-2xl border border-white/10 shadow-2xl z-[100]"
        style={{
          left: dropdownPos.left !== undefined ? `${dropdownPos.left}px` : 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.1) transparent',
        }}
      >
        {searchLoading && results.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-8 text-neutral-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">{t('common.searching', 'Searching')}...</span>
          </div>
        ) : results.length > 0 ? (
          <div className="py-1.5">
            {results.map((item) => (
              <button
                key={`${item.media_type}-${item.id}`}
                onClick={() => handleResultClick(item.media_type, item.id)}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/8 transition-colors duration-150 cursor-pointer group"
              >
                {/* Poster */}
                <div className="relative w-10 h-[60px] rounded-lg overflow-hidden bg-white/5 shrink-0">
                  {item.poster_path ? (
                    <img
                      src={`${TMDB_IMAGE_BASE}${item.poster_path}`}
                      alt={item.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {item.media_type === 'movie' ? (
                        <Film className="w-4 h-4 text-neutral-600" />
                      ) : (
                        <Tv className="w-4 h-4 text-neutral-600" />
                      )}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-white truncate group-hover:text-white/90">
                    {item.title}
                  </p>
                  <p className="text-[12px] text-neutral-500 mt-0.5">
                    {getYear(item.release_date)}{getYear(item.release_date) && ' • '}{item.media_type === 'movie'
                      ? t('common.movie', 'Movie')
                      : t('common.tvShow', 'TV Show')}
                  </p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-neutral-500 text-sm">
            {t('common.noResults', 'No results found')}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
