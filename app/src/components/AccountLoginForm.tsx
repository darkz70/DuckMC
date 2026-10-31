// DuckMC — форма входа (общая для модалки и стартового экрана):
// Microsoft (полная цепочка), ely.by/совместимые, оффлайн
import { useEffect, useRef, useState } from 'react';
import type { Account, AuthProviderId, Settings } from '../core/types';
import type { T } from '../i18n';
import {
  loginOffline,
  loginAuthServer,
  startMicrosoftLogin,
  pollMicrosoftToken,
  completeMicrosoftAuth,
  BUILT_IN_CLIENT_ID,
  type DeviceCodeInfo,
} from '../core/auth';
import { ProgressBar } from './ui';
import { IconGamepad, IconGlobe, IconKey, IconWindows } from './icons';

type MsFlow =
  | { step: 'idle' }
  | { step: 'code'; info: DeviceCodeInfo }
  | { step: 'chain'; detail: string; percent: number };

interface Props {
  t: T;
  settings: Settings;
  prov: AuthProviderId;
  setProv: (p: AuthProviderId) => void;
  onAdded: (a: Account) => void;
  toast: (msg: string, err?: boolean) => void;
}

export default function AccountLoginForm(p: Props) {
  const t = p.t;
  const [nick, setNick] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [busy, setBusy] = useState(false);
  const [msFlow, setMsFlow] = useState<MsFlow>({ step: 'idle' });
  const [msError, setMsError] = useState('');
  const [clientId, setClientId] = useState(p.settings.accounts.microsoftClientId || BUILT_IN_CLIENT_ID);
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
    if (r.ok) p.onAdded(r.account);
    else p.toast(r.message, true);
  };

  const submitEly = async () => {
    setBusy(true);
    const r = await loginAuthServer({
      serverUrl: p.settings.accounts.authServerUrl,
      username: email,
      password: pass,
    });
    setBusy(false);
    if (r.ok) p.onAdded(r.account);
    else p.toast(r.message + (r.demoFallback ? ' ' + t('ely_native_note') : ''), !!r.demoFallback || r.code !== 'credentials');
  };

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
      if (r.state === 'pending' || r.state === 'slowdown') return;
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
      try {
        setMsFlow({ step: 'chain', detail: t('ms_step_xbl'), percent: 55 });
        const acc = await completeMicrosoftAuth(r.accessToken);
        setMsFlow({ step: 'chain', detail: t('ms_step_profile'), percent: 95 });
        p.onAdded(acc);
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
    <>
      <div className="provider-tabs">
        <button className={'chip' + (p.prov === 'microsoft' ? ' on' : '')} onClick={() => p.setProv('microsoft')}>
          <IconWindows size={16} />
          <span>{t('provider_microsoft')}</span>
        </button>
        <button className={'chip' + (p.prov === 'elyby' ? ' on' : '')} onClick={() => p.setProv('elyby')}>
          <IconGlobe size={16} />
          <span>{t('provider_elyby')}</span>
        </button>
        <button className={'chip' + (p.prov === 'offline' ? ' on' : '')} onClick={() => p.setProv('offline')}>
          <IconGamepad size={16} />
          <span>{t('provider_offline')}</span>
        </button>
      </div>

      {p.prov === 'offline' && (
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

      {p.prov === 'elyby' && (
        <>
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
          <p className="hint" style={{ marginTop: 10 }}>{t('ely_url_hint')}</p>
        </>
      )}

      {p.prov === 'microsoft' && (
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
                  p.toast(t('ms_copied'));
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
    </>
  );
}
