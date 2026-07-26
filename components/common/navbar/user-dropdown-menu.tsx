'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Server, LogOut } from 'lucide-react';
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
  if (!userDropdownOpen || !isConnected || !jellyfinConfig) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={userMenuRef}
        initial={{ opacity: 0, y: -8, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.97 }}
        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
        className="absolute top-full mt-2 w-48 origin-top-right rounded-2xl bg-[#121215]/65 backdrop-blur-2xl border border-white/10 shadow-2xl p-1.5 z-[100]"
        style={{
          right: userDropdownPos.right !== undefined ? `${userDropdownPos.right}px` : '12px',
        }}
      >
        <div className="px-3 py-2 border-b border-white/10 mb-1">
          <p className="text-xs font-semibold text-white truncate">{jellyfinConfig.username}</p>
          {jellyfinConfig.serverUrl && (
            <p className="text-[11px] text-neutral-400 truncate">{jellyfinConfig.serverUrl}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setUserDropdownOpen(false)}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-neutral-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <Server className="w-4 h-4 text-neutral-400 shrink-0" />
          <span>{t('nav.changeServer', 'Change Server')}</span>
        </button>
        <button
          type="button"
          onClick={() => setUserDropdownOpen(false)}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{t('nav.signOut', 'Sign Out')}</span>
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
