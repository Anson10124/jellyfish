'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Server, LogOut, ChevronLeft, Plus, Check } from 'lucide-react';
import { JellyfinConfig } from '@/types/server';

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
  const [view, setView] = useState<'main' | 'servers'>('main');
  const [direction, setDirection] = useState<number>(1);
  const [activeServerId, setActiveServerId] = useState<string>('server-1');

  // Reset view state when dropdown closes
  useEffect(() => {
    if (!userDropdownOpen) {
      setView('main');
      setDirection(1);
    }
  }, [userDropdownOpen]);

  if (!userDropdownOpen || !isConnected || !jellyfinConfig) return null;

  const servers = [
    {
      id: 'server-1',
      name: 'Server 1',
      url: jellyfinConfig.serverUrl || 'http://localhost:8096',
    },
    {
      id: 'server-2',
      name: 'Server 2',
      url: 'http://192.168.1.100:8096',
    },
  ];

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
        {/* User Header */}
        <div className="px-3 py-2 border-b border-white/10 mb-1">
          <p className="text-xs font-semibold text-white truncate">{jellyfinConfig.username}</p>
          {jellyfinConfig.serverUrl && (
            <p className="text-[11px] text-neutral-400 truncate">{jellyfinConfig.serverUrl}</p>
          )}
        </div>

        {/* Sub-content*/}
        <motion.div layout className="relative overflow-hidden">
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            {view === 'main' ? (
              <motion.div
                key="main"
                custom={direction}
                variants={contentVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={slideTransition}
                className="space-y-0.5"
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
                  <ChevronLeft className="w-3.5 h-3.5 text-neutral-500 rotate-180 transition-all duration-150 shrink-0" />
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => setUserDropdownOpen(false)}
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
                className="space-y-0.5"
              >
                {/* Back Option */}
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

                {/* Server List */}
                <div className="space-y-0.5">
                  {servers.map((server) => {
                    const isActive = activeServerId === server.id;
                    return (
                      <motion.button
                        key={server.id}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => setActiveServerId(server.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 ease-out cursor-pointer group ${
                          isActive
                            ? 'bg-white/10 text-white shadow-sm'
                            : 'text-neutral-300 hover:text-white hover:bg-white/[0.08]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Server
                            className={`w-4 h-4 shrink-0 transition-colors duration-150 ${
                              isActive ? 'text-white' : 'text-neutral-400 group-hover:text-white'
                            }`}
                          />
                          <span className="truncate">{server.name}</span>
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

                {/* Divider */}
                <div className="border-t border-white/10 my-1" />

                {/* Add Server Option */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => {
                    // UI only action
                  }}
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
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}


