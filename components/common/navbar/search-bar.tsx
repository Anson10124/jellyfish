'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  isMobile: boolean;
  searchOpen: boolean;
  setSearchOpen: React.Dispatch<React.SetStateAction<boolean>>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  searchRef: React.RefObject<HTMLDivElement | null>;
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
  handleKeyDown,
  setDropdownVisible,
  clearResults,
  t,
}: SearchBarProps) {
  return (
    <div ref={searchRef} className="relative flex items-center">
      {!isMobile ? (
        <motion.div
          initial={false}
          animate={{
            width: searchOpen ? 325 : 110,
            backgroundColor: searchOpen ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.05)',
            borderColor: searchOpen ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
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
          className="relative flex items-center h-9 rounded-full border px-3.5 overflow-hidden cursor-pointer shadow-sm group"
        >
          <Search className="w-4 h-4 text-neutral-300 shrink-0 transition-colors group-hover:text-white" />

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
                  placeholder={`${t('common.search', 'Search')}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => {
                    if (searchQuery.trim().length >= 2) setDropdownVisible(true);
                  }}
                  className="bg-transparent border-none outline-none text-white text-sm w-full placeholder:text-neutral-500"
                />
                <button
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
                  className="text-neutral-400 hover:text-white cursor-pointer ml-1 p-0.5 shrink-0"
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
                className="ml-2 text-sm font-medium text-neutral-300 group-hover:text-white hidden sm:inline select-none"
              >
                {t('nav.search', 'Search')}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      ) : (
        <button
          onClick={() => setSearchOpen((prev) => !prev)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-white/10 text-neutral-300 hover:text-white transition-all text-sm cursor-pointer"
        >
          <Search className="w-4 h-4" />
          <span className="hidden sm:inline font-medium">{t('nav.search', 'Search')}</span>
        </button>
      )}
    </div>
  );
}
