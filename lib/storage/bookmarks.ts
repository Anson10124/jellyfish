export type BookmarkMediaType = 'movie' | 'tv';

export interface Bookmark {
  id: string;
  mediaType: BookmarkMediaType;
  title: string;
  // Raw TMDB path (e.g. "/abc.jpg"); the poster card builds the image URL itself
  posterPath?: string | null;
  year?: number | null;
  addedAt: number;
}

const BOOKMARKS_KEY = 'jellyfish_bookmarks';
const BOOKMARKS_CHANGE_EVENT = 'jellyfish:bookmarks';

const EMPTY: Bookmark[] = [];

// useSyncExternalStore needs the same array back until the stored data changes,
// so cache the parsed list against the raw string it came from.
let cachedRaw: string | null = null;
let cachedList: Bookmark[] = EMPTY;

export function getBookmarkKey(mediaType: BookmarkMediaType, id: string | number): string {
  return `${mediaType}:${String(id)}`;
}

function isBookmark(value: unknown): value is Bookmark {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === 'string' &&
    (item.mediaType === 'movie' || item.mediaType === 'tv') &&
    typeof item.title === 'string'
  );
}

export function getBookmarks(): Bookmark[] {
  if (typeof window === 'undefined') return EMPTY;
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(BOOKMARKS_KEY);
  } catch {
    return cachedList;
  }
  if (raw === cachedRaw) return cachedList;

  cachedRaw = raw;
  if (!raw) {
    cachedList = EMPTY;
    return cachedList;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    cachedList = Array.isArray(parsed) ? parsed.filter(isBookmark) : EMPTY;
  } catch (e) {
    console.error('Failed to read bookmarks:', e);
    cachedList = EMPTY;
  }
  return cachedList;
}

export function getServerBookmarks(): Bookmark[] {
  return EMPTY;
}

function saveBookmarks(list: Bookmark[]): void {
  try {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Failed to save bookmarks:', e);
  }
  window.dispatchEvent(new Event(BOOKMARKS_CHANGE_EVENT));
}

export function isBookmarked(mediaType: BookmarkMediaType, id: string | number): boolean {
  const key = getBookmarkKey(mediaType, id);
  return getBookmarks().some((b) => getBookmarkKey(b.mediaType, b.id) === key);
}

export function addBookmark(item: Omit<Bookmark, 'addedAt' | 'id'> & { id: string | number }): void {
  if (typeof window === 'undefined') return;
  const id = String(item.id);
  const key = getBookmarkKey(item.mediaType, id);
  const rest = getBookmarks().filter((b) => getBookmarkKey(b.mediaType, b.id) !== key);
  // Newest first, so the library shows recently saved titles at the start
  saveBookmarks([{ ...item, id, addedAt: Date.now() }, ...rest]);
}

export function removeBookmark(mediaType: BookmarkMediaType, id: string | number): void {
  if (typeof window === 'undefined') return;
  const key = getBookmarkKey(mediaType, id);
  saveBookmarks(getBookmarks().filter((b) => getBookmarkKey(b.mediaType, b.id) !== key));
}

export function subscribeBookmarks(callback: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === BOOKMARKS_KEY || event.key === null) callback();
  };
  window.addEventListener(BOOKMARKS_CHANGE_EVENT, callback);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(BOOKMARKS_CHANGE_EVENT, callback);
    window.removeEventListener('storage', onStorage);
  };
}
