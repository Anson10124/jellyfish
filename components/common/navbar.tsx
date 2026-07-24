'use client';

import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  Home,
  Film,
  Tv,
  Bookmark,
  Search,
  X,
  Menu,
} from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { useIsMobile } from '@/hooks/device/use-mobile';
import { useIsIOS } from '@/hooks/device/use-ios';
import { CSS_SPRING_EASING } from '@/constants';
import ProgressiveBlur from '@/components/ProgressiveBlur';
import { LanguageSelector } from './language-selector';

export function Navbar() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const isIOS = useIsIOS();

  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [activePath, setActivePath] = useState(pathname);

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
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        if (!searchQuery) {
          setSearchOpen(false);
        }
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

  return (
    <>
      {!isIOS && <ProgressiveBlur position="top" height="6rem" fade/>}

      <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-4xl transition-all duration-300">
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
                  className={`relative z-10 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${isActive
                    ? 'text-white font-semibold'
                    : 'text-neutral-300 hover:text-white'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
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
                    width: searchOpen ? 250 : 110,
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
                  className="relative flex items-center h-9 rounded-full border px-3.5 overflow-hidden cursor-pointer backdrop-blur-md shadow-sm group"
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
                          className="bg-transparent border-none outline-none text-white text-sm w-full placeholder:text-neutral-500"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (searchQuery) {
                              setSearchQuery('');
                            } else {
                              setSearchOpen(false);
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
              className={`relative z-10 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 text-neutral-300 hover:text-white`}
            >
              <span>Connect</span>
            </button>
          </div>
        </nav>

        {isMobile && searchOpen && (
          <div className="mt-3 w-full rounded-2xl bg-[#121215]/85 backdrop-blur-2xl border border-white/15 p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
              <Search className="w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder={`${t('common.search', 'Search')} movies, shows...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="bg-transparent border-none outline-none text-white text-sm w-full placeholder:text-neutral-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-neutral-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
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
