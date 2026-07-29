'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { Server, LogOut, ChevronLeft, Plus, Check } from 'lucide-react';
import { JellyfinConfig } from '@/types/server';
import { useServerConfig } from '@/hooks/connect/use-server-config';

interface UserDropdownMenuProps {
  userDropdownOpen: boolean;
  isConnected: boolean;
  jellyfinConfig: JellyfinConfig | null;
  userMenuRef: React.RefObject<HTMLDivElement | null>;
  userDropdownPos: { right?: number };
  setUserDropdownOpen: (open: boolean) => void;
  t: (key: string, fallback: string) => string;
}

export function UserDropdownMenu({
  userDropdownOpen,
  isConnected,
  jellyfinConfig,
  userMenuRef,
  userDropdownPos,
  setUserDropdownOpen,
  t,
}: UserDropdownMenuProps) {
  const router = useRouter();
  const { servers, activeServerId, switchServer, removeServer, serverStatuses } = useServerConfig();
  const [view, setView] = useState<'main' | 'servers'>('main');
  const [direction, setDirection] = useState<number>(1);
  const [contentHeight, setContentHeight] = useState<number | 'auto'>('auto');
  const contentRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userDropdownOpen) {
      setView('main');
      setDirection(1);
      setContentHeight('auto');
    }
  }, [userDropdownOpen]);

  useEffect(() => {
    if (!contentRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const h = entry.contentRect.height;
        if (h > 0) {
          setContentHeight(h);
        }
      }
    });
    observer.observe(contentRef.current);
    return () => observer.disconnect();
  }, [view, userDropdownOpen]);

  if (!userDropdownOpen || !isConnected || !jellyfinConfig) return null;

  const handleSwitchServer = (serverId: string) => {
    if (serverId === activeServerId) return;
    switchServer(serverId);
    setUserDropdownOpen(false);
  };

  const handleAddServer = () => {
    setUserDropdownOpen(false);
    router.push('/connect');
  };

  const handleSignOut = () => {
    if (activeServerId) {
      removeServer(activeServerId);
    }
    setUserDropdownOpen(false);
    // If no servers remain, redirect to connect page
    if (servers.length <= 1) {
      router.push('/connect');
    }
  };

  const contentVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 20 : -20,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -20 : 20,
      opacity: 0,
    }),
  };

  const slideTransition = {
    duration: 0.22,
    ease: [0.16, 1, 0.3, 1] as const,
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={userMenuRef}
        initial={{ opacity: 0, y: -8, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.96 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="absolute top-full mt-2 w-56 origin-top-right rounded-2xl bg-[#121215]/80 backdrop-blur-2xl border border-white/10 shadow-2xl p-1.5 z-[100] overflow-hidden"
        style={{
          right: userDropdownPos.right !== undefined ? `${userDropdownPos.right}px` : '12px',
        }}
      >
        <div className="px-3 py-2 border-b border-white/10 mb-1">
          <p className="text-xs font-semibold text-white truncate">{jellyfinConfig.username}</p>
          {jellyfinConfig.serverName && (
            <div className="flex items-center justify-between gap-2 mt-0.5">
              <span className="text-[11px] text-neutral-400 truncate flex-1">{jellyfinConfig.serverName}</span>
              {activeServerId && (
                <span
                  className={`text-[11px] text-neutral-400`}
                >
                  {serverStatuses[activeServerId] || 'checking'}
                </span>
              )}
            </div>
          )}
        </div>

        <motion.div
          animate={{ height: contentHeight }}
          transition={slideTransition}
          className="relative overflow-hidden"
        >
          <div ref={contentRef} className="relative w-full">
            <AnimatePresence mode="popLayout" custom={direction} initial={false}>
              {view === 'main' ? (
                <motion.div
                  key="main"
                  custom={direction}
                  variants={contentVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={slideTransition}
                  className="space-y-0.5 w-full"
                >
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => {
                    setDirection(1);
                    setView('servers');
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-neutral-300 hover:text-white hover:bg-white/[0.08] transition-all duration-150 ease-out cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Server className="w-4 h-4 text-neutral-400 group-hover:text-white transition-colors duration-150 shrink-0" />
                    <span className="truncate">{t('nav.changeServer', 'Change Server')}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {servers.length > 1 && (
                      <span className="text-[10px] text-neutral-500 tabular-nums">{servers.length}</span>
                    )}
                    <ChevronLeft className="w-3.5 h-3.5 text-neutral-500 rotate-180 transition-all duration-150 shrink-0" />
                  </div>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all duration-150 ease-out cursor-pointer group"
                >
                  <LogOut className="w-4 h-4 text-rose-400 shrink-0 group-hover:scale-105 transition-transform duration-150" />
                  <span>{t('nav.signOut', 'Sign Out')}</span>
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                key="servers"
                custom={direction}
                variants={contentVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={slideTransition}
                className="space-y-0.5 w-full"
              >
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => {
                    setDirection(-1);
                    setView('main');
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-all duration-150 ease-out cursor-pointer mb-1 group"
                >
                  <ChevronLeft className="w-4 h-4 text-neutral-400 group-hover:text-white transition-transform duration-150 shrink-0" />
                  <span>{t('nav.back', 'Back')}</span>
                </motion.button>

                <div className="space-y-0.5">
                  {servers.map((server) => {
                    const isActive = activeServerId === server.id;
                    const status = serverStatuses[server.id] || 'checking';
                    return (
                      <motion.button
                        key={server.id}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => handleSwitchServer(server.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 ease-out cursor-pointer group ${
                          isActive
                            ? 'bg-white/10 text-white shadow-sm'
                            : 'text-neutral-300 hover:text-white hover:bg-white/[0.08]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 text-left">
                          <Server
                            className={`w-4 h-4 shrink-0 transition-colors duration-150 ${
                              isActive ? 'text-white' : 'text-neutral-400 group-hover:text-white'
                            }`}
                          />
                          <div className="min-w-0 flex-1 text-left">
                            <span
                              className={`block truncate text-xs font-semibold leading-tight ${
                                isActive ? 'text-white' : 'text-neutral-200 group-hover:text-white'
                              }`}
                            >
                              {server.serverName || server.serverUrl}
                            </span>
                            <span
                              className={`block truncate text-[11px] leading-tight mt-0.5 ${
                                isActive ? 'text-white/70' : 'text-neutral-400 group-hover:text-neutral-300'
                              }`}
                            >
                              {server.username}
                            </span>
                          </div>
                        </div>
                        {isActive && (
                          <div className="flex items-center gap-1 shrink-0">
                            <Check className="w-3.5 h-3.5 text-white" />
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                <div className="border-t border-white/10 my-1" />

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={handleAddServer}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-neutral-300 hover:text-white hover:bg-white/[0.08] transition-all duration-150 ease-out cursor-pointer group"
                >
                  <div className="w-4 h-4 rounded-md bg-white/10 group-hover:bg-white/20 flex items-center justify-center transition-colors duration-150 shrink-0">
                    <Plus className="w-3 h-3 text-white" />
                  </div>
                  <span>{t('nav.addServer', 'Add Server')}</span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  </AnimatePresence>
  );
}
