import { Locale, TRANSLATIONS, DEFAULT_LOCALE } from './config';

export function translateKey(locale: Locale, key: string, defaultText?: string): string {
  const keys = key.split('.');
  let current: any = TRANSLATIONS[locale];

  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k];
    } else {
      // Fallback to default locale (English)
      let fallback: any = TRANSLATIONS[DEFAULT_LOCALE];
      for (const fk of keys) {
        if (fallback && typeof fallback === 'object' && fk in fallback) {
          fallback = fallback[fk];
        } else {
          return defaultText || key;
        }
      }
      return typeof fallback === 'string' ? fallback : defaultText || key;
    }
  }

  return typeof current === 'string' ? current : defaultText || key;
}
