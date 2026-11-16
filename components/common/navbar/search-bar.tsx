'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X } from 'lucide-react';

const SEARCH_CLOSED_WIDTH = 110;
const SEARCH_OPEN_MAX_WIDTH = 325;

interface SearchBarProps {
  isMobile: boolean;
  searchOpen: boolean;
  setSearchOpen: React.Dispatch<React.SetStateAction<boolean>>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  searchRef: React.RefObject<HTMLDivElement | null>;
  /** Room the navbar has for the expanded search bar, so it never pushes the other items out */
  availableWidth: number;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  setDropdownVisible: (visible: boolean) => void;
  clearResults: () => void;
  t: (key: string, fallback: string) => string;
}

export function SearchBar({
  isMobile,
  searchOpen,
  setSearchOpen,
  searchQuery,
  setSearchQuery,
  inputRef,
  searchRef,
  availableWidth,
  handleKeyDown,
  setDropdownVisible,
  clearResults,
  t,
}: SearchBarProps) {
  const openWidth = Math.max(SEARCH_CLOSED_WIDTH, Math.min(SEARCH_OPEN_MAX_WIDTH, availableWidth));

  return (
    <div ref={searchRef} className="relative flex items-center">
      {!isMobile ? (
        <motion.div
          initial={false}
          animate={{
            width: searchOpen ? openWidth : SEARCH_CLOSED_WIDTH,
          }}
          transition={{
            type: 'spring',
            stiffness: 380,
            damping: 30,
            mass: 0.8,
          }}
          onClick={() => {
            if (!searchOpen) setSearchOpen(true);
          }}
          onKeyDown={(e) => {
            if (!searchOpen && e.key === 'Enter') {
              e.preventDefault();
              setSearchOpen(true);
            }
          }}
          tabIndex={searchOpen ? -1 : 0}
          data-focusable={!searchOpen ? 'true' : undefined}
          className={`relative flex items-center h-9 rounded-full border px-3.5 overflow-hidden cursor-pointer shadow-sm group transition-[background-color,border-color] duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:bg-foreground/20 ${
            searchOpen ? 'bg-foreground/12 border-foreground/20' : 'bg-foreground/5 border-foreground/10'
          }`}
        >
          <Search className="w-4 h-4 text-foreground/80 shrink-0 transition-colors group-hover:text-foreground" />

          <AnimatePresence mode="wait">
            {searchOpen ? (
              <motion.div
                key="input-container"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="flex items-center w-full ml-2"
              >
                <input
                  ref={inputRef}
                  type="text"
                  autoFocus
                  data-focusable="true"
                  placeholder={`${t('common.search', 'Search')}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => {
                    if (searchQuery.trim().length >= 2) setDropdownVisible(true);
                  }}
                  className="bg-transparent border-none outline-none text-foreground text-sm w-full placeholder:text-foreground/40"
                />
                <button
                  data-search-clear="true"
                  data-focusable="true"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (searchQuery) {
                      setSearchQuery('');
                      clearResults();
                      setDropdownVisible(false);
                    } else {
                      setSearchOpen(false);
                      setDropdownVisible(false);
                    }
                  }}
                  className="text-foreground/50 hover:text-foreground cursor-pointer ml-1 p-0.5 shrink-0 focus:outline-none focus-visible:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ) : (
              <motion.span
                key="search-label"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="ml-2 text-sm font-medium text-foreground/80 group-hover:text-foreground hidden sm:inline select-none"
              >
                {t('nav.search', 'Search')}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      ) : (
        <button
          onClick={() => setSearchOpen((prev) => !prev)}
          data-focusable="true"
          tabIndex={0}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-foreground/10 text-foreground/80 hover:text-foreground transition-all text-sm cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
        >
          <Search className="w-4 h-4" />
          <span className="hidden sm:inline font-medium">{t('nav.search', 'Search')}</span>
        </button>
      )}
    </div>
  );
}
