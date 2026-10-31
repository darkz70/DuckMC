// DuckMC — аккаунты: настоящий вход Microsoft, ely.by/совместимые, оффлайн
import { useState } from 'react';
import type { Account, AuthProviderId, Settings } from '../core/types';
import type { T } from '../i18n';
import { providerLabel, avatarUrl } from '../core/auth';
import { Modal } from '../components/ui';
import AccountLoginForm from '../components/AccountLoginForm';
import { IconPlus, IconStar, IconTrash, IconUser } from '../components/icons';

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

  const activate = (id: string) => {
    p.onSaveAccounts(p.accounts.map((a) => ({ ...a, active: a.id === id })));
  };
  const remove = (id: string) => {
    const rest = p.accounts.filter((a) => a.id !== id);
    if (rest.length && !rest.some((a) => a.active)) rest[0].active = true;
    p.onSaveAccounts(rest);
  };

  const addAccount = (acc: Account) => {
    const rest = p.accounts.map((x) => ({ ...x, active: false }));
    acc.active = true;
    p.onSaveAccounts([...rest, acc]);
    setAdding(false);
    p.toast(`${acc.nickname} — ${providerLabel(acc.provider)}`);
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
        <Modal title={t('add_account')} onClose={() => setAdding(false)}>
          <AccountLoginForm
            t={t}
            settings={p.settings}
            prov={prov}
            setProv={setProv}
            onAdded={addAccount}
            toast={p.toast}
          />
        </Modal>
      )}
    </>
  );
}
