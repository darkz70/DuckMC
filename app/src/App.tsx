// DuckMC — корневой компонент: каркас, состояние, запуск игры
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Account, Edition, LaunchProgress, Settings, VersionInfo } from './core/types';
import { loadAccounts, loadSettings, saveAccounts, saveSettings } from './core/config';
import { detectPlatform, platformLabel, webAdapter } from './core/platform';
import { LaunchController } from './core/launch';
import { FALLBACK_JAVA_VERSIONS, fetchJavaManifest } from './core/versions';
import { makeT } from './i18n';
import HomeView from './views/HomeView';
import DownloadsView from './views/DownloadsView';
import AccountsView from './views/AccountsView';
import SettingsView from './views/SettingsView';
import { Toast } from './components/ui';
import { IconHome, IconDownload, IconMenu, IconUser, IconSliders, PlatformIcon } from './components/icons';
import Splash from './components/Splash';

type View = 'home' | 'downloads' | 'accounts' | 'settings';

export default function App() {
  const [view, setView] = useState<View>('home');
  const [menuOpen, setMenuOpen] = useState(false);
  const [settings, setSettingsState] = useState<Settings>(() => loadSettings());
  const [accounts, setAccountsState] = useState<Account[]>(() => loadAccounts());
  const [edition, setEdition] = useState<Edition>(settings.game.defaultEdition);
  const [javaVersions, setJavaVersions] = useState<VersionInfo[]>(FALLBACK_JAVA_VERSIONS);
  const [launch, setLaunch] = useState<{ running: boolean; progress: LaunchProgress | null }>({
    running: false,
    progress: null,
  });
  const [toastMsg, setToastMsg] = useState<{ text: string; err?: boolean } | null>(null);
  const controllerRef = useRef<LaunchController | null>(null);

  const t = useMemo(() => makeT(settings.launcher.language), [settings.launcher.language]);
  const platform = useMemo(detectPlatform, []);

  // тема
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.launcher.theme);
  }, [settings.launcher.theme]);

  // живой манифест версий (мягко, с fallback)
  useEffect(() => {
    let alive = true;
    fetchJavaManifest().then((r) => alive && setJavaVersions(r.versions));
    return () => {
      alive = false;
    };
  }, []);

  const toast = useCallback((text: string, err?: boolean) => {
    setToastMsg({ text, err });
    window.setTimeout(() => setToastMsg(null), err ? 6000 : 3500);
  }, []);

  const setSettings = useCallback((s: Settings) => {
    setSettingsState(s);
    saveSettings(s);
  }, []);

  const setAccounts = useCallback((a: Account[]) => {
    setAccountsState(a);
    saveAccounts(a);
  }, []);

  const onPlay = useCallback(() => {
    const active = accounts.find((a) => a.active);
    const ctl = new LaunchController();
    controllerRef.current = ctl;
    setLaunch({ running: true, progress: { phase: 'preparing', percent: 0, detail: '…' } });
    void ctl.launch(
      {
        edition,
        version: null,
        account: active ?? null,
        settings,
        adapter: webAdapter,
      },
      {
        onProgress: (pr) => setLaunch((old) => ({ ...old, progress: pr })),
        onDone: (ok, msg) => {
          setLaunch({ running: false, progress: null });
          toast(msg, !ok);
        },
      },
    );
  }, [accounts, edition, settings, toast]);

  const onCancel = useCallback(() => {
    controllerRef.current?.cancel();
  }, []);

  const navItems: [View, typeof IconHome, string][] = [
    ['home', IconHome, t('nav_home')],
    ['downloads', IconDownload, t('nav_downloads')],
    ['accounts', IconUser, t('nav_accounts')],
    ['settings', IconSliders, t('nav_settings')],
  ];

  const go = (v: View) => {
    setView(v);
    setMenuOpen(false);
  };

  return (
    <div className="app">
      <nav className="navbar">
        <div className="container nav-inner">
          <button className="logo" onClick={() => go('home')} aria-label="DuckMC">
            <img src="./logo.jpg" alt="DuckMC" className="logo-img" />
            <span className="logo-text">DuckMC</span>
          </button>
          <div className={'nav-links' + (menuOpen ? ' open' : '')}>
            {navItems.map(([id, Ico, label]) => (
              <button key={id} className={'nav-link' + (view === id ? ' active' : '')} onClick={() => go(id)}>
                <Ico size={17} />
                <span>{label}</span>
              </button>
            ))}
            <span className="nav-chip">
              <PlatformIcon platform={platform} size={15} />
              <span>{platformLabel(platform)} · v0.1.0</span>
            </span>
          </div>
          <button className="nav-toggle" onClick={() => setMenuOpen((o) => !o)} aria-label="Меню">
            <IconMenu size={22} />
          </button>
        </div>
      </nav>

      <main className="content">
        <div className="container">
        {view === 'home' && (
          <HomeView
            t={t}
            settings={settings}
            accounts={accounts}
            edition={edition}
            setEdition={setEdition}
            javaVersions={javaVersions}
            launchState={launch}
            onPlay={onPlay}
            onCancel={onCancel}
            goAccounts={() => setView('accounts')}
            goDownloads={() => setView('downloads')}
            setVersionJava={(v) => setSettings({ ...settings, game: { ...settings.game, defaultVersionJava: v } })}
            setVersionBedrock={(v) => setSettings({ ...settings, game: { ...settings.game, defaultVersionBedrock: v } })}
          />
        )}
        {view === 'downloads' && (
          <DownloadsView
            t={t}
            settings={settings}
            openExternal={(u) => webAdapter.openExternal(u)}
            onInstalled={(id) =>
              setSettings({ ...settings, installedJava: settings.installedJava.includes(id) ? settings.installedJava : [...settings.installedJava, id] })
            }
          />
        )}
        {view === 'accounts' && (
          <AccountsView t={t} accounts={accounts} settings={settings} onSaveAccounts={setAccounts} toast={toast} />
        )}
        {view === 'settings' && <SettingsView t={t} settings={settings} setSettings={setSettings} toast={toast} />}
        </div>
      </main>

      {toastMsg && <Toast text={toastMsg.text} error={toastMsg.err} />}
      <Splash />
    </div>
  );
}
