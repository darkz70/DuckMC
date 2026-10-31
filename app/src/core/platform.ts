// DuckMC — платформенный слой.
// В веб-демо запуск симулируется. На нативных платформах интерфейс PlatformAdapter
// реализуется через Tauri (десктоп + мобильные) — см. docs/ROADMAP.md
import type { PlatformId } from './types';

export interface PlatformAdapter {
  id: PlatformId;
  /** умеет ли реально запускать процесс игры */
  canLaunchReal(): boolean;
  openExternal(url: string): void;
  pickDirectory?(): Promise<string | null>;
}

export function detectPlatform(): PlatformId {
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return 'android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  if (/Windows/i.test(ua)) return 'windows';
  if (/Mac OS X|Macintosh/i.test(ua)) return 'macos';
  if (/Linux/i.test(ua)) return 'linux';
  return 'web';
}

export function platformLabel(p: PlatformId): string {
  switch (p) {
    case 'android': return 'Android';
    case 'ios': return 'iOS';
    case 'windows': return 'Windows';
    case 'macos': return 'macOS';
    case 'linux': return 'Linux';
    default: return 'Браузер (демо)';
  }
}

/** Демо-адаптер: всё, что требует реального доступа к ОС, помечаем как недоступное */
export const webAdapter: PlatformAdapter = {
  id: 'web',
  canLaunchReal: () => false,
  openExternal: (url) => {
    window.open(url, '_blank', 'noopener');
  },
};
