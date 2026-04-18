import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Receipt, Loader2, CheckCircle2 } from 'lucide-react';
import { bankingAPI } from '../../services/api';

const CATEGORIES = [
  'Food and Drink', 'Travel', 'Shopping', 'Transfer', 'Payment', 
  'Recreation', 'Service', 'Healthcare', 'Other'
];

export default function SimulateSpendModal({ open: isOpen, onClose, onSuccess, accounts }) {
  const [step,     setStep]     = useState('idle'); // idle | simulating | success
  const [amount,   setAmount]   = useState('');
  const [merchant, setMerchant] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [account,  setAccount]  = useState(accounts?.[0]?.account_id || '');
  const [errMsg,   setErrMsg]   = useState('');

  // Update selected account if accounts array becomes available after mount
  React.useEffect(() => {
    if (accounts?.length && !account) setAccount(accounts[0].account_id);
  }, [accounts]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return setErrMsg('Enter a valid amount');
    if (!merchant) return setErrMsg('Enter a merchant name');
    if (!account) return setErrMsg('Select an account');

    setErrMsg('');
    setStep('simulating');

    try {
      await bankingAPI.simulateSpend({
        amount,
        merchantName: merchant,
        category,
        accountId: account,
      });

      setStep('success');
      setTimeout(() => {
        onSuccess?.();
        onClose();
        setStep('idle');
        setAmount('');
        setMerchant('');
      }, 1500);
    } catch (e) {
      setErrMsg('Failed to simulate spend. Try again.');
      setStep('idle');
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="modal-box glass-card"
            initial={{ opacity: 0, scale: 0.8, y: 30, rotateX: 15, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.8, y: 30, rotateX: -15, filter: 'blur(10px)' }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="modal-close btn-icon" onClick={onClose}><X size={18} /></button>

            {step === 'idle' && (
              <form onSubmit={handleSubmit} className="auth-fields" style={{ marginTop: '10px' }}>
                <div className="modal-icon-wrap" style={{ background: 'rgba(236,72,153,0.15)', borderColor: 'rgba(236,72,153,0.3)', marginBottom: '16px' }}>
                  <Receipt size={28} style={{ color: 'var(--pink)' }} />
                </div>
                <div>
                  <h3 className="modal-title" style={{ fontSize: '20px' }}>Simulate Spend</h3>
                  <p className="modal-desc" style={{ marginBottom: '8px' }}>
                    Deduct money directly from your linked accounts.
                  </p>
                </div>

                {errMsg && <p className="auth-error">{errMsg}</p>}

                <div className="field-group">
                  <label className="field-label">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    className="field-input"
                    placeholder="e.g. 15.50"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="field-group">
                  <label className="field-label">Merchant Name</label>
                  <input
                    className="field-input"
                    placeholder="e.g. Starbucks"
                    value={merchant}
                    onChange={(e) => setMerchant(e.target.value)}
                  />
                </div>

                <div className="field-group">
                  <label className="field-label">Category</label>
                  <select
                    className="field-input"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="field-group">
                  <label className="field-label">Pay From Account</label>
                  <select
                    className="field-input"
                    value={account}
                    onChange={(e) => setAccount(e.target.value)}
                  >
                    {(!accounts || accounts.length === 0) && <option value="">No accounts linked</option>}
                    {accounts?.map(a => (
                      <option key={a.account_id} value={a.account_id}>
                        {a.name} (Avail: ${a.balances.available || a.balances.current})
                      </option>
                    ))}
                  </select>
                </div>

                <button type="submit" className="btn-primary btn-full" style={{ marginTop: '10px', background: 'linear-gradient(135deg, var(--pink), var(--accent))' }} disabled={!accounts?.length}>
                  Simulate Payment
                </button>
              </form>
            )}

            {step === 'simulating' && (
              <div className="modal-center">
                <Loader2 size={40} className="spin" style={{ color: 'var(--pink)' }} />
                <p className="modal-loading-text">Deducting from account…</p>
              </div>
            )}

            {step === 'success' && (
              <div className="modal-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }}>
                  <CheckCircle2 size={52} style={{ color: 'var(--green)' }} />
                </motion.div>
                <h3 className="modal-title" style={{ marginTop: '16px' }}>
                  Payment Successful!
                </h3>
                <p className="modal-desc">Dashboard is updating instantly.</p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
