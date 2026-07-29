'use client';

import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Film, Tv, Bookmark, Menu, X, ChevronDown, Cable, WifiOff } from 'lucide-react';
import { useTranslation } from '@/hooks/ui/use-translation';
import { useIsMobile } from '@/hooks/device/use-mobile';
import { useIsIOS } from '@/hooks/device/use-ios';
import { useSearch } from '@/hooks/media/use-search';
import { useServerContext } from '@/context/server-context';
import { ProgressiveBlur } from '@/components/ui/progressive-blur';

import { UserAvatar } from './user-avatar';
import { NavItems } from './nav-items';
import { SearchBar } from './search-bar';
import { SearchDropdown } from './search-dropdown';
import { UserDropdownMenu } from './user-dropdown-menu';
import { MobileNav } from './mobile-nav';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const isIOS = useIsIOS();
  const { jellyfinConfig, isInitialized, connectionState } = useServerContext();
  const isOffline = isInitialized && connectionState.status === 'offline';

  const isConnected = isInitialized && Boolean(jellyfinConfig?.username);

  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  const { results, loading: searchLoading, clearResults } = useSearch(searchQuery);

  const [activePath, setActivePath] = useState(pathname);
  const [dropdownPos, setDropdownPos] = useState<{ left?: number; width?: number }>({});
  const [userDropdownPos, setUserDropdownPos] = useState<{ right?: number }>({});

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

  const updateUserDropdownPos = () => {
    if (userDropdownRef.current && headerRef.current) {
      const userRect = userDropdownRef.current.getBoundingClientRect();
      const headerRect = headerRef.current.getBoundingClientRect();
      setUserDropdownPos({
        right: headerRect.right - userRect.right,
      });
    }
  };

  useLayoutEffect(() => {
    updateDropdownPos();
  }, [searchOpen, searchQuery, results]);

  useLayoutEffect(() => {
    updateUserDropdownPos();
  }, [userDropdownOpen]);

  useEffect(() => {
    if (!searchRef.current) return;
    const observer = new ResizeObserver(() => {
      updateDropdownPos();
      updateUserDropdownPos();
    });
    observer.observe(searchRef.current);
    if (userDropdownRef.current) observer.observe(userDropdownRef.current);
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
    setUserDropdownOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const isSearchClick = searchRef.current?.contains(target);
      const isDropdownClick = dropdownRef.current?.contains(target);
      const isMobileSearchClick = mobileSearchRef.current?.contains(target);
      const isUserDropdownClick = userDropdownRef.current?.contains(target);
      const isUserMenuClick = userMenuRef.current?.contains(target);

      if (!isSearchClick && !isDropdownClick && !isMobileSearchClick) {
        if (!searchQuery) {
          setSearchOpen(false);
        }
        setDropdownVisible(false);
      }

      if (!isUserDropdownClick && !isUserMenuClick) {
        setUserDropdownOpen(false);
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
    if (activeIndex === -1) {
      setPillStyle((prev) => ({ ...prev, ready: false }));
      return;
    }
    const currentTab = tabRefs.current[activeIndex];
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
      {!isIOS && <ProgressiveBlur position="top" height="6rem" fade />}

      <header ref={headerRef} className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-4xl transition-all duration-300">
        <nav className="relative flex items-center justify-between rounded-full bg-background/65 backdrop-blur-2xl border border-border px-3 py-2 shadow-2xl text-foreground/80">
          <NavItems
            navItems={navItems}
            activeIndex={activeIndex}
            activePath={activePath}
            setActivePath={setActivePath}
            tabRefs={tabRefs}
            pillStyle={pillStyle}
          />

          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="p-2 rounded-full hover:bg-foreground/10 text-foreground/80 transition-colors cursor-pointer"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <span className="text-sm font-semibold text-foreground px-2">
              {activeIndex !== -1
                ? navItems[activeIndex]?.label
                : pathname === '/connect'
                ? t('nav.connect', 'Connect')
                : ''}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <SearchBar
              isMobile={isMobile}
              searchOpen={searchOpen}
              setSearchOpen={setSearchOpen}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              inputRef={inputRef}
              searchRef={searchRef}
              handleKeyDown={handleKeyDown}
              setDropdownVisible={setDropdownVisible}
              clearResults={clearResults}
              t={t}
            />

            {isConnected && jellyfinConfig ? (
              <div ref={userDropdownRef} className="relative z-10">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen((prev) => !prev)}
                  className={`flex items-center justify-center gap-2 px-3 py-2 lg:px-4 rounded-full text-sm font-medium transition-colors duration-200 cursor-pointer ${
                    userDropdownOpen
                      ? 'bg-foreground/15 text-foreground font-semibold shadow-md'
                      : 'text-foreground/80 hover:text-foreground hover:bg-foreground/10'
                  }`}
                  aria-expanded={userDropdownOpen}
                  aria-haspopup="true"
                >
                  <div className="relative shrink-0">
                    <UserAvatar
                      serverUrl={jellyfinConfig.serverUrl}
                      userId={jellyfinConfig.userId}
                      tag={jellyfinConfig.userPrimaryImageTag}
                      username={jellyfinConfig.username}
                    />
                    {isOffline && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-rose-500 border border-background" />
                    )}
                  </div>
                  <span className="hidden lg:inline truncate">
                    {jellyfinConfig.username.length > 8
                      ? `${jellyfinConfig.username.slice(0, 8)}...`
                      : jellyfinConfig.username}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-foreground/50 transition-transform duration-200 ${
                      userDropdownOpen ? 'rotate-180 text-foreground' : ''
                    }`}
                  />
                </button>
              </div>
            ) : (
              <Link
                href="/connect"
                className={`relative z-10 flex items-center justify-center gap-2 px-3 py-2 lg:px-4 rounded-full text-sm font-medium transition-colors duration-200 ${
                  pathname === '/connect'
                    ? 'bg-foreground/15 text-foreground font-semibold shadow-md'
                    : 'text-foreground/80 hover:text-foreground hover:bg-foreground/10'
                }`}
              >
                <Cable className="w-4 h-4 shrink-0" />
                <span className="hidden lg:inline">{t('nav.connect', 'Connect')}</span>
              </Link>
            )}
          </div>
        </nav>

        {/* Desktop search dropdown */}
        {!isMobile && (
          <SearchDropdown
            dropdownVisible={dropdownVisible}
            searchQuery={searchQuery}
            searchLoading={searchLoading}
            results={results}
            dropdownRef={dropdownRef}
            dropdownPos={dropdownPos}
            handleResultClick={handleResultClick}
            t={t}
          />
        )}

        {/* User dropdown rendered as direct sibling to nav */}
        <UserDropdownMenu
          userDropdownOpen={userDropdownOpen}
          isConnected={isConnected}
          jellyfinConfig={jellyfinConfig}
          userMenuRef={userMenuRef}
          userDropdownPos={userDropdownPos}
          setUserDropdownOpen={setUserDropdownOpen}
          t={t}
        />

        <MobileNav
          isMobile={isMobile}
          searchOpen={searchOpen}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchLoading={searchLoading}
          results={results}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          mobileSearchRef={mobileSearchRef}
          mobileInputRef={mobileInputRef}
          handleKeyDown={handleKeyDown}
          handleResultClick={handleResultClick}
          setDropdownVisible={setDropdownVisible}
          clearResults={clearResults}
          navItems={navItems}
          activeIndex={activeIndex}
          setActivePath={setActivePath}
          t={t}
        />
      </header>

      {isOffline && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/65 backdrop-blur-xl text-xs md:text-sm font-medium select-none animate-in fade-in slide-in-from-bottom-4 duration-300">
          <WifiOff className="w-3.5 h-3.5 text-foreground shrink-0 animate-pulse" />
          <span>
            {t('nav.offlineWarning', 'Server unreachable. Please check your connection.')}
          </span>
        </div>
      )}
    </>
  );
}
