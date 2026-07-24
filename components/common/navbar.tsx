'use client';

import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import Link from 'next/link';

import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  Home,
  Film,
  Tv,
  Bookmark,
  Search,
  X,
  Menu,
  Cable,

  Loader2,
} from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { useIsMobile } from '@/hooks/device/use-mobile';
import { useIsIOS } from '@/hooks/device/use-ios';
import { useSearch } from '@/hooks/use-search';
import { CSS_SPRING_EASING } from '@/constants';
import ProgressiveBlur from '@/components/ProgressiveBlur';
import { LanguageSelector } from './language-selector';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w92';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const isIOS = useIsIOS();

  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  const { results, loading: searchLoading, clearResults } = useSearch(searchQuery);

  const [activePath, setActivePath] = useState(pathname);
  const [dropdownPos, setDropdownPos] = useState<{ left?: number; width?: number }>({});

  const updateDropdownPos = () => {
    if (searchRef.current && headerRef.current) {
      const searchRect = searchRef.current.getBoundingClientRect();
      const headerRect = headerRef.current.getBoundingClientRect();
      setDropdownPos({
        left: searchRect.left - headerRect.left,
        width: searchRect.width,
      });
    }
  };

  useLayoutEffect(() => {
    updateDropdownPos();
  }, [searchOpen, searchQuery, results]);

  useEffect(() => {
    if (!searchRef.current) return;
    const observer = new ResizeObserver(() => {
      updateDropdownPos();
    });
    observer.observe(searchRef.current);
    if (headerRef.current) observer.observe(headerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setActivePath(pathname);
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const isSearchClick = searchRef.current?.contains(target);
      const isDropdownClick = dropdownRef.current?.contains(target);
      const isMobileSearchClick = mobileSearchRef.current?.contains(target);

      if (!isSearchClick && !isDropdownClick && !isMobileSearchClick) {
        if (!searchQuery) {
          setSearchOpen(false);
        }
        setDropdownVisible(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [searchQuery]);

  useEffect(() => {
    if (searchOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [searchOpen]);

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      setDropdownVisible(true);
    } else {
      setDropdownVisible(false);
    }
  }, [searchQuery, results]);

  const handleResultClick = (mediaType: string, id: number) => {
    const path = `/${mediaType}/${id}`;
    router.push(path);
    setSearchQuery('');
    setSearchOpen(false);
    setDropdownVisible(false);
    clearResults();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setSearchQuery('');
      setSearchOpen(false);
      setDropdownVisible(false);
      clearResults();
    }
  };

  const navItems = [
    { href: '/', label: t('nav.home', 'Home'), icon: Home },
    { href: '/movie', label: t('nav.movies', 'Movies'), icon: Film },
    { href: '/tv', label: t('nav.shows', 'Shows'), icon: Tv },
    { href: '/library', label: t('nav.library', 'Library'), icon: Bookmark },
  ];

  const activeIndex = navItems.findIndex((item) =>
    item.href === '/' ? activePath === '/' : activePath?.startsWith(item.href)
  );

  const tabRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0, ready: false });

  const updatePill = () => {
    const targetIdx = activeIndex !== -1 ? activeIndex : 0;
    const currentTab = tabRefs.current[targetIdx];
    if (currentTab) {
      setPillStyle({
        left: currentTab.offsetLeft,
        width: currentTab.offsetWidth,
        ready: true,
      });
    }
  };

  useLayoutEffect(() => {
    updatePill();
  }, [activeIndex]);

  useEffect(() => {
    window.addEventListener('resize', updatePill);
    return () => window.removeEventListener('resize', updatePill);
  }, [activeIndex]);

  const getYear = (dateStr?: string) => {
    if (!dateStr) return '';
    return dateStr.split('-')[0];
  };

  const SearchDropdown = () => {
    const showDropdown = dropdownVisible && searchQuery.trim().length >= 2;
    if (!showDropdown) return null;

    return (
      <AnimatePresence>
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, y: -8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          className="absolute top-full mt-2 w-[325px] max-h-[420px] overflow-y-auto rounded-2xl bg-[#121215]/80 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-black/50 z-[100]"
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
              {results.map((item, index) => (
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
  };

  return (
    <>
      {!isIOS && <ProgressiveBlur position="top" height="6rem" fade/>}

      <header ref={headerRef} className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-4xl transition-all duration-300">
        <nav className="relative flex items-center justify-between rounded-full bg-[#121215]/65 backdrop-blur-2xl border border-white/10 px-3 py-2 shadow-2xl text-neutral-200">
          <div className="hidden md:flex items-center gap-1 relative">
            {pillStyle.ready && (
              <div
                className="absolute top-0 bottom-0 my-auto h-full bg-white/15 rounded-full shadow-md z-0 pointer-events-none"
                style={{
                  transform: `translateX(${pillStyle.left}px)`,
                  width: `${pillStyle.width}px`,
                  transitionProperty: 'transform, width',
                  transitionDuration: '500ms',
                  transitionTimingFunction: CSS_SPRING_EASING,
                }}
              />
            )}

            {navItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = (activeIndex === -1 && index === 0) || activeIndex === index;

              return (
                <Link
                  key={item.href}
                  ref={(el) => {
                    tabRefs.current[index] = el;
                  }}
                  href={item.href}
                  onClick={() => setActivePath(item.href)}
                  className={`relative z-10 flex items-center justify-center gap-2 px-3 py-2 lg:px-4 rounded-full text-sm font-medium transition-colors duration-200 ${isActive
                    ? 'text-white font-semibold'
                    : 'text-neutral-300 hover:text-white'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden lg:inline">{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="p-2 rounded-full hover:bg-white/10 text-neutral-200 transition-colors cursor-pointer"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <span className="text-sm font-semibold text-white px-2">
              {navItems[activeIndex !== -1 ? activeIndex : 0]?.label || 'Home'}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
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
            <button
              className={`relative z-10 flex items-center justify-center gap-2 px-3 py-2 lg:px-4 rounded-full text-sm font-medium transition-colors duration-200 text-neutral-300 hover:text-white`}
            >
              <Cable className="w-4 h-4" />
              <span className="hidden lg:inline">Connect</span>
            </button>
          </div>
        </nav>

        {/* Desktop search dropdown */}
        {!isMobile && <SearchDropdown />}

        {isMobile && searchOpen && (
          <div ref={mobileSearchRef} className="mt-3 w-full rounded-2xl bg-[#121215]/85 backdrop-blur-2xl border border-white/15 p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
              <Search className="w-4 h-4 text-neutral-400" />
              <input
                ref={mobileInputRef}
                type="text"
                placeholder={`${t('common.search', 'Search')} movies, shows...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                className="bg-transparent border-none outline-none text-white text-sm w-full placeholder:text-neutral-500"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    clearResults();
                    setDropdownVisible(false);
                  }}
                  className="text-neutral-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Mobile search results */}
            {searchQuery.trim().length >= 2 && (
              <div className="mt-3 max-h-[300px] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
                {searchLoading && results.length === 0 ? (
                  <div className="flex items-center justify-center gap-2 py-6 text-neutral-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">{t('common.searching', 'Searching')}...</span>
                  </div>
                ) : results.length > 0 ? (
                  <div className="flex flex-col gap-0.5">
                    {results.map((item) => (
                      <button
                        key={`${item.media_type}-${item.id}`}
                        onClick={() => handleResultClick(item.media_type, item.id)}
                        className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/8 transition-colors duration-150 cursor-pointer group"
                      >
                        <div className="relative w-9 h-[54px] rounded-lg overflow-hidden bg-white/5 shrink-0">
                          {item.poster_path ? (
                            <img
                              src={`${TMDB_IMAGE_BASE}${item.poster_path}`}
                              alt={item.title}
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              {item.media_type === 'movie' ? (
                                <Film className="w-3.5 h-3.5 text-neutral-600" />
                              ) : (
                                <Tv className="w-3.5 h-3.5 text-neutral-600" />
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-sm font-medium text-white truncate">
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
                  <div className="py-6 text-center text-neutral-500 text-sm">
                    {t('common.noResults', 'No results found')}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {mobileMenuOpen && (
          <div className="md:hidden mt-3 rounded-2xl bg-[#121215]/85 backdrop-blur-2xl border border-white/15 p-3 shadow-2xl flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-150">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = (activeIndex === -1 && index === 0) || activeIndex === index;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    setActivePath(item.href);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                    ? 'bg-white/15 text-white font-semibold'
                    : 'text-neutral-300 hover:text-white hover:bg-white/10'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </header>
    </>
  );
}
