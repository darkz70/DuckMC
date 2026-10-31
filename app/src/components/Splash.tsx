// DuckMC — стартовый сплэш с уткой (как нативный splash на Android)
import { useEffect, useState } from 'react';

export default function Splash() {
  const [phase, setPhase] = useState<'show' | 'fade' | 'gone'>('show');

  useEffect(() => {
    const t1 = window.setTimeout(() => setPhase('fade'), 1100);
    const t2 = window.setTimeout(() => setPhase('gone'), 1700);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  if (phase === 'gone') return null;
  return (
    <div className={'splash' + (phase === 'fade' ? ' splash-fade' : '')} onClick={() => setPhase('fade')}>
      <img src="./logo.jpg" alt="DuckMC" className="splash-logo" />
      <div className="splash-name">DuckMC</div>
      <div className="splash-quack">кря-кря! 🦆</div>
    </div>
  );
}
