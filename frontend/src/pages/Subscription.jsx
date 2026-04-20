import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { GlassCard, PrimaryButton, InputField } from './loans/components/UIElements';
import { CheckCircle2, XCircle, Star, CreditCard } from 'lucide-react';

export default function Subscription() {
  const { user, subscribe } = useAuth();
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      await subscribe();
      // On success, redirect them to the newly unlocked module (CA module)
      nav('/ca');
      setLoading(false);
    } catch(e) {
      console.error("Upgrade failed:", e);
      alert("System could not verify the mock payment. Please try again.");
      setLoading(false);
    }
  };

  const isPro = user?.isSubscribed;

  return (
    <div style={{ padding: '60px', maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
      <h1 className="type-h1" style={{ marginBottom: '16px' }}>CA Directory Access</h1>
      <p className="type-body" style={{ color: 'var(--text-secondary)', marginBottom: '48px', fontSize: '1.2rem' }}>
        Unlock premium access to browse, filter, and book personalized sessions with certified Chartered Accountants.
      </p>

      <div style={{ display: 'flex', gap: '32px', justifyContent: 'center', alignItems: 'stretch' }}>
        {/* Basic Tier */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ flex: 1, maxWidth: '400px' }}>
          <GlassCard style={{ padding: '40px', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <h3 className="type-h2" style={{ marginBottom: '8px' }}>Nexus Standard</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Full access to all personal finance and loan tracking modules.</p>
            
            <div style={{ margin: '32px 0', fontSize: '2.5rem', fontWeight: 700 }}>
              Free
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: 0, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '16px', color: 'var(--text-secondary)' }}>
              <li><CheckCircle2 color="var(--success)" size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> FinAgent</li>
              <li><CheckCircle2 color="var(--success)" size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> Loans</li>
              <li><CheckCircle2 color="var(--success)" size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> Card Offers</li>
              <li><CheckCircle2 color="var(--success)" size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> Subscription Analyzer</li>
              <li><CheckCircle2 color="var(--success)" size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> Investment</li>
            </ul>

            <div style={{ marginTop: 'auto', paddingTop: '32px', position: 'relative', zIndex: 10 }}>
              <PrimaryButton 
                style={{ width: '100%', background: 'rgba(255,255,255,0.08)', color: 'var(--text)', border: '1px solid var(--border)', cursor: 'pointer' }}
                onClick={() => nav('/dashboard')}
              >
                Go to Dashboard
              </PrimaryButton>
            </div>
          </GlassCard>
        </motion.div>

        {/* Pro Tier */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ flex: 1, maxWidth: '400px' }}>
          <div style={{ 
            background: 'linear-gradient(135deg, rgba(124,58,237,0.3) 0%, rgba(20,20,35,0.9) 100%)', 
            borderRadius: '16px', 
            padding: '2px', // Gradient border hack
            height: '100%' 
          }}>
            <GlassCard style={{ padding: '40px', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
              
              {/* Pro Badge absolute */}
              <div style={{ position: 'absolute', top: '16px', right: '16px', background: 'var(--gold)', color: '#000', padding: '4px 12px', borderRadius: '20px', fontWeight: 800, fontSize: '0.8rem' }}>
                MOST POPULAR
              </div>

              <h3 className="type-h2" style={{ marginBottom: '8px', color: 'var(--gold)' }}>CA Module Pass</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>For users seeking professional tax planning and financial audits.</p>
              
              <div style={{ margin: '32px 0', fontSize: '2.5rem', fontWeight: 700, color: '#fff' }}>
                ₹999<span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/mo</span>
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: 0, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '16px', color: '#fff' }}>
                <li><CheckCircle2 color="var(--gold)" size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> Includes all Standard features</li>
                <li><Star color="var(--gold)" size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> <strong>Access to Verified CA Directory</strong></li>
                <li><Star color="var(--gold)" size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> <strong>Filter CAs by Experience & City</strong></li>
                <li><Star color="var(--gold)" size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> <strong>Directly Book Consultation Slots</strong></li>
                <li><Star color="var(--gold)" size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> <strong>Verified CA Review Engine</strong></li>
              </ul>

              <div style={{ marginTop: 'auto', paddingTop: '32px', position: 'relative', zIndex: 10 }}>
                {isPro ? (
                  <PrimaryButton 
                    style={{ width: '100%', background: 'rgba(255,255,255,0.1)', color: 'var(--green)', border: '1px solid var(--green)', cursor: 'pointer' }}
                    onClick={() => nav('/ca')}
                  >
                    Enter CA Directory
                  </PrimaryButton>
                ) : (
                  <PrimaryButton 
                    style={{ 
                      width: '100%', 
                      background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-2) 100%)', 
                      color: '#000', 
                      fontWeight: 700, 
                      fontSize: '1.1rem', 
                      cursor: 'pointer', 
                      zIndex: 20, 
                      boxShadow: '0 4px 20px var(--gold-glow)' 
                    }}
                    onClick={() => setPayModalOpen(true)}
                  >
                    Upgrade CA Subscription
                  </PrimaryButton>
                )}
              </div>
            </GlassCard>
          </div>
        </motion.div>
      </div>

      {payModalOpen && (
        <PaymentModal 
          onClose={() => setPayModalOpen(false)} 
          onSuccess={handleSubscribe} 
          loading={loading}
        />
      )}
    </div>
  );
}

function PaymentModal({ onClose, onSuccess, loading }) {
  const [cc, setCc] = useState('');
  const [exp, setExp] = useState('');
  const [cvv, setCvv] = useState('');

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <GlassCard tier={3} style={{ width: '100%', maxWidth: '450px', padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 className="type-h3" style={{ color: '#fff' }}>Checkout</h3>
          <button style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }} onClick={onClose}>
            <XCircle size={24} />
          </button>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '8px' }}>Plan</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '24px' }}>
          <span style={{ fontWeight: 600, color: '#fff' }}>CA Module Pass (Monthly)</span>
          <span style={{ fontWeight: 700, color: 'var(--gold)' }}>₹999</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
           <InputField 
             label="Card Number" 
             placeholder="0000 0000 0000 0000" 
             value={cc} 
             onChange={e => setCc(e.target.value)} 
             maxLength={19} 
           />
           <div style={{ display: 'flex', gap: '16px' }}>
             <InputField label="Expiry" placeholder="MM/YY" value={exp} onChange={e => setExp(e.target.value)} maxLength={5} />
             <InputField label="CVV" placeholder="123" type="password" value={cvv} onChange={e => setCvv(e.target.value)} maxLength={4} />
           </div>
        </div>

        <PrimaryButton 
          style={{ 
            width: '100%', 
            background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-2) 100%)', 
            color: '#000', 
            fontSize: '1.1rem', 
            fontWeight: 700,
            boxShadow: '0 4px 20px var(--gold-glow)'
          }}
          loading={loading}
          onClick={() => {
            if (!cc || !exp || !cvv) {
              alert("Please enter mock card credentials to proceed.");
              return;
            }
            onSuccess();
          }}
        >
          Authorize Payment — ₹999
        </PrimaryButton>
        <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '16px' }}>
          <CreditCard size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Secured via Mock Gateway Environment
        </p>
      </GlassCard>
    </div>
  );
}
