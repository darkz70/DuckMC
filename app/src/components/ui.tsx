// DuckMC — переиспользуемые UI-элементы
import { ReactNode, useEffect } from 'react';

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="modal-back" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true">
        <h3>🦆 {title}</h3>
        {children}
      </div>
    </div>
  );
}

export function Toast({ text, error }: { text: string; error?: boolean }) {
  return <div className={'toast' + (error ? ' err' : '')}>{text}</div>;
}

export function ProgressBar({ percent, label, detail }: { percent: number; label: string; detail: string }) {
  return (
    <div className="progress-wrap">
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: Math.max(0, Math.min(100, percent)) + '%' }} />
      </div>
      <div className="progress-label">
        <span>{detail}</span>
        <span>{label}</span>
      </div>
    </div>
  );
}
