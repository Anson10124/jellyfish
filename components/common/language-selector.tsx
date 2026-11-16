'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useTranslation } from '@/hooks/ui/use-translation';
import { SUPPORTED_LANGUAGES } from '@/lib/i18n/config';
import { LiquidGlass, GLASS_PANEL_OPTIONS, GLASS_PANEL_CLASS } from '@/components/ui/liquid-glass';

export function LanguageSelector() {
  const { locale, setLocale } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.resolve().then(() => {
      setMounted(true);
    });
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeLocale = locale;
  const currentLabel = SUPPORTED_LANGUAGES.find((lang) => lang.code === activeLocale)?.label || 'English';

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <LiquidGlass
        render={<button type="button" />}
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 rounded-xl bg-foreground/10 hover:bg-foreground/15 px-3 py-1.5 text-xs font-medium text-foreground transition cursor-pointer border"
        fallbackClassName="backdrop-blur-md border-border"
        glassClassName="border-transparent"
        glass={{ blur: 4 }}
        aria-expanded={isOpen}
      >
        <Globe className="h-3.5 w-3.5 text-foreground/80" />
        <span suppressHydrationWarning>{currentLabel}</span>
        <ChevronDown className={`h-3 w-3 text-foreground/60 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </LiquidGlass>

      {isOpen && (
        <LiquidGlass
          className="absolute right-0 mt-2 w-36 origin-top-right rounded-xl border shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100"
          fallbackClassName="bg-popover/95 backdrop-blur-xl border-border"
          glassClassName={GLASS_PANEL_CLASS}
          glass={GLASS_PANEL_OPTIONS}
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setLocale(lang.code);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition text-left cursor-pointer ${
                activeLocale === lang.code
                  ? 'text-foreground bg-foreground/10'
                  : 'text-foreground/70 hover:text-foreground hover:bg-foreground/5'
              }`}
            >
              <span>{lang.label}</span>
              {activeLocale === lang.code && <Check className="h-3.5 w-3.5 text-foreground" />}
            </button>
          ))}
        </LiquidGlass>
      )}
    </div>
  );
}
