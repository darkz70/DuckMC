// DuckMC — настройки: игра / лаунчер / авторизация / загрузки / о программе
import { useState } from 'react';
import type { Settings } from '../core/types';
import type { T } from '../i18n';
import { DEFAULT_SETTINGS } from '../core/config';

interface Props {
  t: T;
  settings: Settings;
  setSettings: (s: Settings) => void;
  toast: (msg: string, err?: boolean) => void;
}

type Section = 'game' | 'launcher' | 'auth' | 'downloads' | 'about';

export default function SettingsView(p: Props) {
  const t = p.t;
  const s = p.settings;
  const [sec, setSec] = useState<Section>('game');

  const patch = (fn: (draft: Settings) => void) => {
    const draft = structuredClone(s);
    fn(draft);
    p.setSettings(draft);
  };

  return (
    <>
      <h1 className="view-title">⚙️ {t('settings_title')}</h1>
      <p className="view-sub">DuckMC 0.1.0 · всё сохраняется на устройстве</p>

      <div className="set-grid">
        <div className="set-nav">
          {(
            [
              ['game', '🎮 ' + t('set_game')],
              ['launcher', '🦆 ' + t('set_launcher')],
              ['auth', '🔑 ' + t('set_auth')],
              ['downloads', '⬇️ ' + t('set_downloads')],
              ['about', 'ℹ️ ' + t('set_about')],
            ] as [Section, string][]
          ).map(([id, label]) => (
            <button key={id} className={'nav-item' + (sec === id ? ' active' : '')} onClick={() => setSec(id)}>
              {label}
            </button>
          ))}
        </div>

        <div>
          {sec === 'game' && (
            <div className="card">
              <h3>🎮 {t('set_game')}</h3>
              <div className="field">
                <label>🧠 {t('memory_mb')}: <b>{s.game.memoryMb}</b></label>
                <input
                  type="range"
                  min={1024}
                  max={16384}
                  step={512}
                  value={s.game.memoryMb}
                  onChange={(e) => patch((d) => (d.game.memoryMb = Number(e.target.value)))}
                />
              </div>
              <div className="field">
                <label>📐 {t('resolution')}</label>
                <div className="row">
                  <input
                    style={{ width: 110 }}
                    type="number"
                    value={s.game.fullWidth}
                    onChange={(e) => patch((d) => (d.game.fullWidth = Number(e.target.value) || 960))}
                  />
                  ×
                  <input
                    style={{ width: 110 }}
                    type="number"
                    value={s.game.fullHeight}
                    onChange={(e) => patch((d) => (d.game.fullHeight = Number(e.target.value) || 540))}
                  />
                  <label className="check-row" style={{ margin: 0 }}>
                    <input
                      type="checkbox"
                      checked={s.game.fullscreen}
                      onChange={(e) => patch((d) => (d.game.fullscreen = e.target.checked))}
                    />
                    {t('fullscreen')}
                  </label>
                </div>
              </div>
              <div className="field">
                <label>☕ {t('java_path')}</label>
                <input
                  type="text"
                  placeholder="/usr/bin/java или C:\Program Files\Java\bin\javaw.exe"
                  value={s.game.javaPath}
                  onChange={(e) => patch((d) => (d.game.javaPath = e.target.value))}
                />
                <span className="hint">{t('java_path_hint')}</span>
              </div>
              <div className="field">
                <label>🧾 {t('jvm_args')}</label>
                <input
                  type="text"
                  placeholder="-XX:+UseG1GC -Dsun.java2d.opengl=true"
                  value={s.game.jvmArgs}
                  onChange={(e) => patch((d) => (d.game.jvmArgs = e.target.value))}
                />
              </div>
              <div className="field">
                <label>📁 {t('game_dir')}</label>
                <input
                  type="text"
                  placeholder="(авто: ~/DuckMC/games)"
                  value={s.game.gameDir}
                  onChange={(e) => patch((d) => (d.game.gameDir = e.target.value))}
                />
              </div>
              <div className="field">
                <label>🎯 {t('default_edition')}</label>
                <select
                  value={s.game.defaultEdition}
                  onChange={(e) => patch((d) => (d.game.defaultEdition = e.target.value as Settings['game']['defaultEdition']))}
                >
                  <option value="java">☕ {t('edition_java')}</option>
                  <option value="bedrock">📱 {t('edition_bedrock')}</option>
                </select>
              </div>
            </div>
          )}

          {sec === 'launcher' && (
            <div className="card">
              <h3>🦆 {t('set_launcher')}</h3>
              <div className="field">
                <label>🌍 {t('language')}</label>
                <select
                  value={s.launcher.language}
                  onChange={(e) => patch((d) => (d.launcher.language = e.target.value as Settings['launcher']['language']))}
                >
                  <option value="ru">🇷🇺 Русский</option>
                  <option value="en">🇬🇧 English</option>
                </select>
              </div>
              <div className="field">
                <label>🎨 {t('theme')}</label>
                <select
                  value={s.launcher.theme}
                  onChange={(e) => patch((d) => (d.launcher.theme = e.target.value as Settings['launcher']['theme']))}
                >
                  <option value="light">☀️ {t('theme_light')}</option>
                  <option value="dark">🌙 {t('theme_dark')}</option>
                </select>
              </div>
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={s.launcher.closeAfterLaunch}
                  onChange={(e) => patch((d) => (d.launcher.closeAfterLaunch = e.target.checked))}
                />
                {t('close_after_launch')}
              </label>
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={s.launcher.checkUpdatesOnStart}
                  onChange={(e) => patch((d) => (d.launcher.checkUpdatesOnStart = e.target.checked))}
                />
                {t('check_updates')}
              </label>
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={s.launcher.discordRpc}
                  onChange={(e) => patch((d) => (d.launcher.discordRpc = e.target.checked))}
                />
                {t('discord_rpc')}
              </label>
            </div>
          )}

          {sec === 'auth' && (
            <div className="card">
              <h3>🔑 {t('set_auth')}</h3>
              <div className="field">
                <label>🌐 {t('auth_server_url')}</label>
                <input
                  type="text"
                  value={s.accounts.authServerUrl}
                  onChange={(e) => patch((d) => (d.accounts.authServerUrl = e.target.value))}
                />
                <span className="hint">
                  По умолчанию — authserver.ely.by. Если ваш сервер другой (например eby.by или собственный) — просто впишите его адрес: DuckMC совместим с любым authserver-провайдером.
                </span>
              </div>
              <div className="field">
                <label>🪟 {t('ms_client_id')}</label>
                <input
                  type="text"
                  placeholder="00000000-0000-0000-0000-000000000000"
                  value={s.accounts.microsoftClientId}
                  onChange={(e) => patch((d) => (d.accounts.microsoftClientId = e.target.value))}
                />
                <span className="hint">{t('ms_client_hint')}</span>
              </div>
              <div className="field">
                <label>⭐ {t('preferred_provider')}</label>
                <select
                  value={s.accounts.preferredProvider}
                  onChange={(e) => patch((d) => (d.accounts.preferredProvider = e.target.value as Settings['accounts']['preferredProvider']))}
                >
                  <option value="offline">🎮 {t('provider_offline')}</option>
                  <option value="elyby">🌐 {t('provider_elyby')}</option>
                  <option value="microsoft">🪟 {t('provider_microsoft')}</option>
                </select>
              </div>
            </div>
          )}

          {sec === 'downloads' && (
            <div className="card">
              <h3>⬇️ {t('set_downloads')}</h3>
              <div className="field">
                <label>📁 {t('install_dir')}</label>
                <input
                  type="text"
                  placeholder="(авто: ~/DuckMC/versions)"
                  value={s.downloads.installDir}
                  onChange={(e) => patch((d) => (d.downloads.installDir = e.target.value))}
                />
              </div>
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={s.downloads.verifyFiles}
                  onChange={(e) => patch((d) => (d.downloads.verifyFiles = e.target.checked))}
                />
                🧪 {t('verify_files')}
              </label>
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={s.downloads.torrentMirror}
                  onChange={(e) => patch((d) => (d.downloads.torrentMirror = e.target.checked))}
                />
                🌊 Зеркало для медленных соединений (план)
              </label>
            </div>
          )}

          {sec === 'about' && (
            <div className="card">
              <h3>ℹ️ {t('set_about')}</h3>
              <div className="row" style={{ gap: 18 }}>
                <img src="./logo.jpg" alt="DuckMC" style={{ width: 96, height: 96, borderRadius: 20, border: '3px solid var(--ink)' }} />
                <div>
                  <p style={{ fontWeight: 900, fontSize: 22, margin: 0 }}>DuckMC 0.1.0 «Quack»</p>
                  <p className="hint">
                    {t('about_license')} · Логотип: IMG_20261031_130628_458.jpg
                    <br />
                    Кроссплатформенный лаунчер Minecraft: Java + Bedrock.
                    <br />
                    Платформы: 🤖 Android (приоритет) · 🍎 iOS · 🪟 Windows · 🐧 Linux · 💻 macOS
                  </p>
                  <p className="hint">🗂 {t('about_roadmap')}: <code>docs/ROADMAP.md</code></p>
                </div>
              </div>
              <div className="row" style={{ marginTop: 14 }}>
                <button className="btn danger" onClick={() => { p.setSettings(structuredClone(DEFAULT_SETTINGS)); p.toast('♻️ ' + t('done')); }}>
                  {t('reset')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
