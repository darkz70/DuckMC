// DuckMC — стартовый экран первого запуска: сначала аккаунт, потом лаунчер
import { useState } from 'react';
import type { Account, AuthProviderId, Settings } from '../core/types';
import type { T } from '../i18n';
import AccountLoginForm from '../components/AccountLoginForm';

interface Props {
  t: T;
  settings: Settings;
  onAdded: (a: Account) => void;
  onSkip: () => void;
  toast: (msg: string, err?: boolean) => void;
}

export default function OnboardingView(p: Props) {
  const t = p.t;
  const [prov, setProv] = useState<AuthProviderId>('microsoft');

  return (
    <div className="onboarding">
      <div className="ob-card">
        <img src="./logo.jpg" alt="DuckMC" width={88} height={88} className="ob-logo" />
        <div className="ob-name">DuckMC</div>
        <h1 className="ob-title">{t('ob_welcome')}</h1>
        <p className="ob-lead">{t('ob_lead')}</p>

        <AccountLoginForm
          t={t}
          settings={p.settings}
          prov={prov}
          setProv={setProv}
          onAdded={p.onAdded}
          toast={p.toast}
        />

        <button className="btn outline ob-skip" onClick={p.onSkip}>
          {t('ob_skip')}
        </button>
      </div>
    </div>
  );
}
