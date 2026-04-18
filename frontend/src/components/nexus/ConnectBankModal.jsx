import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlaidLink } from 'react-plaid-link';
import { X, Building2, ShieldCheck, Loader2, CheckCircle2 } from 'lucide-react';
import { bankingAPI } from '../../services/api';

function PlaidLinkButton({ linkToken, onSuccess, onExit }) {
  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: (public_token, meta) => onSuccess(public_token, meta.institution),
    onExit: (err) => { if (err) console.error(err); onExit?.(); },
  });
  return (
    <button className="btn-primary btn-full" onClick={() => open()} disabled={!ready}>
      {!ready ? <Loader2 size={18} className="spin" /> : (
        <><ShieldCheck size={18} /> Connect Securely via Plaid</>
      )}
    </button>
  );
}

export default function ConnectBankModal({ open: isOpen, onClose, onConnected }) {
  const [step,       setStep]       = useState('idle'); // idle | fetching | linking | success | error
  const [linkToken,  setLinkToken]  = useState('');
  const [bankName,   setBankName]   = useState('');
  const [errMsg,     setErrMsg]     = useState('');

  async function startLink() {
    setStep('fetching');
    try {
      const { data } = await bankingAPI.linkToken();
      setLinkToken(data.linkToken);
      setStep('linking');
    } catch {
      setErrMsg('Could not start bank connection. Please try again.');
      setStep('error');
    }
  }

  async function handleSuccess(publicToken, institution) {
    setStep('fetching');
    try {
      await bankingAPI.exchangeToken({ publicToken, institution });
      setBankName(institution?.name || 'Your bank');
      setStep('success');
      setTimeout(() => { onConnected?.(); onClose(); setStep('idle'); }, 2000);
    } catch {
      setErrMsg('Failed to link bank. Please try again.');
      setStep('error');
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
              <>
                <div className="modal-icon-wrap">
                  <Building2 size={28} className="modal-icon" />
                </div>
                <h3 className="modal-title">Connect a Bank Account</h3>
                <p className="modal-desc">
                  Nexus uses <strong>Plaid</strong> — the same secure infrastructure trusted by thousands of apps. Your credentials never touch our servers.
                </p>
                <ul className="modal-features">
                  {['256-bit AES encryption', 'Read-only access to your data', 'Disconnect anytime'].map((f) => (
                    <li key={f}><ShieldCheck size={14} className="feature-check" />{f}</li>
                  ))}
                </ul>
                <button className="btn-primary btn-full" onClick={startLink}>
                  <Building2 size={18} /> Get Started
                </button>
              </>
            )}

            {step === 'fetching' && (
              <div className="modal-center">
                <Loader2 size={40} className="spin" style={{ color: 'var(--accent)' }} />
                <p className="modal-loading-text">Preparing secure connection…</p>
              </div>
            )}

            {step === 'linking' && linkToken && (
              <>
                <div className="modal-icon-wrap">
                  <ShieldCheck size={28} className="modal-icon" />
                </div>
                <h3 className="modal-title">Ready to Connect</h3>
                <p className="modal-desc">Click below to open the secure Plaid window and select your bank.</p>
                <PlaidLinkButton
                  linkToken={linkToken}
                  onSuccess={handleSuccess}
                  onExit={() => setStep('idle')}
                />
              </>
            )}

            {step === 'success' && (
              <div className="modal-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }}>
                  <CheckCircle2 size={52} style={{ color: 'var(--green)' }} />
                </motion.div>
                <h3 className="modal-title" style={{ marginTop: '16px' }}>
                  {bankName} Connected!
                </h3>
                <p className="modal-desc">Syncing transactions in the background…</p>
              </div>
            )}

            {step === 'error' && (
              <div className="modal-center">
                <p className="auth-error">{errMsg}</p>
                <button className="btn-secondary" onClick={() => setStep('idle')}>Try Again</button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
