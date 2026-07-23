'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { SUPPORTED_LANGUAGES } from '@/lib/i18n/config';

export function LanguageSelector() {
  const { locale, setLocale } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
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
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 px-3 py-1.5 text-xs font-medium text-white transition cursor-pointer backdrop-blur-md border border-white/10"
        aria-expanded={isOpen}
      >
        <Globe className="h-3.5 w-3.5 text-white/80" />
        <span suppressHydrationWarning>{currentLabel}</span>
        <ChevronDown className={`h-3 w-3 text-white/60 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 origin-top-right rounded-xl bg-[#1a1a20]/95 backdrop-blur-xl border border-white/10 shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setLocale(lang.code);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition text-left cursor-pointer ${
                activeLocale === lang.code
                  ? 'text-white bg-white/10'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{lang.label}</span>
              {activeLocale === lang.code && <Check className="h-3.5 w-3.5 text-white" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
