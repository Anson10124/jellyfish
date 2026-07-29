import { Locale, TRANSLATIONS, DEFAULT_LOCALE, TranslationValue, TranslationDict } from './config';

export function translateKey(locale: Locale, key: string, defaultText?: string): string {
  const keys = key.split('.');
  let current: TranslationValue | undefined = TRANSLATIONS[locale];

  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = (current as TranslationDict)[k];
    } else {
      // Fallback to default locale (English)
      let fallback: TranslationValue | undefined = TRANSLATIONS[DEFAULT_LOCALE];
      for (const fk of keys) {
        if (fallback && typeof fallback === 'object' && fk in fallback) {
          fallback = (fallback as TranslationDict)[fk];
        } else {
          return defaultText || key;
        }
      }
      return typeof fallback === 'string' ? fallback : defaultText || key;
    }
  }

  return typeof current === 'string' ? current : defaultText || key;
}
