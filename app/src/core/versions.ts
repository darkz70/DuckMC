// DuckMC — список версий Minecraft.
// Java: официальный манифест Mojang (piston-meta). При CORS-блокировке — встроенный кэш.
// Bedrock: распространять платный контент нельзя — показываем официальные источники.
import type { VersionInfo } from './types';

export const JAVA_MANIFEST_URL = 'https://piston-meta.mojang.com/mc/game/version_manifest_v2.json';

/** Демо-кэш на случай офлайна/CORS (обновляется при первом успешном сетевом запросе) */
export const FALLBACK_JAVA_VERSIONS: VersionInfo[] = [
  { id: '1.21.10', type: 'release', releaseTime: '2025-10-14' },
  { id: '1.21.9', type: 'release', releaseTime: '2025-09-30' },
  { id: '1.21.8', type: 'release', releaseTime: '2025-07-17' },
  { id: '1.21.7', type: 'release', releaseTime: '2025-06-17' },
  { id: '1.21.6', type: 'release', releaseTime: '2025-06-03' },
  { id: '1.21.5', type: 'release', releaseTime: '2025-03-25' },
  { id: '1.21.4', type: 'release', releaseTime: '2024-12-03' },
  { id: '1.21.1', type: 'release', releaseTime: '2024-08-08' },
  { id: '1.21', type: 'release', releaseTime: '2024-06-13' },
  { id: '1.20.6', type: 'release', releaseTime: '2024-04-29' },
  { id: '1.20.1', type: 'release', releaseTime: '2023-06-12' },
  { id: '1.19.4', type: 'release', releaseTime: '2023-03-14' },
  { id: '1.18.2', type: 'release', releaseTime: '2022-02-28' },
  { id: '1.17.1', type: 'release', releaseTime: '2021-07-06' },
  { id: '1.16.5', type: 'release', releaseTime: '2021-01-14' },
  { id: '1.12.2', type: 'release', releaseTime: '2017-09-18' },
  { id: '1.8.9', type: 'release', releaseTime: '2015-12-09' },
  { id: '1.7.10', type: 'release', releaseTime: '2014-05-14' },
  { id: '25w46a', type: 'snapshot', releaseTime: '2025-11-12' },
  { id: '25w45a', type: 'snapshot', releaseTime: '2025-11-06' },
  { id: 'b1.7.3', type: 'old_beta', releaseTime: '2011-07-07' },
  { id: 'a1.2.6', type: 'old_alpha', releaseTime: '2010-10-30' },
];

export interface ManifestResult {
  versions: VersionInfo[];
  source: 'live' | 'fallback';
  fetchedAt: number;
  error?: string;
}

/** Тянет живой манифест Mojang. Если браузер/CORS не даёт — fallback-кэш. */
export async function fetchJavaManifest(): Promise<ManifestResult> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(JAVA_MANIFEST_URL, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const json = (await res.json()) as {
      versions: { id: string; type: string; releaseTime: string; url: string }[];
    };
    const map: Record<string, VersionInfo['type']> = {
      release: 'release',
      snapshot: 'snapshot',
      old_beta: 'old_beta',
      old_alpha: 'old_alpha',
    };
    const versions: VersionInfo[] = json.versions.map((v) => ({
      id: v.id,
      type: map[v.type] ?? 'snapshot',
      releaseTime: v.releaseTime.slice(0, 10),
      url: v.url,
    }));
    return { versions, source: 'live', fetchedAt: Date.now() };
  } catch (e) {
    return {
      versions: FALLBACK_JAVA_VERSIONS,
      source: 'fallback',
      fetchedAt: Date.now(),
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

// Bedrock распространяется только через официальные магазины.
export const BEDROCK_SOURCES = [
  { id: 'android', name: 'Android — Google Play', url: 'https://play.google.com/store/apps/details?id=com.mojang.minecraftpe' },
  { id: 'ios', name: 'iOS — App Store', url: 'https://apps.apple.com/app/minecraft/id479516143' },
  { id: 'win', name: 'Windows — Microsoft Store', url: 'https://www.microsoft.com/store/productId/9NBLGGH2JHXJ' },
  { id: 'other', name: 'Другие платформы — minecraft.net', url: 'https://www.minecraft.net/ru-ru/get-minecraft' },
] as const;
