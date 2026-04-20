import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { loansAPI } from '../../../services/api';
import { GlassCard, PrimaryButton } from '../components/UIElements';
import { Link } from 'react-router-dom';

export default function Repayment() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(null);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loansAPI.getAll()
      .then(({ data }) => setLoans(data.loans.filter(l => l.status === 'approved' || l.status === 'active')))
      .catch(() => setError('Could not load active loans.'))
      .finally(() => setLoading(false));
  }, []);

  const handlePay = async (loan) => {
    setPaying(loan._id);
    try {
      const { data } = await loansAPI.repay(loan._id, { amount: loan.emiAmount });
      setSuccess(loan._id);
      setLoans(prev => prev.map(l => l._id === loan._id ? data.loan : l));
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError(e?.response?.data?.error || 'Payment failed.');
    } finally {
      setPaying(null);
    }
  };

  return (
    <div className="repayment-container">
      <div style={{ marginBottom: 36 }}>
        <p className="type-micro" style={{ color: 'var(--blue)', marginBottom: 10 }}>
          <span className="material-symbols-rounded" style={{ fontSize: 14, verticalAlign: 'middle', marginRight: 6 }}>payments</span>
          REPAYMENT PORTAL
        </p>
        <h1 className="type-h1">Manage Your<br /><span style={{ color: 'var(--gold)' }}>Repayments.</span></h1>
        <p className="type-body" style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
          Stay on top of your EMI schedule. One tap to make a payment.
        </p>
      </div>

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {[1, 2].map(i => <div key={i} className="loan-skeleton" style={{ height: 200, borderRadius: 'var(--r-2xl)' }} />)}
        </div>
      )}

      {error && (
        <GlassCard style={{ padding: 32, borderColor: 'rgba(255,76,76,0.3)', textAlign: 'center' }}>
          <span className="material-symbols-rounded" style={{ fontSize: 40, color: 'var(--error)', marginBottom: 12 }}>error</span>
          <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
        </GlassCard>
      )}

      {!loading && !error && loans.length === 0 && (
        <GlassCard tier={2} style={{ padding: 64, textAlign: 'center' }}>
          <span className="material-symbols-rounded" style={{ fontSize: 64, color: 'var(--text-muted)', marginBottom: 20 }}>payments</span>
          <h3 className="type-h2" style={{ marginBottom: 12 }}>No Active Loans</h3>
          <p className="type-body" style={{ color: 'var(--text-secondary)', marginBottom: 28 }}>
            You have no approved or active loans to repay right now.
          </p>
          <Link to="/loans/apply"><PrimaryButton icon="arrow_forward">Apply for a Loan</PrimaryButton></Link>
        </GlassCard>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {loans.map(loan => {
          const isPayingThis = paying === loan._id;
          const justPaid = success === loan._id;

          return (
            <GlassCard key={loan._id} tier={2} style={{ padding: 32 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <p className="type-micro" style={{ color: 'var(--text-muted)', marginBottom: 6 }}>{loan.purpose || 'Personal'} Loan</p>
                  <p className="type-num" style={{ fontSize: '2rem' }}>₹{Number(loan.principalAmount).toLocaleString()}</p>
                  <p className="type-small" style={{ color: 'var(--text-secondary)', marginTop: 4 }}>Outstanding balance</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p className="type-micro" style={{ color: 'var(--text-muted)', marginBottom: 6 }}>MONTHLY EMI</p>
                  <p className="type-num" style={{ fontSize: '1.6rem', color: 'var(--gold)' }}>₹{Math.round(loan.emiAmount).toLocaleString()}</p>
                  <p className="type-small" style={{ color: 'var(--text-secondary)', marginTop: 4 }}>{loan.interestRate}% APR · {loan.durationMonths} months</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
                {[
                  { label: 'Principal Remaining', val: `₹${Number(loan.principalAmount).toLocaleString()}`, color: 'var(--gold)' },
                  { label: 'Total Interest', val: `₹${Math.round(loan.emiAmount * loan.durationMonths - loan.principalAmount).toLocaleString()}`, color: 'var(--blue)' },
                  { label: 'Remaining Months', val: Math.ceil(loan.principalAmount / (loan.emiAmount || 1)), color: 'var(--text-primary)' },
                ].map(({ label, val, color }) => (
                  <div key={label} style={{ padding: 14, background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--r-md)', border: '1px solid var(--border-subtle)' }}>
                    <p className="type-micro" style={{ color: 'var(--text-muted)', marginBottom: 6 }}>{label}</p>
                    <p className="type-num" style={{ color, fontSize: '1rem' }}>{val}</p>
                  </div>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {justPaid ? (
                  <motion.div key="success"
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    style={{ padding: 16, background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.3)', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className="material-symbols-rounded" style={{ color: 'var(--success)', fontSize: 24 }}>check_circle</span>
                    <p style={{ color: 'var(--success)', fontWeight: 600 }}>Payment of ₹{Math.round(loan.emiAmount).toLocaleString()} recorded successfully!</p>
                  </motion.div>
                ) : (
                  <motion.div key="pay" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <PrimaryButton onClick={() => handlePay(loan)} loading={isPayingThis} style={{ width: '100%' }}>
                      {isPayingThis ? 'Processing...' : `Pay EMI · ₹${Math.round(loan.emiAmount).toLocaleString()}`}
                    </PrimaryButton>
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
