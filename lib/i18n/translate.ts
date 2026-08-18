import { Locale, TRANSLATIONS, DEFAULT_LOCALE, TranslationValue, TranslationDict } from './config';

export function translateKey(
  locale: Locale,
  key: string,
  defaultText?: string,
  params?: Record<string, string | number>
): string {
  const keys = key.split('.');
  let current: TranslationValue | undefined = TRANSLATIONS[locale];
  let resultText = defaultText || key;

  let found = true;
  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = (current as TranslationDict)[k];
    } else {
      found = false;
      break;
    }
  }

  if (found && typeof current === 'string') {
    resultText = current;
  } else {
    // Fallback to default locale (English)
    let fallback: TranslationValue | undefined = TRANSLATIONS[DEFAULT_LOCALE];
    let fallbackFound = true;
    for (const fk of keys) {
      if (fallback && typeof fallback === 'object' && fk in fallback) {
        fallback = (fallback as TranslationDict)[fk];
      } else {
        fallbackFound = false;
        break;
      }
    }
    if (fallbackFound && typeof fallback === 'string') {
      resultText = fallback;
    } else {
      resultText = defaultText || key;
    }
  }

  if (params) {
    Object.entries(params).forEach(([paramKey, paramVal]) => {
      resultText = resultText
        .replace(new RegExp(`\\{\\{${paramKey}\\}\\}`, 'g'), String(paramVal))
        .replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
    });
  }

  return resultText;
}

