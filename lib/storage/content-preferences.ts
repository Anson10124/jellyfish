const SHOW_NSFW_KEY = 'jellyfish_show_nsfw';
const CHANGE_EVENT = 'jellyfish:content-preferences';

export function getShowNsfw(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(SHOW_NSFW_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setShowNsfw(value: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SHOW_NSFW_KEY, String(value));
  } catch (e) {
    console.error('Failed to save content preferences:', e);
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeContentPreferences(callback: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === SHOW_NSFW_KEY) callback();
  };
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener('storage', onStorage);
  };
}
