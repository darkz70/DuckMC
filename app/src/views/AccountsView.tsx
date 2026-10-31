// DuckMC — аккаунты: Microsoft, ely.by (или совместимый сервер), оффлайн
import { useEffect, useRef, useState } from 'react';
import type { Account, AuthProviderId, Settings } from '../core/types';
import type { T } from '../i18n';
import {
  loginOffline,
  loginAuthServer,
  startMicrosoftLogin,
  pollMicrosoftToken,
  providerLabel,
  avatarUrl,
  type AuthResponse,
  type DeviceCodeInfo,
} from '../core/auth';
import { Modal } from '../components/ui';

interface Props {
  t: T;
  accounts: Account[];
  settings: Settings;
  onSaveAccounts: (a: Account[]) => void;
  toast: (msg: string, err?: boolean) => void;
}

export default function AccountsView(p: Props) {
  const t = p.t;
  const [adding, setAdding] = useState(false);
  const [prov, setProv] = useState<AuthProviderId>(p.settings.accounts.preferredProvider);

  useEffect(() => {
    if (adding) setProv(p.settings.accounts.preferredProvider);
  }, [adding]);

  const activate = (id: string) => {
    p.onSaveAccounts(p.accounts.map((a) => ({ ...a, active: a.id === id })));
  };
  const remove = (id: string) => {
    const rest = p.accounts.filter((a) => a.id !== id);
    if (rest.length && !rest.some((a) => a.active)) rest[0].active = true;
    p.onSaveAccounts(rest);
  };

  return (
    <>
      <h1 className="view-title">👤 {t('accounts_title')}</h1>
      <p className="view-sub">Microsoft · ely.by / совместимые (URL настраивается) · Оффлайн</p>

      {p.accounts.length === 0 && (
        <div className="card">
          <p className="hint">{t('accounts_empty')}</p>
        </div>
      )}

      <div className="acc-grid">
        {p.accounts.map((a) => (
          <div key={a.id} className={'acc-card' + (a.active ? ' active-acc' : '')}>
            <img src={avatarUrl(a)} alt="" onError={(e) => ((e.target as HTMLImageElement).style.visibility = 'hidden')} />
            <div className="info">
              <div className="nick">{a.active ? '★ ' : ''}{a.nickname}</div>
              <div className="prov">{providerLabel(a.provider)} · {a.uuid.slice(0, 8)}…</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {!a.active && (
                <button className="btn small primary" onClick={() => activate(a.id)}>
                  {t('make_active')}
                </button>
              )}
              <button className="btn small danger" onClick={() => remove(a.id)}>
                🗑
              </button>
            </div>
          </div>
        ))}
      </div>

      <button className="btn primary" style={{ marginTop: 16 }} onClick={() => setAdding(true)}>
        ➕ {t('add_account')}
      </button>

      {adding && (
        <AddAccountModal
          t={t}
          prov={prov}
          setProv={setProv}
          settings={p.settings}
          onClose={() => setAdding(false)}
          onAdded={(acc) => {
            const rest = p.accounts.map((x) => ({ ...x, active: false }));
            acc.active = true;
            p.onSaveAccounts([...rest, acc]);
            setAdding(false);
            p.toast(`✅ ${acc.nickname} — ${providerLabel(acc.provider)}`);
          }}
          toast={p.toast}
        />
      )}
    </>
  );
}

function AddAccountModal(props: {
  t: T;
  prov: AuthProviderId;
  setProv: (p: AuthProviderId) => void;
  settings: Settings;
  onClose: () => void;
  onAdded: (a: Account) => void;
  toast: (msg: string, err?: boolean) => void;
}) {
  const t = props.t;
  const [nick, setNick] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [busy, setBusy] = useState(false);
  const [device, setDevice] = useState<DeviceCodeInfo | null>(null);
  const [msError, setMsError] = useState('');
  const pollRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (pollRef.current) window.clearInterval(pollRef.current);
  }, []);

  const handleAuthResp = (r: AuthResponse, demoAccount?: Account) => {
    if (r.ok) {
      props.onAdded(r.account);
    } else {
      if (r.demoFallback && demoAccount) {
        // Сеть заблокирована (CORS в браузере) — предлагаем демо-сохранение
        props.toast(r.message, true);
      } else if (r.code === 'no_client_id') {
        setMsError(r.message);
      } else if (r.code !== 'pending') {
        props.toast(r.message, true);
      }
    }
  };

  const submitOffline = () => {
    const r = loginOffline(nick);
    handleAuthResp(r);
  };

  const submitEly = async (demo: boolean) => {
    setBusy(true);
    const r = await loginAuthServer({
      serverUrl: props.settings.accounts.authServerUrl,
      username: email,
      password: pass,
    });
    setBusy(false);
    if (!r.ok && r.demoFallback && demo) {
      props.onAdded({
        id: 'acc_demo_' + Date.now().toString(36),
        nickname: email.split('@')[0] || 'Player',
        uuid: 'demo-' + Math.random().toString(36).slice(2, 10),
        provider: 'elyby',
        email,
        createdAt: Date.now(),
      });
      return;
    }
    handleAuthResp(r);
  };

  const submitMicrosoft = async (demo: boolean) => {
    setBusy(true);
    setMsError('');
    const r = await startMicrosoftLogin(props.settings.accounts.microsoftClientId);
    setBusy(false);
    if (r.ok) {
      setDevice(r.deviceCode);
      // Поллинг токена (в демо обычно упрётся в CORS — покажем это мягко)
      pollRef.current = window.setInterval(async () => {
        const tr = await pollMicrosoftToken(props.settings.accounts.microsoftClientId, r.deviceCode);
        if (tr.ok) {
          if (pollRef.current) window.clearInterval(pollRef.current);
          props.onAdded(tr.account);
        }
      }, (r.deviceCode.interval ?? 5) * 1000);
      return;
    }
    if (r.demoFallback && demo) {
      props.onAdded({
        id: 'acc_ms_demo_' + Date.now().toString(36),
        nickname: 'Steve',
        uuid: 'demo-ms-' + Math.random().toString(36).slice(2, 10),
        provider: 'microsoft',
        createdAt: Date.now(),
      });
      return;
    }
    handleAuthResp(r);
  };

  return (
    <Modal title={t('add_account')} onClose={props.onClose}>
      <div className="provider-tabs">
        <button className={'chip' + (props.prov === 'microsoft' ? ' on' : '')} onClick={() => setProv0('microsoft')}>
          🪟 {t('provider_microsoft')}
        </button>
        <button className={'chip' + (props.prov === 'elyby' ? ' on' : '')} onClick={() => setProv0('elyby')}>
          🌐 {t('provider_elyby')}
        </button>
        <button className={'chip' + (props.prov === 'offline' ? ' on' : '')} onClick={() => setProv0('offline')}>
          🎮 {t('provider_offline')}
        </button>
      </div>

      {props.prov === 'offline' && (
        <>
          <div className="field">
            <label>{t('nickname')}</label>
            <input value={nick} onChange={(e) => setNick(e.target.value)} placeholder="Steve" maxLength={16} />
            <span className="hint">{t('offline_hint')}</span>
          </div>
          <button className="btn primary" onClick={submitOffline} disabled={busy}>
            {t('login')}
          </button>
        </>
      )}

      {props.prov === 'elyby' && (
        <>
          <div className="field">
            <label>{t('auth_server_url')}</label>
            <input value={props.settings.accounts.authServerUrl} readOnly />
            <span className="hint">
              ℹ️ Работает с ely.by и любыми совместимыми authserver-системами. Свой адрес указывается в Настройки → Авторизация.
            </span>
          </div>
          <div className="field">
            <label>{t('elyby_login')}</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="player@example.com" />
          </div>
          <div className="field">
            <label>{t('password')}</label>
            <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} />
          </div>
          <div className="row">
            <button className="btn primary" onClick={() => submitEly(false)} disabled={busy || !email || !pass}>
              {t('login')}
            </button>
            <button className="btn" onClick={() => submitEly(true)} disabled={busy || !email}>
              {t('demo_login')}
            </button>
          </div>
        </>
      )}

      {props.prov === 'microsoft' && (
        <>
          {device ? (
            <>
              <p style={{ fontWeight: 800 }}>{t('ms_device_hint')}</p>
              <p style={{ fontSize: 30, fontWeight: 900, letterSpacing: 3, background: 'var(--bg-soft)', padding: '10px 14px', borderRadius: 10, border: '3px solid var(--ink)', textAlign: 'center' }}>
                {device.userCode}
              </p>
              <p className="hint">
                → <a href={device.verificationUri} target="_blank" rel="noopener noreferrer">{device.verificationUri}</a>
              </p>
              <p className="hint">⏳ {t('ms_waiting')}</p>
            </>
          ) : (
            <>
              <div className="field">
                <label>{t('ms_client_id')}</label>
                <input value={props.settings.accounts.microsoftClientId} readOnly />
                <span className="hint">{t('ms_client_hint')}</span>
              </div>
              {msError && <p className="hint" style={{ color: 'var(--danger)' }}>⚠️ {msError}</p>}
              <div className="row">
                <button className="btn primary" onClick={() => submitMicrosoft(false)} disabled={busy}>
                  🪟 {t('login')}
                </button>
                <button className="btn" onClick={() => submitMicrosoft(true)} disabled={busy}>
                  {t('demo_login')}
                </button>
              </div>
            </>
          )}
        </>
      )}
    </Modal>
  );

  function setProv0(id: AuthProviderId) {
    props.setProv(id);
  }
}
