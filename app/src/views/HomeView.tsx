// DuckMC — главная: герой + запуск игры (стиль duckmcweb.vercel.app)
import { useMemo, type ReactNode } from 'react';
import type { Account, Edition, LaunchProgress, Settings, VersionInfo } from '../core/types';
import type { T } from '../i18n';
import { detectPlatform, platformLabel } from '../core/platform';
import { ProgressBar } from '../components/ui';
import {
  IconBedrock,
  IconCheckCircle,
  IconCompass,
  IconDownload,
  IconFlask,
  IconJava,
  IconKey,
  IconPlay,
  IconPlus,
  IconUser,
  IconX,
  IconZap,
  IconAlert,
  PlatformIcon,
} from '../components/icons';

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

  const phaseIcon = (phase: string): ReactNode => {
    switch (phase) {
      case 'preparing': return <IconCompass size={15} />;
      case 'account': return <IconKey size={15} />;
      case 'downloading': return <IconDownload size={15} />;
      case 'verifying': return <IconFlask size={15} />;
      case 'jvm': return <IconJava size={15} />;
      case 'running': return <IconZap size={15} />;
      case 'done': return <IconCheckCircle size={15} />;
      case 'error': return <IconAlert size={15} />;
      default: return <IconDownload size={15} />;
    }
  };

  return (
    <>
      {/* Герой */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-content">
            <span className="hero-kicker">{t('hero_kicker')}</span>
            <h1 className="hero-title">
              {t('hero_title_a')}
              <br />
              {t('hero_title_b')}
            </h1>
            <p className="lead">{t('hero_lead')}</p>

            <div className="edition-switch">
              <button className={'chip' + (p.edition === 'java' ? ' on' : '')} onClick={() => p.setEdition('java')}>
                <IconJava size={17} />
                <span>{t('label_java')}</span>
              </button>
              <button className={'chip' + (p.edition === 'bedrock' ? ' on' : '')} onClick={() => p.setEdition('bedrock')}>
                <IconBedrock size={17} />
                <span>{t('label_bedrock_short')}</span>
              </button>
            </div>

            <div className="launch-row">
              {p.edition === 'java' ? (
                <select
                  className="duck-select"
                  value={selVersion}
                  disabled={p.launchState.running}
                  onChange={(e) => p.setVersionJava(e.target.value)}
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
                {p.launchState.running ? (
                  <>
                    <span className="spinner" aria-hidden="true" />
                    <span>{t('playing')}</span>
                  </>
                ) : (
                  <>
                    <IconPlay size={20} />
                    <span>{t('play')}</span>
                  </>
                )}
              </button>
              {p.launchState.running && (
                <button className="btn danger" onClick={p.onCancel}>
                  <IconX size={16} />
                  <span>{t('cancel')}</span>
                </button>
              )}
            </div>

            {progress && (
              <ProgressBar
                percent={progress.percent}
                detail={
                  <>
                    {phaseIcon(progress.phase)}
                    <span>{progress.detail}</span>
                  </>
                }
                label={progress.phase === 'done' ? t('done') : progress.percent + '%'}
              />
            )}

            <div className="acc-hint">
              {active ? (
                <>
                  <IconUser size={16} />
                  <span>
                    <b>{active.nickname}</b> · {active.provider === 'microsoft' ? 'Microsoft' : active.provider === 'elyby' ? 'ely.by' : t('provider_offline')}
                  </span>
                </>
              ) : (
                <button className="btn small outline" onClick={p.goAccounts}>
                  <IconPlus size={15} />
                  <span>{t('add_account')}</span>
                </button>
              )}
            </div>
          </div>

          <div className="hero-visual">
            <div className="floating-card">
              <img className="fc-img" src="./logo.jpg" alt="DuckMC" />
              <div className="floating-label">DuckMC</div>
            </div>
            <div className="floating-card floating-card-2">
              <div className="floating-icon"><IconJava size={40} /></div>
              <div className="floating-label">{t('label_java')}</div>
            </div>
            <div className="floating-card floating-card-3">
              <div className="floating-icon"><IconBedrock size={40} /></div>
              <div className="floating-label">{t('label_bedrock_short')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Статистика */}
      <section style={{ marginTop: 40 }}>
        <h2 className="view-title" style={{ fontSize: '1.4rem' }}>{t('quick_stats')}</h2>
        <p className="view-sub">
          {t('your_platform')}: {platformLabel(platform)}
        </p>
        <div className="stat-grid">
          <div className="stat">
            <div className="v stat-ico"><PlatformIcon platform={platform} size={22} /><span>{platformLabel(platform)}</span></div>
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
          <p className="hint with-ico" style={{ marginTop: 14 }}>
            <PlatformIcon platform="android" size={16} />
            <span>{t('android_first')} — приоритетная платформа: сначала доводим до ума Android (Capacitor/PWA), затем iOS и десктопы.</span>
          </p>
        )}
      </section>
    </>
  );
}
