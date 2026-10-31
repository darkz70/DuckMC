// DuckMC — вкладка скачивания: реальная загрузка Java с серверов Mojang
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Settings, VersionInfo, VersionType } from '../core/types';
import type { T } from '../i18n';
import { fetchJavaManifest, BEDROCK_SOURCES, type ManifestResult } from '../core/versions';
import { ProgressBar } from '../components/ui';
import EditionCards from '../components/EditionCards';
import { bedrockStatus, DuckMCNative, isNative, nativeErrorText } from '../core/native';
import {
  downloadFile,
  fmtBytes,
  resolveJavaTasks,
  type EngineTask,
} from '../core/engine';
import {
  IconCalendar,
  IconCheck,
  IconCheckCircle,
  IconDownload,
  IconExternal,
  IconLock,
  IconPlay,
  IconX,
} from '../components/icons';

type Filter = 'all' | 'release' | 'snapshot' | 'old';

interface Props {
  t: T;
  settings: Settings;
  onInstalled: (id: string) => void;
  openExternal: (url: string) => void;
  toast: (msg: string, err?: boolean) => void;
}

const badgeName = (ty: VersionType, t: T): string => {
  switch (ty) {
    case 'release': return t('filter_release');
    case 'snapshot': return t('filter_snapshot');
    case 'old_beta': return 'Beta';
    case 'old_alpha': return 'Alpha';
    default: return 'Bedrock';
  }
};

interface InstallState {
  id: string;
  percent: number;
  status: string;
  fileIdx: number;
  fileCount: number;
}

export default function DownloadsView(p: Props) {
  const t = p.t;
  const [tab, setTab] = useState<'java' | 'bedrock'>('java');
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [manifest, setManifest] = useState<ManifestResult | null>(null);
  const [installing, setInstalling] = useState<InstallState | null>(null);
  const [includeAssets, setIncludeAssets] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const [brStatus, setBrStatus] = useState<{ installed: boolean; version: string } | null>(null);

  useEffect(() => {
    bedrockStatus().then((st) => st && setBrStatus(st));
  }, []);

  useEffect(() => {
    let alive = true;
    fetchJavaManifest().then((r) => alive && setManifest(r));
    return () => {
      alive = false;
    };
  }, []);

  const versions = manifest?.versions ?? [];
  const filtered = useMemo(() => {
    let list = versions;
    if (filter === 'release') list = list.filter((v) => v.type === 'release');
    else if (filter === 'snapshot') list = list.filter((v) => v.type === 'snapshot');
    else if (filter === 'old') list = list.filter((v) => v.type === 'old_beta' || v.type === 'old_alpha');
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((v) => v.id.toLowerCase().includes(q));
    return list.slice(0, 200);
  }, [versions, filter, query]);

  /** Демо-установка для версий из офлайн-кэша (нет метаданных) */
  const simulateInstall = (v: VersionInfo) => {
    if (installing) return;
    setInstalling({ id: v.id, percent: 0, status: t('dl_offline_sim'), fileIdx: 0, fileCount: 0 });
    let pct = 0;
    const timer = setInterval(() => {
      pct += Math.random() * 18 + 6;
      if (pct >= 100) {
        clearInterval(timer);
        setInstalling(null);
        p.onInstalled(v.id);
      } else {
        setInstalling({ id: v.id, percent: pct, status: t('dl_offline_sim'), fileIdx: 0, fileCount: 0 });
      }
    }, 260);
  };

  /** Реальная загрузка с серверов Mojang: метаданные → файлы → SHA-1 */
  const realInstall = async (v: VersionInfo) => {
    if (installing) return;
    const ctl = new AbortController();
    abortRef.current = ctl;
    setInstalling({ id: v.id, percent: 0, status: t('dl_resolving'), fileIdx: 0, fileCount: 0 });

    const resolved = await resolveJavaTasks(v, includeAssets);
    if (!resolved.ok) {
      setInstalling(null);
      p.toast(resolved.error ?? t('dl_error'), true);
      return;
    }
    const tasks: EngineTask[] = resolved.tasks;
    const total = resolved.totalBytes || 1;
    let done = 0;
    let hashFails = 0;
    let netFails = 0;

    for (let i = 0; i < tasks.length; i++) {
      if (ctl.signal.aborted) {
        setInstalling(null);
        p.toast(t('dl_cancelled'), true);
        return;
      }
      const task = tasks[i];
      setInstalling({
        id: v.id,
        percent: (done / total) * 100,
        status: `${task.label} · ${fmtBytes(task.size)}`,
        fileIdx: i + 1,
        fileCount: tasks.length,
      });
      const r = await downloadFile(task, ctl.signal, (delta) => {
        done += delta;
        setInstalling({
          id: v.id,
          percent: (done / total) * 100,
          status: `${task.label} · ${fmtBytes(task.size)}`,
          fileIdx: i + 1,
          fileCount: tasks.length,
        });
      });
      if (!r.ok) {
        netFails++;
        if (ctl.signal.aborted) {
          setInstalling(null);
          p.toast(t('dl_cancelled'), true);
          return;
        }
        continue;
      }
      if (r.hashOk === false) hashFails++;
    }

    setInstalling(null);
    abortRef.current = null;
    p.onInstalled(v.id);
    if (netFails === 0) {
      p.toast(
        `${v.id}: ${fmtBytes(done)}, SHA-1 OK (${tasks.length})` +
          (hashFails ? ` · ${t('dl_hash_warn')}: ${hashFails}` : ''),
      );
    } else {
      p.toast(`${v.id}: ${t('dl_partial')} (${netFails})`, true);
    }
  };

  const cancelInstall = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setInstalling(null);
  };

  return (
    <>
      <h1 className="view-title">
        <IconDownload size={26} />
        <span>{t('downloads_title')}</span>
      </h1>
      <p className="view-sub">
        {manifest?.source === 'live'
          ? t('source_live') + ' · ' + t('dl_engine_note')
          : t('source_fallback')}
      </p>

      <EditionCards
        t={t}
        compact
        edition={tab}
        disabled={!!installing}
        onChange={(e) => setTab(e)}
      />

      {tab === 'java' && (
        <>
          <div className="dl-toolbar">
            <input type="text" placeholder={t('search_placeholder')} value={query} onChange={(e) => setQuery(e.target.value)} />
            <div className="chip-row">
              {(['all', 'release', 'snapshot', 'old'] as Filter[]).map((f) => (
                <button key={f} className={'chip' + (filter === f ? ' on' : '')} onClick={() => setFilter(f)}>
                  {t('filter_' + f)}
                </button>
              ))}
            </div>
          </div>

          <label className="check-row" style={{ marginTop: 0 }}>
            <input type="checkbox" checked={includeAssets} onChange={(e) => setIncludeAssets(e.target.checked)} disabled={!!installing} />
            {t('dl_assets_opt')}
          </label>

          {!manifest && <p className="hint">...</p>}

          <div className="ver-list">
            {filtered.map((v) => {
              const isInstalled = p.settings.installedJava.includes(v.id);
              const isInstalling = installing?.id === v.id;
              return (
                <div className="ver-card" key={v.id}>
                  <div className="top">
                    <span className="id">{v.id}</span>
                    <span className={'badge ' + v.type}>{badgeName(v.type, t)}</span>
                  </div>
                  <span className="date with-ico">
                    <IconCalendar size={13} /> {v.releaseTime}
                  </span>
                  {isInstalled ? (
                    <span className="badge installed with-ico">
                      <IconCheck size={12} /> {t('installed')}
                    </span>
                  ) : isInstalling ? (
                    <>
                      <ProgressBar percent={installing.percent} detail={installing.status} label={Math.round(installing.percent) + '%'} />
                      {installing.fileCount > 0 && (
                        <span className="date">
                          {installing.fileIdx} / {installing.fileCount}
                        </span>
                      )}
                      <button className="btn danger small" onClick={cancelInstall}>
                        <IconX size={14} />
                        <span>{t('cancel')}</span>
                      </button>
                    </>
                  ) : (
                    <button
                      className="btn primary small"
                      onClick={() => (v.url ? void realInstall(v) : simulateInstall(v))}
                      disabled={!!installing}
                    >
                      <IconDownload size={15} />
                      <span>{t('install')}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          {filtered.length === 0 && manifest && <p className="hint">...</p>}
        </>
      )}

      {tab === 'bedrock' && (
        <>
          <div className="card">
            <h3>
              <IconPlay size={18} /> {t('edition_bedrock')}
            </h3>

            {brStatus ? (
              <div className="br-status with-ico" style={{ marginBottom: 14 }}>
                {brStatus.installed ? <IconCheckCircle size={18} /> : <IconLock size={18} />}
                <span>
                  {brStatus.installed
                    ? `${t('br_installed')}${brStatus.version ? ' · v' + brStatus.version : ''}`
                    : t('br_not_installed')}
                </span>
              </div>
            ) : (
              <p className="hint" style={{ marginBottom: 14 }}>{t('br_native_only')}</p>
            )}

            <div className="row">
              {isNative() && (
                <button
                  className="btn primary"
                  onClick={() =>
                    DuckMCNative.launchBedrock().catch((e) => p.toast(nativeErrorText(e.message ?? String(e)), true))
                  }
                >
                  <IconPlay size={16} />
                  <span>{t('br_launch')}</span>
                </button>
              )}
              <button
                className="btn diamond"
                onClick={() => {
                  if (isNative()) {
                    DuckMCNative.openStore({}).catch(() => p.openExternal(BEDROCK_SOURCES[0].url));
                  } else {
                    p.openExternal(BEDROCK_SOURCES[0].url);
                  }
                }}
              >
                <IconExternal size={16} />
                <span>{t('br_install_store')}</span>
              </button>
              {isNative() && (
                <>
                  <button
                    className="btn"
                    onClick={() =>
                      DuckMCNative.pickApkAndInstall()
                        .then(() => p.toast(t('br_install_started')))
                        .catch((e) => p.toast(nativeErrorText(e.message ?? String(e)), true))
                    }
                  >
                    <IconDownload size={16} />
                    <span>{t('br_apk_pick')}</span>
                  </button>
                  <button
                    className="btn"
                    onClick={() =>
                      DuckMCNative.pickAddonAndImport()
                        .then(() => p.toast(t('br_addon_started')))
                        .catch((e) => p.toast(nativeErrorText(e.message ?? String(e)), true))
                    }
                  >
                    <IconExternal size={16} />
                    <span>{t('br_addon_pick')}</span>
                  </button>
                </>
              )}
            </div>

            <p className="hint" style={{ marginTop: 12 }}>{t('br_secure_note')}</p>
          </div>

          <div className="card">
            <h3>
              <IconLock size={18} /> {t('dl_mirror_warn_title')}
            </h3>
            <p className="hint">{t('dl_mirror_warn')}</p>
          </div>

          <div className="ver-list">
            {BEDROCK_SOURCES.map((s) => (
              <div className="ver-card" key={s.id}>
                <div className="top">
                  <span className="id">{s.name}</span>
                </div>
                <button className="btn diamond small" onClick={() => p.openExternal(s.url)}>
                  <IconExternal size={15} />
                  <span>{t('dl_open_store')}</span>
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
