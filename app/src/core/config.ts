// DuckMC — хранение настроек (localStorage, позже: нативное хранилище через адаптер)
import type { Settings } from './types';

const KEY_SETTINGS = 'duckmc.settings.v1';
const KEY_ACCOUNTS = 'duckmc.accounts.v1';

export const DEFAULT_SETTINGS: Settings = {
  game: {
    memoryMb: 2048,
    fullWidth: 960,
    fullHeight: 540,
    fullscreen: false,
    javaPath: '',
    jvmArgs: '',
    gameDir: '',
    defaultEdition: 'java',
    defaultVersionJava: '1.21.10',
  },
  launcher: {
    language: 'ru',
    theme: 'dark',
    closeAfterLaunch: false,
    checkUpdatesOnStart: true,
    discordRpc: false,
  },
  accounts: {
    // Реальный вход Microsoft + совместимые authserver (ely.by и аналоги)
    authServerUrl: 'https://authserver.ely.by',
    microsoftClientId: '',
    preferredProvider: 'microsoft',
  },
  downloads: {
    installDir: '',
    verifyFiles: true,
    torrentMirror: false,
  },
  installedJava: [],
};

function deepMerge<T>(base: T, patch: Partial<T> | null | undefined): T {
  if (!patch || typeof patch !== 'object') return base;
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [k, v] of Object.entries(patch)) {
    const bv = (base as Record<string, unknown>)[k];
    if (v && typeof v === 'object' && !Array.isArray(v) && bv && typeof bv === 'object' && !Array.isArray(bv)) {
      out[k] = deepMerge(bv, v as Record<string, unknown>);
    } else if (v !== undefined) {
      out[k] = v;
    }
  }
  return out as T;
}

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY_SETTINGS);
    if (!raw) return structuredClone(DEFAULT_SETTINGS);
    return deepMerge(structuredClone(DEFAULT_SETTINGS), JSON.parse(raw));
  } catch {
    return structuredClone(DEFAULT_SETTINGS);
  }
}

export function saveSettings(s: Settings): void {
  try {
    localStorage.setItem(KEY_SETTINGS, JSON.stringify(s));
  } catch {
    // ignore (private mode и т.п.)
  }
}

export function loadAccounts(): import('./types').Account[] {
  try {
    const raw = localStorage.getItem(KEY_ACCOUNTS);
    return raw ? (JSON.parse(raw) as import('./types').Account[]) : [];
  } catch {
    return [];
  }
}

export function saveAccounts(accs: import('./types').Account[]): void {
  try {
    localStorage.setItem(KEY_ACCOUNTS, JSON.stringify(accs));
  } catch {
    // ignore
  }
}
