// DuckMC — переключатель изданий: две крупные карточки (вместо чипов)
import { IconBedrock, IconCheckCircle, IconJava } from './icons';
import type { T } from '../i18n';
import type { Edition } from '../core/types';

interface Props {
  t: T;
  edition: Edition;
  onChange: (e: Edition) => void;
  compact?: boolean;
  disabled?: boolean;
}

export default function EditionCards({ t, edition, onChange, compact, disabled }: Props) {
  return (
    <div className={'edition-grid' + (compact ? ' compact' : '')}>
      <button
        className={'edition-card' + (edition === 'java' ? ' on' : '')}
        onClick={() => !disabled && onChange('java')}
        disabled={disabled}
        type="button"
      >
        <span className="ed-ico">
          <IconJava size={compact ? 22 : 30} />
        </span>
        <span className="ed-text">
          <span className="ed-name">{t('edition_java')}</span>
          <span className="ed-sub">{t('edition_java_sub')}</span>
        </span>
        {edition === 'java' && <IconCheckCircle size={18} className="ed-check" />}
      </button>

      <button
        className={'edition-card bedrock' + (edition === 'bedrock' ? ' on' : '')}
        onClick={() => !disabled && onChange('bedrock')}
        disabled={disabled}
        type="button"
      >
        <span className="ed-ico">
          <IconBedrock size={compact ? 22 : 30} />
        </span>
        <span className="ed-text">
          <span className="ed-name">{t('edition_bedrock')}</span>
          <span className="ed-sub">{t('edition_bedrock_sub')}</span>
        </span>
        {edition === 'bedrock' && <IconCheckCircle size={18} className="ed-check" />}
      </button>
    </div>
  );
}
