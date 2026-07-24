'use client';

import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react';
import {
  Locale,
  LOCAL_STORAGE_KEY,
  TMDB_LANGUAGE_MAP,
  DEFAULT_LOCALE,
  getInitialLocale,
} from '@/lib/i18n/config';
import { translateKey } from '@/lib/i18n/translate';
import { formatDate, FormatDateOptions } from '@/lib/utils/date-format';

export type { Locale };

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  tmdbLanguage: string;
  t: (key: string, defaultText?: string) => string;
  formatDate: (dateInput?: string | number | Date | null, options?: FormatDateOptions) => string | null;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({
  children,
  initialLocale = DEFAULT_LOCALE,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, newLocale);
      document.cookie = `${LOCAL_STORAGE_KEY}=${newLocale}; path=/; max-age=31536000`;
    }
  }, []);

  useEffect(() => {
    const savedLocale = getInitialLocale();
    if (savedLocale && savedLocale !== locale) {
      setLocaleState(savedLocale);
    } else if (typeof window !== 'undefined') {
      document.cookie = `${LOCAL_STORAGE_KEY}=${locale}; path=/; max-age=31536000`;
    }
  }, []);

  const t = useCallback(
    (key: string, defaultText?: string): string => {
      return translateKey(locale, key, defaultText);
    },
    [locale]
  );

  const formatDateBound = useCallback(
    (dateInput?: string | number | Date | null, options?: FormatDateOptions): string | null => {
      return formatDate(dateInput, locale, options);
    },
    [locale]
  );

  const value = useMemo<I18nContextType>(
    () => ({
      locale,
      setLocale,
      tmdbLanguage: TMDB_LANGUAGE_MAP[locale] || TMDB_LANGUAGE_MAP[DEFAULT_LOCALE],
      t,
      formatDate: formatDateBound,
    }),
    [locale, setLocale, t, formatDateBound]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
