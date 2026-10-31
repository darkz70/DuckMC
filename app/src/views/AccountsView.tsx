// DuckMC — аккаунты: настоящий вход Microsoft, ely.by (или совместимый сервер), оффлайн
import { useEffect, useRef, useState } from 'react';
import type { Account, AuthProviderId, Settings } from '../core/types';
import type { T } from '../i18n';
import {
  loginOffline,
  loginAuthServer,
  startMicrosoftLogin,
  pollMicrosoftToken,
  completeMicrosoftAuth,
  providerLabel,
  avatarUrl,
  type AuthResponse,
  type DeviceCodeInfo,
} from '../core/auth';
import { Modal, ProgressBar } from '../components/ui';
import { IconGamepad, IconGlobe, IconKey, IconPlus, IconStar, IconTrash, IconUser, IconWindows } from '../components/icons';

interface Props {
  t: T;
  accounts: Account[];
  settings: Settings;
  onSaveAccounts: (a: Account[]) => void;
  toast: (msg: string, err?: boolean) => void;
}

/** Состояния настоящего Microsoft-входа */
type MsFlow =
  | { step: 'idle' }
  | { step: 'code'; info: DeviceCodeInfo }
  | { step: 'chain'; detail: string; percent: number };

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
      <h1 className="view-title">
        <IconUser size={26} />
        <span>{t('accounts_title')}</span>
      </h1>
      <p className="view-sub">{t('acc_subtitle')}</p>

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
              <div className="nick">
                {a.active && <IconStar size={13} />}
                <span>{a.nickname}</span>
              </div>
              <div className="prov">{providerLabel(a.provider)} · {a.uuid.slice(0, 8)}…</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {!a.active && (
                <button className="btn small primary" onClick={() => activate(a.id)}>
                  {t('make_active')}
                </button>
              )}
              <button className="btn small danger" onClick={() => remove(a.id)} aria-label={t('remove')}>
                <IconTrash size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <button className="btn primary" style={{ marginTop: 16 }} onClick={() => setAdding(true)}>
        <IconPlus size={16} />
        <span>{t('add_account')}</span>
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
            p.toast(`${acc.nickname} — ${providerLabel(acc.provider)}`);
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
  const [msFlow, setMsFlow] = useState<MsFlow>({ step: 'idle' });
  const [msError, setMsError] = useState('');
  const [clientId, setClientId] = useState(props.settings.accounts.microsoftClientId);
  const pollRef = useRef<number | null>(null);
  const cancelledRef = useRef(false);

  useEffect(
    () => () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    },
    [],
  );

  const submitOffline = () => {
    const r = loginOffline(nick);
    if (r.ok) props.onAdded(r.account);
    else props.toast(r.message, true);
  };

  const submitEly = async () => {
    setBusy(true);
    const r = await loginAuthServer({
      serverUrl: props.settings.accounts.authServerUrl,
      username: email,
      password: pass,
    });
    setBusy(false);
    if (r.ok) props.onAdded(r.account);
    else props.toast(r.message + (r.demoFallback ? ' ' + t('ely_native_note') : ''), !!r.demoFallback || r.code !== 'credentials');
  };

  /** НАСТОЯЩИЙ вход Microsoft: код → токен → XBL → XSTS → профиль */
  const submitMicrosoft = async () => {
    setMsError('');
    cancelledRef.current = false;
    const start = await startMicrosoftLogin(clientId);
    if (!start.ok) {
      setMsError(start.message);
      return;
    }
    const info = start.deviceCode;
    setMsFlow({ step: 'code', info });

    const tick = async () => {
      if (cancelledRef.current) {
        if (pollRef.current) window.clearInterval(pollRef.current);
        return;
      }
      const r = await pollMicrosoftToken(clientId, info);
      if (r.state === 'pending') return; // ждём следующего такта
      if (r.state === 'slowdown') return; // Microsoft просит реже — интервал уже с запасом
      window.clearInterval(pollRef.current!);
      pollRef.current = null;

      if (r.state === 'expired') {
        setMsFlow({ step: 'idle' });
        setMsError(t('ms_expired'));
        return;
      }
      if (r.state === 'denied') {
        setMsFlow({ step: 'idle' });
        setMsError(t('ms_denied'));
        return;
      }

      // Токен получен — идём по цепочке до реального профиля
      try {
        setMsFlow({ step: 'chain', detail: t('ms_step_xbl'), percent: 55 });
        const acc = await completeMicrosoftAuth(r.accessToken);
        setMsFlow({ step: 'chain', detail: t('ms_step_profile'), percent: 95 });
        props.onAdded(acc);
      } catch (e) {
        setMsFlow({ step: 'idle' });
        setMsError(e instanceof Error ? e.message : String(e));
      }
    };

    pollRef.current = window.setInterval(() => void tick(), (info.interval + 1) * 1000);
  };

  const cancelMicrosoft = () => {
    cancelledRef.current = true;
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setMsFlow({ step: 'idle' });
  };

  return (
    <Modal title={t('add_account')} onClose={props.onClose}>
      <div className="provider-tabs">
        <button className={'chip' + (props.prov === 'microsoft' ? ' on' : '')} onClick={() => props.setProv('microsoft')}>
          <IconWindows size={16} />
          <span>{t('provider_microsoft')}</span>
        </button>
        <button className={'chip' + (props.prov === 'elyby' ? ' on' : '')} onClick={() => props.setProv('elyby')}>
          <IconGlobe size={16} />
          <span>{t('provider_elyby')}</span>
        </button>
        <button className={'chip' + (props.prov === 'offline' ? ' on' : '')} onClick={() => props.setProv('offline')}>
          <IconGamepad size={16} />
          <span>{t('provider_offline')}</span>
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
            <span className="hint">{t('ely_url_hint')}</span>
          </div>
          <div className="field">
            <label>{t('elyby_login')}</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="player@example.com" />
          </div>
          <div className="field">
            <label>{t('password')}</label>
            <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} />
          </div>
          <button className="btn primary" onClick={() => void submitEly()} disabled={busy || !email || !pass}>
            {t('login')}
          </button>
          <p className="hint" style={{ marginTop: 10 }}>{t('ely_native_note')}</p>
        </>
      )}

      {props.prov === 'microsoft' && (
        <>
          {msFlow.step === 'idle' && (
            <>
              <div className="field">
                <label>{t('ms_client_id')}</label>
                <input
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="00000000-0000-0000-0000-000000000000"
                />
                <span className="hint">{t('ms_client_hint')}</span>
              </div>
              {msError && <p className="hint" style={{ color: 'var(--danger)' }}>{msError}</p>}
              <button className="btn primary" onClick={() => void submitMicrosoft()} disabled={busy}>
                <IconKey size={16} />
                <span>{t('ms_login_btn')}</span>
              </button>
            </>
          )}

          {msFlow.step === 'code' && (
            <>
              <p style={{ fontWeight: 700 }}>{t('ms_device_hint')}</p>
              <p
                className="ms-usercode"
                onClick={() => {
                  navigator.clipboard?.writeText(msFlow.info.userCode);
                  props.toast(t('ms_copied'));
                }}
                title={t('ms_copied')}
              >
                {msFlow.info.userCode}
              </p>
              <p className="hint">
                <a href={msFlow.info.verificationUri} target="_blank" rel="noopener noreferrer">
                  {msFlow.info.verificationUri}
                </a>
              </p>
              <p className="hint">{t('ms_waiting')}</p>
              {msError && <p className="hint" style={{ color: 'var(--danger)' }}>{msError}</p>}
              <button className="btn danger" onClick={cancelMicrosoft} style={{ marginTop: 10 }}>
                {t('cancel')}
              </button>
            </>
          )}

          {msFlow.step === 'chain' && (
            <>
              <ProgressBar percent={msFlow.percent} detail={msFlow.detail} label={msFlow.percent + '%'} />
              <button className="btn" onClick={cancelMicrosoft} style={{ marginTop: 12 }}>
                {t('cancel')}
              </button>
            </>
          )}
        </>
      )}
    </Modal>
  );
}
