// DuckMC — корневой компонент: каркас, состояние, запуск игры
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Account, Edition, LaunchProgress, Settings, VersionInfo } from './core/types';
import { loadAccounts, loadSettings, saveAccounts, saveSettings } from './core/config';
import { detectPlatform, platformIcon, platformLabel, webAdapter } from './core/platform';
import { LaunchController } from './core/launch';
import { FALLBACK_JAVA_VERSIONS, fetchJavaManifest } from './core/versions';
import { makeT } from './i18n';
import HomeView from './views/HomeView';
import DownloadsView from './views/DownloadsView';
import AccountsView from './views/AccountsView';
import SettingsView from './views/SettingsView';
import { Toast } from './components/ui';
import Splash from './components/Splash';

type View = 'home' | 'downloads' | 'accounts' | 'settings';

export default function App() {
  const [view, setView] = useState<View>('home');
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
          toast(ok ? '🎉 ' + msg : '⚠️ ' + msg, !ok);
        },
      },
    );
  }, [accounts, edition, settings, toast]);

  const onCancel = useCallback(() => {
    controllerRef.current?.cancel();
  }, []);

  const navItems: [View, string, string][] = [
    ['home', '🏠', t('nav_home')],
    ['downloads', '⬇️', t('nav_downloads')],
    ['accounts', '👤', t('nav_accounts')],
    ['settings', '⚙️', t('nav_settings')],
  ];

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <img src="./logo.jpg" alt="DuckMC" />
          <span className="name">DuckMC</span>
          <span className="quack">кря-кря! 🦆</span>
        </div>
        {navItems.map(([id, ico, label]) => (
          <button key={id} className={'nav-item' + (view === id ? ' active' : '')} onClick={() => setView(id)}>
            <span className="ico">{ico}</span>
            <span>{label}</span>
          </button>
        ))}
        <div className="platform-chip">
          {platformIcon(platform)} {platformLabel(platform)}
          <br />
          <b>DuckMC 0.1.0 «Quack»</b>
        </div>
      </aside>

      <main className="content">
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
      </main>

      {toastMsg && <Toast text={toastMsg.text} error={toastMsg.err} />}
      <Splash />
    </div>
  );
}
