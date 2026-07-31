const ISO_639_2_TO_1: Record<string, string> = {
  eng: 'en', fre: 'fr', fra: 'fr', ger: 'de', deu: 'de', spa: 'es', ita: 'it', por: 'pt',
  rus: 'ru', zho: 'zh', chi: 'zh', jpn: 'ja', kor: 'ko', pol: 'pl', ukr: 'uk', nld: 'nl',
  dut: 'nl', swe: 'sv', nor: 'no', dan: 'da', fin: 'fi', tur: 'tr', ara: 'ar', heb: 'he',
  hin: 'hi', tha: 'th', vie: 'vi', ind: 'id', ces: 'cs', cze: 'cs', hun: 'hu', ron: 'ro',
  rum: 'ro', ell: 'el', gre: 'el', cat: 'ca', hrv: 'hr', srp: 'sr', slv: 'sl', bul: 'bg',
  slk: 'sk', slo: 'sk', est: 'et', lav: 'lv', lit: 'lt', msa: 'ms', may: 'ms', tam: 'ta',
  tel: 'te', kan: 'kn', mal: 'ml', ben: 'bn', guj: 'gu', pan: 'pa', urd: 'ur', fas: 'fa',
  per: 'fa', fil: 'tl', tgl: 'tl', hye: 'hy', arm: 'hy', kat: 'ka', geo: 'ka', isl: 'is', ice: 'is',
  cn: 'zh', chs: 'zh-Hans', cht: 'zh-Hant', jp: 'ja', kr: 'ko', tw: 'zh-Hant', hk: 'zh-Hant',
};

export { ISO_639_2_TO_1 };

const STATIC_LANGUAGE_NAMES: Record<string, string> = {
  zh: 'Chinese',
  'zh-hans': 'Chinese (Simplified)',
  'zh-hant': 'Chinese (Traditional)',
  cn: 'Chinese',
  ja: 'Japanese',
  jp: 'Japanese',
  ko: 'Korean',
  kr: 'Korean',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  ru: 'Russian',
  hi: 'Hindi',
  ar: 'Arabic',
  tr: 'Turkish',
  nl: 'Dutch',
  pl: 'Polish',
  sv: 'Swedish',
  no: 'Norwegian',
  da: 'Danish',
  fi: 'Finnish',
  th: 'Thai',
  vi: 'Vietnamese',
  id: 'Indonesian',
  cs: 'Czech',
  hu: 'Hungarian',
  ro: 'Romanian',
  el: 'Greek',
  he: 'Hebrew',
  uk: 'Ukrainian',
  ca: 'Catalan',
};

export function getNormalizedLanguageCode(
  langCode?: string | null,
  titleFallback?: string | null
): string {
  const rawCode = langCode ? langCode.toLowerCase().trim().replace(/_/g, '-') : '';
  const titleLower = titleFallback ? titleFallback.toLowerCase().trim() : '';

  if (['zh-hans', 'zh-cn', 'zh-sg', 'chs'].includes(rawCode)) return 'zh-Hans';
  if (['zh-hant', 'zh-tw', 'zh-hk', 'zh-mo', 'cht'].includes(rawCode)) return 'zh-Hant';
  if (['yue', 'zh-yue'].includes(rawCode)) return 'yue';
  if (rawCode === 'cn') return 'zh';
  if (rawCode === 'jp') return 'ja';
  if (rawCode === 'kr') return 'ko';
  if (rawCode === 'tw') return 'zh-Hant';
  if (rawCode === 'hk') return 'zh-Hant';
  if (rawCode === 'ua') return 'uk';
  if (rawCode === 'cz') return 'cs';
  if (rawCode === 'gr') return 'el';

  const isGenericChinese = ['chi', 'zho', 'zh', 'cn'].includes(rawCode);
  
  if (isGenericChinese && titleLower) {
    // Traditional Chinese
    if (
      titleLower.includes('traditional') ||
      titleLower.includes('繁體') ||
      titleLower.includes('繁体') ||
      titleLower.includes('繁中') ||
      titleLower.includes('zh-tw') ||
      titleLower.includes('zh-hk') ||
      titleLower.includes('zh-hant') ||
      titleLower.includes('cht') ||
      /\b(tc|cht)\b/i.test(titleLower)
    ) {
      return 'zh-Hant';
    }

    // Simplified Chinese
    if (
      titleLower.includes('simplified') ||
      titleLower.includes('簡體') ||
      titleLower.includes('简体') ||
      titleLower.includes('簡中') ||
      titleLower.includes('简中') ||
      titleLower.includes('zh-cn') ||
      titleLower.includes('zh-hans') ||
      titleLower.includes('chs') ||
      /\b(sc|chs)\b/i.test(titleLower)
    ) {
      return 'zh-Hans';
    }

    // Cantonese
    if (
      titleLower.includes('cantonese') ||
      titleLower.includes('粵語') ||
      titleLower.includes('粤语') ||
      titleLower.includes('廣東話') ||
      titleLower.includes('广东话') ||
      titleLower.includes('yue')
    ) {
      return 'yue';
    }
  }

  if (rawCode && rawCode !== 'und') {
    const parts = rawCode.split('-');
    const base = parts[0];
    const rest = parts.slice(1).join('-');

    const mappedBase = ISO_639_2_TO_1[base] || base;
    return rest ? `${mappedBase}-${rest}` : mappedBase;
  }

  return '';
}

export function formatLanguageName(
  langCode?: string | null,
  titleFallback?: string | null,
  targetLocale: string = 'en'
): string {
  const code = getNormalizedLanguageCode(langCode, titleFallback);

  if (code) {
    try {
      const displayNames = new Intl.DisplayNames([targetLocale, 'en'], { type: 'language' });
      const name = displayNames.of(code);
      if (name && name.toLowerCase() !== code.toLowerCase()) {
        return targetLocale.startsWith('en') 
          ? name.charAt(0).toUpperCase() + name.slice(1) 
          : name;
      }
    } catch {
      // ignore
    }

    const staticName = STATIC_LANGUAGE_NAMES[code.toLowerCase()];
    if (staticName) {
      return staticName;
    }
  }

  if (titleFallback) {
    const firstWord = titleFallback.split(/[-–—(\[\s]/)[0].trim();
    if (firstWord.length >= 3) {
      const wordLower = firstWord.toLowerCase();
      const code2 = getNormalizedLanguageCode(wordLower, null) || ISO_639_2_TO_1[wordLower] || wordLower;
      try {
        const displayNames = new Intl.DisplayNames([targetLocale, 'en'], { type: 'language' });
        const name = displayNames.of(code2);
        if (name && name.toLowerCase() !== code2.toLowerCase()) {
          return targetLocale.startsWith('en') 
            ? name.charAt(0).toUpperCase() + name.slice(1) 
            : name;
        }
      } catch {
        // ignore
      }
      return firstWord.charAt(0).toUpperCase() + firstWord.slice(1);
    }
  }

  const raw = langCode ? langCode.toLowerCase().trim() : '';
  if (raw && raw !== 'und') {
    const staticFallback = STATIC_LANGUAGE_NAMES[raw];
    if (staticFallback) {
      return staticFallback;
    }
    return raw.length <= 3 ? raw.toUpperCase() : raw.charAt(0).toUpperCase() + raw.slice(1);
  }

  return 'Unknown';
}