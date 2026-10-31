// DuckMC — главная: запуск игры
import { useMemo } from 'react';
import type { Account, Edition, LaunchProgress, Settings, VersionInfo } from '../core/types';
import type { T } from '../i18n';
import { platformIcon, platformLabel, detectPlatform } from '../core/platform';
import { ProgressBar } from '../components/ui';

interface Props {
  t: T;
  settings: Settings;
  accounts: Account[];
  edition: Edition;
  setEdition: (e: Edition) => void;
  javaVersions: VersionInfo[];
  launchState: { running: boolean; progress: LaunchProgress | null };
  onPlay: () => void;
  onCancel: () => void;
  goAccounts: () => void;
  goDownloads: () => void;
  setVersionJava: (v: string) => void;
  setVersionBedrock: (v: string) => void;
}

export default function HomeView(p: Props) {
  const t = p.t;
  const platform = useMemo(detectPlatform, []);
  const active = p.accounts.find((a) => a.active) ?? null;
  const versions = p.edition === 'java' ? p.javaVersions.filter((v) => v.type === 'release') : [];
  const selVersion = p.edition === 'java' ? p.settings.game.defaultVersionJava : p.settings.game.defaultVersionBedrock;
  const progress = p.launchState.progress;

  const installedCount = p.settings.installedJava.length;

  const phaseIcon = (phase: string): string => {
    switch (phase) {
      case 'preparing': return '🧭';
      case 'account': return '🔑';
      case 'downloading': return '⬇️';
      case 'verifying': return '🧪';
      case 'jvm': return '☕';
      case 'running': return '🚀';
      case 'done': return '✅';
      case 'error': return '💥';
      case 'cancelled': return '✋';
      default: return '🦆';
    }
  };

  return (
    <>
      <h1 className="view-title">🦆 {t('nav_home')}</h1>
      <p className="view-sub">{t('home_tagline')}</p>

      <div className="card">
        <div className="hero">
          <img className="hero-logo" src="./logo.jpg" alt="DuckMC" />
          <div className="hero-main">
            <div className="big-name">DuckMC</div>
            <div className="tagline">
              {t('edition_java')} + {t('edition_bedrock')} · Windows · {t('android_first')} 🤖 · iOS · Linux · macOS
            </div>

            <div className="edition-switch">
              <button className={p.edition === 'java' ? 'on' : ''} onClick={() => p.setEdition('java')}>
                ☕ {t('edition_java')}
              </button>
              <button className={p.edition === 'bedrock' ? 'on' : ''} onClick={() => p.setEdition('bedrock')}>
                📱 {t('edition_bedrock')}
              </button>
            </div>

            <div className="launch-row">
              {p.edition === 'java' ? (
                <select
                  className="duck-select"
                  value={selVersion}
                  disabled={p.launchState.running}
                  onChange={(e) => {
                    p.setVersionJava(e.target.value);
                  }}
                >
                  {versions.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.id}
                    </option>
                  ))}
                  {!versions.find((v) => v.id === selVersion) && selVersion && (
                    <option value={selVersion}>{selVersion}</option>
                  )}
                </select>
              ) : (
                <select className="duck-select" value={selVersion} disabled>
                  <option value="latest">{t('edition_bedrock')}: latest</option>
                </select>
              )}

              <button
                className={'btn-play' + (p.edition === 'bedrock' ? ' bedrock' : '') + (p.launchState.running ? ' busy' : '')}
                onClick={p.launchState.running ? undefined : p.onPlay}
                disabled={p.launchState.running}
              >
                {p.launchState.running ? '🦆 ' + t('playing') : '▶ ' + t('play')}
              </button>
              {p.launchState.running && (
                <button className="btn danger" onClick={p.onCancel}>
                  ✖ {t('cancel')}
                </button>
              )}
            </div>

            <div style={{ marginTop: 14 }}>
              {active ? (
                <span className="hint">
                  👤 <b>{active.nickname}</b> · {active.provider === 'microsoft' ? 'Microsoft' : active.provider === 'elyby' ? 'ely.by' : t('provider_offline')}
                </span>
              ) : (
                <button className="btn small" onClick={p.goAccounts}>
                  ➕ {t('add_account')}
                </button>
              )}
            </div>
          </div>
        </div>

        {progress && (
          <ProgressBar
            percent={progress.percent}
            detail={phaseIcon(progress.phase) + ' ' + progress.detail}
            label={progress.phase === 'done' ? t('done') : progress.percent + '%'}
          />
        )}
      </div>

      <div className="card">
        <h3>📊 {t('quick_stats')}</h3>
        <div className="stat-grid">
          <div className="stat">
            <div className="v">{platformIcon(platform)} {platformLabel(platform)}</div>
            <div className="k">{t('your_platform')}</div>
          </div>
          <div className="stat">
            <div className="v">{installedCount}</div>
            <div className="k">{t('installed_versions')}</div>
          </div>
          <div className="stat">
            <div className="v">{p.accounts.length}</div>
            <div className="k">{t('accounts_count')}</div>
          </div>
          <div className="stat">
            <div className="v">{(p.settings.game.memoryMb / 1024).toFixed(0)} ГБ</div>
            <div className="k">{t('memory')}</div>
          </div>
        </div>
        {platform !== 'android' && (
          <p className="hint" style={{ marginTop: 12 }}>
            🤖 {t('android_first')} — приоритетная платформа: сначала доводим до ума Android (Capacitor/PWA), затем iOS и десктопы.
          </p>
        )}
      </div>

      <div className="card">
        <h3>⬇️ {t('nav_downloads')}</h3>
        <p className="hint">
          {t('source_fallback')} — <button className="btn small" onClick={p.goDownloads}>{t('nav_downloads')}</button>
        </p>
      </div>
    </>
  );
}
