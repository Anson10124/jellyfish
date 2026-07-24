import { Locale } from '@/lib/i18n/config';

export interface FormatDateOptions extends Intl.DateTimeFormatOptions {
  fallback?: string | null;
}

export function formatDate(
  dateInput?: string | number | Date | null,
  locale: Locale | string = 'en',
  options: FormatDateOptions = {}
): string | null {
  if (!dateInput) return options.fallback ?? null;

  try {
    let date: Date;
    let isDateOnly = false;

    if (typeof dateInput === 'string') {
      const trimmed = dateInput.trim();
      if (!trimmed) return options.fallback ?? null;

      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        date = new Date(`${trimmed}T00:00:00Z`);
        isDateOnly = true;
      } else {
        date = new Date(trimmed);
      }
    } else if (typeof dateInput === 'number') {
      date = new Date(dateInput);
    } else {
      date = dateInput;
    }

    if (isNaN(date.getTime())) return options.fallback ?? null;

    const { fallback, ...dateTimeOptions } = options;

    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...(isDateOnly && !dateTimeOptions.timeZone ? { timeZone: 'UTC' } : {}),
      ...dateTimeOptions,
    };

    return new Intl.DateTimeFormat(locale, defaultOptions).format(date);
  } catch (error) {
    return options.fallback ?? null;
  }
}
