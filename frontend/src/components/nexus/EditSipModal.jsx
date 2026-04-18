import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings2 } from 'lucide-react';
import { investAPI } from '../../services/api';

export default function EditSipModal({ open, onClose, onSuccess, sip }) {
  const [amount, setAmount] = useState('');
  const [autoEscalate, setAutoEscalate] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (sip) {
      setAmount(sip.amount);
      setAutoEscalate(sip.autoEscalation || 0);
    }
  }, [sip]);

  if (!open || !sip) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await investAPI.updateSip(sip._id, {
        amount: Number(amount),
        autoEscalation: Number(autoEscalate)
      });
      setSaving(false);
      onSuccess();
      onClose();
    } catch (e) {
      console.error(e);
      setSaving(false);
      alert('Failed to update SIP configuration.');
    }
  };

  return (
    <AnimatePresence>
      <motion.div className="modal-backdrop" onClick={onClose}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div className="modal-box glass-card"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={e => e.stopPropagation()}
        >
          <button className="modal-close btn-icon" onClick={onClose}><X size={18} /></button>
          
          <form onSubmit={handleSave} style={{ padding: '10px' }}>
             <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <Settings2 size={32} style={{ color: 'var(--accent)', margin: '0 auto 12px' }} />
                <h3>Edit SIP</h3>
                <p style={{ fontSize: '13px', color: '#B4B4C4' }}>{sip.assetName} • {sip.frequency}</p>
             </div>

             <div className="field-group">
                <label className="field-label">Amount (₹)</label>
                <input type="number" className="field-input" value={amount} onChange={e => setAmount(e.target.value)} required />
             </div>

             <div className="field-group">
                <label className="field-label">Auto-Escalation (%)</label>
                <input type="range" min="0" max="25" step="5" value={autoEscalate} onChange={e => setAutoEscalate(e.target.value)} style={{ width: '100%', marginBottom: '8px' }} />
                <p style={{ fontSize: '12px', color: '#B4B4C4' }}>Increase SIP by {autoEscalate}% every year.</p>
             </div>

             <button className="btn-primary btn-full" type="submit" disabled={saving} style={{ marginTop: '24px' }}>
               {saving ? 'Saving...' : 'Update Configuration'}
             </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
