'use client';

import React from 'react';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { CSS_SPRING_EASING } from '@/constants';

export interface NavItemDef {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface NavItemsProps {
  navItems: NavItemDef[];
  activeIndex: number;
  activePath: string;
  setActivePath: (href: string) => void;
  tabRefs: React.MutableRefObject<(HTMLAnchorElement | null)[]>;
  pillStyle: { left: number; width: number; ready: boolean };
}

export function NavItems({
  navItems,
  activeIndex,
  activePath,
  setActivePath,
  tabRefs,
  pillStyle,
}: NavItemsProps) {
  return (
    <div className="hidden md:flex items-center gap-1 relative">
      {activeIndex !== -1 && pillStyle.ready && (
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
        const isActive = activeIndex === index;

        return (
          <Link
            key={item.href}
            ref={(el) => {
              tabRefs.current[index] = el;
            }}
            href={item.href}
            onClick={() => setActivePath(item.href)}
            className={`relative z-10 flex items-center justify-center gap-2 px-3 py-2 lg:px-4 rounded-full text-sm font-medium transition-colors duration-200 ${
              isActive ? 'text-white font-semibold' : 'text-neutral-300 hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden lg:inline">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
