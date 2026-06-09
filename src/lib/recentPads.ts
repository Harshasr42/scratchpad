export interface RecentPad {
  path: string;
  language: string;
  updatedAt: string;
}

const STORAGE_KEY = 'scratchpad_recent_pads';
const MAX_RECENT_PADS = 6;

function readRecentPads(): RecentPad[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as RecentPad[]) : [];
  } catch {
    return [];
  }
}

export function getRecentPads(): RecentPad[] {
  return readRecentPads().slice(0, MAX_RECENT_PADS);
}

export function saveRecentPad(path: string, language = 'plaintext'): void {
  if (typeof window === 'undefined') return;

  const trimmedPath = path.trim().replace(/^\/+|\/+$/g, '');
  if (!trimmedPath) return;

  const next = readRecentPads()
    .filter((item) => item.path !== trimmedPath)
    .concat({ path: trimmedPath, language, updatedAt: new Date().toISOString() })
    .slice(-MAX_RECENT_PADS);

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function removeRecentPad(path: string): void {
  if (typeof window === 'undefined') return;

  const next = readRecentPads().filter((item) => item.path !== path);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}
