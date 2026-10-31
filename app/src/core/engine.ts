// DuckMC — реальный движок загрузки Java Edition.
// Работает напрямую с официальными серверами Mojang:
//   piston-meta.mojang.com (метаданные), piston-data.mojang.com (клиент),
//   libraries.minecraft.net (библиотеки), resources.download.minecraft.net (ассеты).
// Это та же схема, что у Prism/MultiMC: качаем только с серверов Mojang
// и проверяем каждый файл по SHA-1.

import type { VersionInfo } from './types';

export interface EngineTask {
  url: string;
  label: string;
  size: number;
  sha1?: string;
  kind: 'client' | 'library' | 'asset-index' | 'asset';
}

export interface ResolveResult {
  ok: boolean;
  tasks: EngineTask[];
  totalBytes: number;
  error?: string;
}

interface Artifact {
  url: string;
  size: number;
  sha1: string;
  id?: string;
}
interface LibRule {
  action: 'allow' | 'deny';
  os?: { name?: string };
}
interface VersionMeta {
  downloads?: { client?: Artifact };
  libraries?: { rules?: LibRule[]; downloads?: { artifact?: Artifact } }[];
  assetIndex?: Artifact;
}

export function currentOs(): 'windows' | 'osx' | 'linux' | 'unknown' {
  const ua = navigator.userAgent;
  if (/Windows/i.test(ua)) return 'windows';
  if (/Mac OS X|Macintosh/i.test(ua)) return 'osx';
  if (/Linux|Android/i.test(ua) && !/Windows/i.test(ua)) return 'linux';
  return 'unknown';
}

/** Оценка rules из version JSON: последнее совпавшее правило побеждает. */
function ruleAllows(rules: LibRule[] | undefined, os: string): boolean {
  if (!rules || rules.length === 0) return true;
  let allowed = true;
  for (const r of rules) {
    if (!r.os || r.os.name === os) {
      allowed = r.action === 'allow';
    }
  }
  return allowed;
}

function shortName(url: string): string {
  return url.split('/').pop() ?? url;
}

/**
 * Строит полный список файлов версии из её метаданных.
 * includeAssets: тянуть ли объекты ассетов (звуки/языковые пакеты — до ~400 МБ).
 */
export async function resolveJavaTasks(version: VersionInfo, includeAssets: boolean): Promise<ResolveResult> {
  try {
    if (!version.url) {
      return { ok: false, tasks: [], totalBytes: 0, error: 'Версия из офлайн-кэша — нет ссылки на метаданные' };
    }
    const res = await fetch(version.url);
    if (!res.ok) return { ok: false, tasks: [], totalBytes: 0, error: 'HTTP ' + res.status + ' у метаданных версии' };
    const meta = (await res.json()) as VersionMeta;
    const os = currentOs();
    const tasks: EngineTask[] = [];

    // 1. Клиент
    if (meta.downloads?.client) {
      const c = meta.downloads.client;
      tasks.push({ url: c.url, label: 'client.jar', size: c.size, sha1: c.sha1, kind: 'client' });
    }

    // 2. Библиотеки (с учётом rules под текущую ОС)
    for (const lib of meta.libraries ?? []) {
      const a = lib.downloads?.artifact;
      if (!a || !ruleAllows(lib.rules, os)) continue;
      tasks.push({ url: a.url, label: shortName(a.url), size: a.size, sha1: a.sha1, kind: 'library' });
    }

    // 3. Индекс ассетов
    if (meta.assetIndex) {
      tasks.push({
        url: meta.assetIndex.url,
        label: `assets-index (${meta.assetIndex.id ?? 'legacy'})`,
        size: meta.assetIndex.size,
        sha1: meta.assetIndex.sha1,
        kind: 'asset-index',
      });

      // 4. Сами ассеты (опционально — их много и они тяжёлые)
      if (includeAssets) {
        const idxRes = await fetch(meta.assetIndex.url);
        if (idxRes.ok) {
          const idx = (await idxRes.json()) as { objects: Record<string, { hash: string; size: number }> };
          for (const [name, obj] of Object.entries(idx.objects)) {
            tasks.push({
              url: `https://resources.download.minecraft.net/${obj.hash.slice(0, 2)}/${obj.hash}`,
              label: 'assets/' + name,
              size: obj.size,
              sha1: obj.hash,
              kind: 'asset',
            });
          }
        }
      }
    }

    const totalBytes = tasks.reduce((s, t) => s + t.size, 0);
    return { ok: true, tasks, totalBytes };
  } catch (e) {
    return { ok: false, tasks: [], totalBytes: 0, error: e instanceof Error ? e.message : String(e) };
  }
}

export interface DownloadFileResult {
  ok: boolean;
  received: number;
  hashOk?: boolean;
  error?: string;
}

/** Скачивает один файл потоком, рапортуя прогресс по байтам, и проверяет SHA-1. */
export async function downloadFile(
  task: EngineTask,
  signal: AbortSignal,
  onChunk: (receivedDelta: number) => void,
): Promise<DownloadFileResult> {
  try {
    const res = await fetch(task.url, { signal });
    if (!res.ok || !res.body) return { ok: false, received: 0, error: 'HTTP ' + res.status };
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let received = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        received += value.byteLength;
        onChunk(value.byteLength);
      }
    }
    const buf = concatChunks(chunks, received);
    if (task.sha1) {
      const digest = await crypto.subtle.digest('SHA-1', buf);
      const hex = Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      return { ok: true, received, hashOk: hex === task.sha1 };
    }
    return { ok: true, received };
  } catch (e) {
    return { ok: false, received: 0, error: e instanceof Error ? e.message : String(e) };
  }
}

function concatChunks(chunks: Uint8Array[], total: number): ArrayBuffer {
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    out.set(c, off);
    off += c.byteLength;
  }
  return out.buffer;
}

export function fmtBytes(n: number): string {
  if (n >= 1073741824) return (n / 1073741824).toFixed(2) + ' ГБ';
  if (n >= 1048576) return (n / 1048576).toFixed(1) + ' МБ';
  if (n >= 1024) return (n / 1024).toFixed(0) + ' КБ';
  return n + ' Б';
}
