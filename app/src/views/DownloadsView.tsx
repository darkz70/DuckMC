// DuckMC — вкладка скачивания версий
import { useEffect, useMemo, useState } from 'react';
import type { Settings, VersionInfo, VersionType } from '../core/types';
import type { T } from '../i18n';
import { fetchJavaManifest, BEDROCK_SOURCES, type ManifestResult } from '../core/versions';
import { ProgressBar } from '../components/ui';
import {
  IconBedrock,
  IconCalendar,
  IconCheck,
  IconDownload,
  IconExternal,
  IconJava,
  IconLock,
} from '../components/icons';

type Filter = 'all' | 'release' | 'snapshot' | 'old';

interface Props {
  t: T;
  settings: Settings;
  onInstalled: (id: string) => void; // пометить установленной
  openExternal: (url: string) => void;
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

export default function DownloadsView(p: Props) {
  const t = p.t;
  const [tab, setTab] = useState<'java' | 'bedrock'>('java');
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [manifest, setManifest] = useState<ManifestResult | null>(null);
  const [installing, setInstalling] = useState<{ id: string; percent: number } | null>(null);

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

  const simulateInstall = (v: VersionInfo) => {
    if (installing) return;
    setInstalling({ id: v.id, percent: 0 });
    let pct = 0;
    const timer = setInterval(() => {
      pct += Math.random() * 18 + 6;
      if (pct >= 100) {
        clearInterval(timer);
        setInstalling(null);
        p.onInstalled(v.id);
      } else {
        setInstalling({ id: v.id, percent: pct });
      }
    }, 260);
  };

  return (
    <>
      <h1 className="view-title">
        <IconDownload size={26} />
        <span>{t('downloads_title')}</span>
      </h1>
      <p className="view-sub">
        {manifest?.source === 'live' ? t('source_live') : t('source_fallback')}
      </p>

      <div className="edition-switch" style={{ marginBottom: 16 }}>
        <button className={tab === 'java' ? 'on' : ''} onClick={() => setTab('java')}>
          <IconJava size={17} />
          <span>{t('label_java')}</span>
        </button>
        <button className={tab === 'bedrock' ? 'on' : ''} onClick={() => setTab('bedrock')}>
          <IconBedrock size={17} />
          <span>{t('label_bedrock_short')}</span>
        </button>
      </div>

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

          {!manifest && <p className="hint">⏳ Загружаем манифест…</p>}

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
                  <span className="date with-ico"><IconCalendar size={13} /> {v.releaseTime}</span>
                  {isInstalled ? (
                    <span className="badge installed with-ico"><IconCheck size={12} /> {t('installed')}</span>
                  ) : isInstalling ? (
                    <ProgressBar percent={installing.percent} detail={t('installing')} label={Math.round(installing.percent) + '%'} />
                  ) : (
                    <button className="btn primary small" onClick={() => simulateInstall(v)} disabled={!!installing}>
                      <IconDownload size={15} />
                      <span>{t('install')}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          {filtered.length === 0 && manifest && <p className="hint">Ничего не найдено</p>}
        </>
      )}

      {tab === 'bedrock' && (
        <div className="card">
          <h3><IconLock size={18} /> {t('bedrock_note_title')}</h3>
          <p className="hint">{t('bedrock_note')}</p>
          <div className="ver-list" style={{ marginTop: 12 }}>
            {BEDROCK_SOURCES.map((s) => (
              <div className="ver-card" key={s.id}>
                <div className="top">
                  <span className="id">{s.name}</span>
                </div>
                <button className="btn diamond small" onClick={() => p.openExternal(s.url)}>
                  <IconExternal size={15} />
                  <span>Открыть магазин</span>
                </button>
              </div>
            ))}
          </div>
          <p className="hint" style={{ marginTop: 12 }}>
            На Android DuckMC в будущем сможет обнаруживать уже установленную игру (через PackageManager) и запускать её напрямую.
          </p>
        </div>
      )}
    </>
  );
}
