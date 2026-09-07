'use client';

import React from 'react';
import { Search, X, Film, Tv, Loader2 } from 'lucide-react';
import { SearchResult } from '@/hooks/media/use-search';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w92';

interface MobileNavProps {
  isMobile: boolean;
  searchOpen: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchLoading: boolean;
  results: SearchResult[];
  mobileSearchRef: React.RefObject<HTMLDivElement | null>;
  mobileInputRef: React.RefObject<HTMLInputElement | null>;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleResultClick: (mediaType: string, id: number) => void;
  setDropdownVisible: (visible: boolean) => void;
  clearResults: () => void;
  t: (key: string, fallback: string) => string;
}

export function MobileNav({
  isMobile,
  searchOpen,
  searchQuery,
  setSearchQuery,
  searchLoading,
  results,
  mobileSearchRef,
  mobileInputRef,
  handleKeyDown,
  handleResultClick,
  setDropdownVisible,
  clearResults,
  t,
}: MobileNavProps) {
  const getYear = (dateStr?: string) => {
    if (!dateStr) return '';
    return dateStr.split('-')[0];
  };

  return (
    <>
      {isMobile && searchOpen && (
        <div
          ref={mobileSearchRef}
          className="mt-3 w-full rounded-2xl bg-background/65 backdrop-blur-2xl border border-border p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center gap-3 bg-foreground/5 border border-border rounded-xl px-3 py-2">
            <Search className="w-4 h-4 text-foreground/50" />
            <input
              ref={mobileInputRef}
              type="text"
              placeholder={`${t('common.search', 'Search')} movies, shows...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              className="bg-transparent border-none outline-none text-foreground text-sm w-full placeholder:text-foreground/40"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  clearResults();
                  setDropdownVisible(false);
                }}
                className="text-foreground/50 hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Mobile search results */}
          {searchQuery.trim().length >= 2 && (
            <div
              className="mt-3 max-h-[300px] overflow-y-auto"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'var(--border) transparent',
              }}
            >
              {searchLoading && results.length === 0 ? (
                <div className="flex items-center justify-center gap-2 py-6 text-foreground/50">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">{t('common.searching', 'Searching')}...</span>
                </div>
              ) : results.length > 0 ? (
                <div className="flex flex-col gap-0.5">
                  {results.map((item) => (
                    <button
                      key={`${item.media_type}-${item.id}`}
                      onClick={() => handleResultClick(item.media_type, item.id)}
                      className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-foreground/8 transition-colors duration-150 cursor-pointer group"
                    >
                      <div className="relative w-9 h-[54px] rounded-lg overflow-hidden bg-foreground/5 shrink-0">
                        {item.poster_path ? (
                          <img
                            src={`${TMDB_IMAGE_BASE}${item.poster_path}`}
                            alt={item.title}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            {item.media_type === 'movie' ? (
                              <Film className="w-3.5 h-3.5 text-foreground/30" />
                            ) : (
                              <Tv className="w-3.5 h-3.5 text-foreground/30" />
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                        <p className="text-[12px] text-foreground/50 mt-0.5">
                          {getYear(item.release_date)}
                          {getYear(item.release_date) && ' • '}
                          {item.media_type === 'movie'
                            ? t('common.movie', 'Movie')
                            : t('common.tvShow', 'TV Show')}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-foreground/40 text-sm">
                  {t('common.noResults', 'No results found')}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
