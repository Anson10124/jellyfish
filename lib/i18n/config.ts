import en from '@/locales/en.json';
import zhTW from '@/locales/zh-TW.json';

export type Locale = 'en' | 'zh-TW';

export interface LanguageOption {
  code: Locale;
  label: string;
}

export const DEFAULT_LOCALE: Locale = 'en';
export const LOCAL_STORAGE_KEY = 'jellyfish_locale';

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English' },
  { code: 'zh-TW', label: '繁體中文' },
];

export const TMDB_LANGUAGE_MAP: Record<Locale, string> = {
  en: 'en-US',
  'zh-TW': 'zh-TW',
};

export const TRANSLATIONS: Record<Locale, Record<string, any>> = {
  en,
  'zh-TW': zhTW,
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

// Get initial locale from localStorage / browser 
export function getInitialLocale(): Locale {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY) as string | null;
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
