'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { X, Cable, LogOut, Clock, Server, Check } from 'lucide-react';

import { useServerConfig } from '@/hooks/connect/use-server-config';
import { useServerContext } from '@/context/server-context';
import { formatServerAddress } from '@/lib/utils';
import { UserAvatar } from './user-avatar';
import { NavItemDef } from './nav-items';

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
  navItems: NavItemDef[];
  activeIndex: number;
  setActivePath: (href: string) => void;
  t: (key: string, fallback: string) => string;
}

export function MobileSidebar({
  open,
  onClose,
  navItems,
  activeIndex,
  setActivePath,
  t,
}: MobileSidebarProps) {
  const router = useRouter();
  const { jellyfinConfig, isInitialized, connectionState } = useServerContext();
  const isOffline = isInitialized && connectionState.status === 'offline';
  const isConnected = isInitialized && Boolean(jellyfinConfig?.username);
  const { servers, activeServerId, switchServer, removeServer, seerrConfig } = useServerConfig();

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const diffX = e.touches[0].clientX - touchStartX.current;
    const diffY = e.touches[0].clientY - touchStartY.current;
    if (diffX < -50 && Math.abs(diffX) > Math.abs(diffY)) {
      onClose();
      touchStartX.current = null;
      touchStartY.current = null;
    }
  };

  const handleTouchEnd = () => {
    touchStartX.current = null;
    touchStartY.current = null;
  };

  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  const handleNavClick = (href: string) => {
    setActivePath(href);
    onClose();
  };

  const handleConnectClick = () => {
    onClose();
    router.push('/connect');
  };

  const handleRequestsClick = () => {
    onClose();
    router.push('/requests');
  };

  const handleSwitchServer = (serverId: string) => {
    if (serverId !== activeServerId) {
      switchServer(serverId);
    }
    onClose();
  };

  const handleSignOut = () => {
    if (activeServerId) {
      removeServer(activeServerId);
    }
    onClose();
    if (servers.length <= 1) {
      router.push('/connect');
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="mobile-sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[60] md:hidden cursor-pointer"
            aria-hidden="true"
          />
          <motion.aside
            key="mobile-sidebar-panel"
            initial={{ x: '-100%' }}
            animate={{ x: '0%' }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="fixed top-0 bottom-0 left-0 w-[290px] max-w-[82vw] h-dvh z-[70] bg-background/95 backdrop-blur-2xl border-r border-border shadow-2xl flex flex-col md:hidden select-none"
            aria-label="Mobile Navigation"
          >
            <div className="flex items-center justify-between px-4 py-4 border-b border-border/80">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-foreground/10 flex items-center justify-center p-1 border border-border shrink-0">
                  <img
                    src="/web-app-manifest-192x192.png"
                    alt="Jellyfish"
                    width={32}
                    height={32}
                    className="w-full h-full object-contain rounded-lg"
                  />
                </div>
                <div className="min-w-0">
                  <span className="font-semibold text-foreground text-sm tracking-tight block leading-tight">
                    Jellyfish
                  </span>
                  <span className="text-[11px] text-foreground/45 block leading-tight truncate max-w-[170px]">
                    {isConnected && jellyfinConfig
                      ? `Connected to ${jellyfinConfig.serverName || jellyfinConfig.serverUrl || 'Server'}`
                      : t('nav.notConnected', 'Not connected')}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full hover:bg-foreground/10 text-foreground/70 hover:text-foreground transition-colors cursor-pointer"
                aria-label={t('common.close', 'Close')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
              {navItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = activeIndex === index;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => handleNavClick(item.href)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-foreground/15 text-foreground font-semibold shadow-sm'
                        : 'text-foreground/75 hover:text-foreground hover:bg-foreground/[0.08] active:scale-[0.98]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-foreground' : 'text-foreground/60'}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {seerrConfig?.isConnected && (
                <button
                  type="button"
                  onClick={handleRequestsClick}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-foreground/75 hover:text-foreground hover:bg-foreground/[0.08] active:scale-[0.98] transition-all duration-150 cursor-pointer"
                >
                  <Clock className="w-4 h-4 text-foreground/60" />
                  <span>{t('nav.myRequests', 'My Requests')}</span>
                </button>
              )}
            </div>
            <div className="shrink-0 p-3 border-t border-border/80 bg-foreground/[0.02] space-y-3">
              {servers && servers.length > 1 && (
                <div className="space-y-1">
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {servers.map((server) => {
                      const isActive = activeServerId === server.id;
                      const cleanAddress = formatServerAddress(server.serverUrl);

                      return (
                        <button
                          key={server.id}
                          type="button"
                          onClick={() => handleSwitchServer(server.id)}
                          className={`w-full flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${
                            isActive
                              ? 'bg-foreground/15 text-foreground font-semibold shadow-sm'
                              : 'text-foreground/75 hover:text-foreground hover:bg-foreground/[0.08] active:scale-[0.98]'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 text-left flex-1">
                            <Server
                              className={`w-4 h-4 shrink-0 ${
                                isActive ? 'text-foreground' : 'text-foreground/60'
                              }`}
                            />
                            <div className="min-w-0 flex-1">
                              <span className="block truncate leading-tight">
                                {server.serverName && server.serverName !== server.serverUrl
                                  ? server.serverName
                                  : server.serverName || t('nav.server', 'Server')}
                              </span>
                              {cleanAddress && (
                                <span
                                  className={`block truncate text-[11px] font-normal leading-tight mt-0.5 ${
                                    isActive ? 'text-foreground/60' : 'text-foreground/45'
                                  }`}
                                >
                                  {cleanAddress}
                                </span>
                              )}
                            </div>
                          </div>
                          {isActive && <Check className="w-4 h-4 text-foreground shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {isConnected && jellyfinConfig ? (
                <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-foreground/5 border border-border/50">
                  <div className="flex items-center gap-2.5 min-w-0">
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
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {jellyfinConfig.username}
                      </p>
                      <p className="text-[10px] text-foreground/50 truncate">
                        {jellyfinConfig.serverName || t('nav.server', 'Server')}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title={t('nav.signOut', 'Sign Out')}
                    aria-label={t('nav.signOut', 'Sign Out')}
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleConnectClick}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-foreground/10 hover:bg-foreground/15 text-xs font-medium text-foreground transition-colors cursor-pointer border border-border/50"
                >
                  <Cable className="w-3.5 h-3.5" />
                  <span>{t('nav.connect', 'Connect')}</span>
                </button>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
