import en from '@/locales/en.json';
import zhTW from '@/locales/zh-TW.json';
import { getStoredConfig } from '@/lib/storage/app-config';

export type Locale = 'en' | 'zh-TW';

export interface LanguageOption {
  code: Locale;
  label: string;
}

export const DEFAULT_LOCALE: Locale = 'en';
// Cookie mirror of the stored locale so the server can render in the right language.
export const LOCALE_COOKIE_KEY = 'jellyfish_locale';

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English' },
  { code: 'zh-TW', label: '繁體中文' },
];

export const TMDB_LANGUAGE_MAP: Record<Locale, string> = {
  en: 'en-US',
  'zh-TW': 'zh-TW',
};

export type TranslationValue = string | { [key: string]: TranslationValue };
export type TranslationDict = Record<string, TranslationValue>;

export const TRANSLATIONS: Record<Locale, TranslationDict> = {
  en: en as unknown as TranslationDict,
  'zh-TW': zhTW as unknown as TranslationDict,
};

// Extract language code from a full locale identifier
export function getIsoLanguage(languageCode: string): string {
  return languageCode.split('-')[0].toLowerCase();
}

// Build TMDB image language query
export function getImageLanguageParam(languageCode: string): string {
  const iso = getIsoLanguage(languageCode);
  return iso === 'en' ? 'en,null' : `${iso},en,null`;
}

// Get initial locale from stored config / browser
export function getInitialLocale(): Locale {
  if (typeof window !== 'undefined') {
    const saved = getStoredConfig().locale;
    if (saved && (saved === 'en' || saved === 'zh-TW' || saved === 'zhtw')) {
      return saved === 'zhtw' ? 'zh-TW' : (saved as Locale);
    }
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.includes('zh') || browserLang.includes('tw') || browserLang.includes('hk')) {
      return 'zh-TW';
    }
  }
  return DEFAULT_LOCALE;
}
