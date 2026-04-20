import React, { useEffect } from 'react';
import gsap from 'gsap';
import { GlassCard } from '../components/UIElements';

export default function GenericScreen({ title, icon, color = 'var(--gold)' }) {
  useEffect(() => {
    gsap.from('.gen-card', { opacity: 0, scale: 0.9, duration: 0.5, ease: 'power3.out' });
  }, []);

  return (
    <div className="loan-max-w" style={{ maxWidth: '800px', textAlign: 'center' }}>
      <GlassCard tier={2} className="gen-card" style={{ padding: '64px 32px' }}>
        <span className="material-symbols-rounded" style={{ fontSize: '64px', color: color, marginBottom: '24px', filter: `drop-shadow(0 0 20px ${color})` }}>
          {icon}
        </span>
        <h1 className="type-h1" style={{ marginBottom: '16px' }}>{title}</h1>
        <p className="type-body" style={{ color: 'var(--text-secondary)' }}>
          This elite screen is currently processing via Nexus core. Full animations and data visualizations will populate shortly.
        </p>
      </GlassCard>
    </div>
  );
}
