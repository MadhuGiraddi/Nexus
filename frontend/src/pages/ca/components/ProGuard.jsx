import { useAuth } from '../../../context/AuthContext';
import { PrimaryButton } from '../../loans/components/UIElements';
import { Trophy, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ProGuard({ children }) {
  const { user } = useAuth();
  const nav = useNavigate();

  // If loading or no user, safely render nothing (parent Protected handles auth)
  if (!user) return null;

  // Strict check for subscription status. 
  // Backend now also enforces this via 'pro' middleware on /api/ca/ routes.
  if (user.isSubscribed === true) return children;

  // Otherwise, lock the screen behind the premium paywall
  const handleUpgrade = () => nav('/subscribe');

  return (
    <div className="full-center" style={{ minHeight: '80vh', flexDirection: 'column', gap: '24px', padding: '40px', textAlign: 'center' }}>
      <div style={{
        background: 'rgba(124, 58, 237, 0.1)',
        border: '1px solid rgba(124, 58, 237, 0.2)',
        borderRadius: '50%',
        width: '100px',
        height: '100px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Trophy size={48} color="var(--gold)" />
      </div>
      
      <h2 className="type-h2" style={{ fontSize: '2.5rem' }}>CA Module Subscription Required</h2>
      
      <p className="type-body" style={{ color: 'var(--text-secondary)', maxWidth: '500px', lineHeight: 1.6, fontSize: '1.1rem' }}>
        The CA Contacts module is an exclusive premium feature. Upgrade your Nexus account to unlock direct bookings, verified CA profiles, and personalized financial consultations.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
        <PrimaryButton 
          style={{ background: 'var(--gold)', color: '#000', fontSize: '1.1rem', padding: '16px 32px' }} 
          icon="workspace_premium"
          onClick={handleUpgrade}
        >
          View Pro Plans
        </PrimaryButton>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>*See the pricing table to unlock CA Contacts.</span>
      </div>
    </div>
  );
}
