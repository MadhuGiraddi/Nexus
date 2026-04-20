import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { loansAPI } from '../../../services/api';
import { GlassCard, FormStepper, InputField, PrimaryButton, GhostButton, ToggleSwitch } from '../components/UIElements';

const STEP_LABELS = ['Personal Info', 'Loan Details', 'Documents', 'Review'];

const PURPOSE_RATES = {
  'Personal': 11.2,
  'Home': 7.8,
  'Education': 6.5,
  'Business': 13.5,
  'Portfolio-Backed': 4.2
};

const DOC_KEYWORDS = {
  'Government ID': ['id', 'government', 'passport', 'license', 'identity'],
  '6-Month Bank Statement': ['bank', 'statement', 'months', '6-month', 'trans', 'record'],
  'Wealth Proof': ['wealth', 'proof', 'asset', 'investment', 'portfolio', 'holding'],
  'Pay Stub': ['pay', 'stub', 'salary', 'payslip', 'income'],
  'ITR / Form 16': ['tax', 'return', 'itr', 'form16', 'form 16', 'income tax']
};

export default function Application() {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedLoan, setSubmittedLoan] = useState(null);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    fullName: '', ssn: '', dob: '',
    principal: 500000, months: 36, interest: PURPOSE_RATES['Personal'], purpose: 'Personal',
    bankLinked: false, docUploaded: false,
    documents: [], 
    isNonTaxpayer: false,
  });

  const [uploading, setUploading] = useState(false);

  const REQUIRED_DOCS = form.isNonTaxpayer 
    ? ['Government ID', '6-Month Bank Statement', 'Wealth Proof']
    : ['Government ID', 'Pay Stub', 'Tax Return (W-2)'];

  const allDocsUploaded = React.useMemo(() => {
    return REQUIRED_DOCS.every(doc => {
      const keywords = DOC_KEYWORDS[doc] || [doc.split(' ')[0].toLowerCase()];
      return (form.documents || []).some(d => {
        const fileName = (d.name || '').toLowerCase();
        return keywords.some(k => fileName.includes(k));
      });
    });
  }, [form.documents, REQUIRED_DOCS]);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    files.forEach(f => formData.append('docs', f));

    try {
      const { data } = await loansAPI.upload(formData);
      setForm(prev => ({ 
        ...prev, 
        documents: [...prev.documents, ...data.files],
        docUploaded: true 
      }));
    } catch (err) {
      setError('File upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const set = (k, v) => {
    setForm(prev => {
      const next = { ...prev, [k]: v };
      if (k === 'purpose') {
         next.interest = PURPOSE_RATES[v] || 10.5;
      }
      return next;
    });
  };

  const r = form.interest / 12 / 100;
  // Precise EMI formula: P * r * (1+r)^n / ((1+r)^n - 1)
  const emi = r > 0 
    ? (form.principal * r * Math.pow(1 + r, form.months)) / (Math.pow(1 + r, form.months) - 1)
    : form.principal / form.months;

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const { data } = await loansAPI.apply({
        principalAmount: form.principal,
        durationMonths: form.months,
        interestRate: form.interest,
        emiAmount: Math.round(emi),
        purpose: form.purpose,
        documents: form.documents,
      });
      setSubmittedLoan(data);
      setSubmitted(true);
    } catch (e) {
      setError(e?.response?.data?.error || 'Could not submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const slideVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
    exit:    { opacity: 0, y: -20, transition: { duration: 0.2 } },
  };

  if (submitted && submittedLoan) {
    return (
      <div className="loan-max-w" style={{ maxWidth: 720, textAlign: 'center' }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
          <GlassCard tier={submittedLoan.autoApproved ? 3 : 2} style={{ padding: 56 }}>
            <span className="material-symbols-rounded" style={{
              fontSize: 72, marginBottom: 24, display: 'block',
              color: submittedLoan.autoApproved ? 'var(--success)' : 'var(--warning)',
              filter: `drop-shadow(0 0 24px ${submittedLoan.autoApproved ? 'var(--success)' : 'var(--warning)'})`
            }}>
              {submittedLoan.autoApproved ? 'check_circle' : 'schedule'}
            </span>
            <h2 className="type-h1" style={{ marginBottom: 12 }}>
              {submittedLoan.autoApproved ? '🎉 Approved Instantly!' : 'Application Submitted'}
            </h2>
            <p className="type-body" style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
              {submittedLoan.autoApproved
                ? `Your Nexus Health Score qualified you for instant approval. Your ₹${Number(submittedLoan.loan.principalAmount).toLocaleString()} loan is approved at ${form.interest}% APR.`
                : `Your application for ₹${Number(submittedLoan.loan.principalAmount).toLocaleString()} is under review. Nexus AI will process it shortly.`
              }
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 8 }}>
              <span className="type-micro" style={{ padding: '4px 12px', borderRadius: 'var(--r-full)', background: 'rgba(245,184,0,0.1)', border: '1px solid rgba(245,184,0,0.3)', color: 'var(--gold)' }}>
                EMI: ₹{Math.round(emi).toLocaleString()}/mo
              </span>
              <span className="type-micro" style={{ padding: '4px 12px', borderRadius: 'var(--r-full)', background: 'rgba(0,194,255,0.1)', border: '1px solid rgba(0,194,255,0.3)', color: 'var(--blue)' }}>
                {form.months} months
              </span>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="loan-max-w loan-section">
      <div style={{ marginBottom: 32 }}>
        <p className="type-micro" style={{ color: 'var(--gold)', marginBottom: 10 }}>LOAN APPLICATION</p>
        <h1 className="type-h1">Apply for Financing</h1>
        <p className="type-body" style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
          Your Nexus Health Score determines instant approval eligibility.
        </p>
      </div>

      <FormStepper steps={STEP_LABELS} currentStep={step} />

      <AnimatePresence mode="wait">
        <motion.div key={step} variants={slideVariants} initial="initial" animate="animate" exit="exit">
          <GlassCard tier={2} style={{ padding: 40, marginTop: 8 }}>

            {/* Step 0 — Personal Info */}
            {step === 0 && (
              <div>
                <h3 className="type-h3" style={{ marginBottom: 24 }}>Identity Verification</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 32 }}>
                  <InputField label="Full Legal Name" placeholder="Your full name" value={form.fullName} onChange={e => set('fullName', e.target.value)} />
                  <InputField label="Date of Birth" placeholder="MM/DD/YYYY" value={form.dob} onChange={e => set('dob', e.target.value)} />
                  <InputField label="Aadhaar (last 4)" placeholder="XXXX" maxLength={4} value={form.ssn} onChange={e => set('ssn', e.target.value)} />
                </div>
                <PrimaryButton onClick={() => setStep(1)} disabled={!form.fullName || !form.dob} style={{ width: '100%' }}>
                  Continue
                </PrimaryButton>
              </div>
            )}

            {/* Step 1 — Loan Details */}
            {step === 1 && (
              <div>
                <h3 className="type-h3" style={{ marginBottom: 24 }}>Loan Parameters</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginBottom: 32 }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span className="type-small" style={{ fontWeight: 600 }}>Loan Amount</span>
                      <span className="type-num" style={{ color: 'var(--gold)', fontSize: '1.1rem' }}>₹{Number(form.principal).toLocaleString()}</span>
                    </div>
                    <input type="range" min={50000} max={5000000} step={10000} value={form.principal} onChange={e => set('principal', Number(e.target.value))} className="loan-slider"
                      style={{ background: `linear-gradient(90deg, var(--gold) ${((form.principal-50000)/4950000)*100}%, rgba(255,255,255,0.07) ${((form.principal-50000)/4950000)*100}%)` }}
                    />
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span className="type-small" style={{ fontWeight: 600 }}>Duration</span>
                      <span className="type-num" style={{ color: 'var(--gold)', fontSize: '1.1rem' }}>{form.months} months</span>
                    </div>
                    <input type="range" min={12} max={120} step={12} value={form.months} onChange={e => set('months', Number(e.target.value))} className="loan-slider"
                      style={{ background: `linear-gradient(90deg, var(--gold) ${((form.months-12)/108)*100}%, rgba(255,255,255,0.07) ${((form.months-12)/108)*100}%)` }}
                    />
                  </div>
                  <div>
                    <label className="type-small" style={{ fontWeight: 600, display: 'block', marginBottom: 8 }}>Loan Purpose</label>
                    <select className="loan-input" style={{ appearance: 'none' }} value={form.purpose} onChange={e => set('purpose', e.target.value)}>
                      {['Personal', 'Home', 'Education', 'Business', 'Portfolio-Backed'].map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ padding: '16px 20px', background: 'rgba(245,184,0,0.06)', borderRadius: 'var(--r-md)', border: '1px solid rgba(245,184,0,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p className="type-micro" style={{ color: 'var(--text-muted)' }}>ESTIMATED MONTHLY EMI</p>
                      <p className="type-num" style={{ fontSize: '2rem', color: 'var(--gold)', lineHeight: 1.2 }}>₹{Math.round(emi).toLocaleString()}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p className="type-micro" style={{ color: 'var(--text-muted)' }}>INTEREST RATE</p>
                      <p className="type-num" style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>{form.interest}% APR</p>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <GhostButton onClick={() => setStep(0)} style={{ flex: 1 }}>Back</GhostButton>
                  <PrimaryButton onClick={() => setStep(2)} style={{ flex: 2 }}>Continue</PrimaryButton>
                </div>
              </div>
            )}

            {/* Step 2 — Documents */}
            {step === 2 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                  <h3 className="type-h3">Financial Verification</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="type-micro" style={{ color: form.isNonTaxpayer ? 'var(--gold)' : 'var(--text-muted)' }}>Non-Taxpayer</span>
                    <ToggleSwitch checked={form.isNonTaxpayer} onChange={(v) => set('isNonTaxpayer', v)} />
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--r-xl)', padding: 24, border: '1px solid var(--border-subtle)', marginBottom: 24 }}>
                   <p className="type-micro" style={{ color: 'var(--text-muted)', marginBottom: 16 }}>Required Checklist</p>
                   {REQUIRED_DOCS.map(doc => {
                     const keywords = DOC_KEYWORDS[doc] || [doc.split(' ')[0].toLowerCase()];
                     const isDone = form.documents.some(d => keywords.some(k => d.name.toLowerCase().includes(k)));
                     return (
                       <div key={doc} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                         <span className="material-symbols-rounded" style={{ color: isDone ? 'var(--success)' : 'var(--text-muted)', fontSize: 20 }}>
                           {isDone ? 'check_circle' : 'radio_button_unchecked'}
                         </span>
                         <span style={{ fontSize: '0.9rem', color: isDone ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{doc}</span>
                       </div>
                     );
                   })}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
                  <div
                    style={{ padding: 28, borderRadius: 'var(--r-lg)', border: `1px ${form.docUploaded ? 'solid var(--success)' : 'dashed var(--border-strong)'}`, background: form.docUploaded ? 'rgba(0,230,118,0.05)' : 'rgba(255,255,255,0.02)', position: 'relative', display: 'flex', alignItems: 'center', gap: 16, transition: 'all 0.3s' }}>
                    <span className="material-symbols-rounded" style={{ fontSize: 36, color: form.docUploaded ? 'var(--success)' : 'var(--purple)' }}>{uploading ? 'sync' : 'document_scanner'}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600 }}>{uploading ? 'Uploading...' : form.docUploaded ? `${form.documents.length} Files Selected` : 'Click to Upload Files'}</p>
                      <p className="type-small" style={{ color: 'var(--text-secondary)' }}>Include government ID and income proof</p>
                    </div>
                    <input 
                      type="file" 
                      multiple 
                      onChange={handleFileUpload}
                      style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                      disabled={uploading}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <GhostButton onClick={() => setStep(1)} style={{ flex: 1 }}>Back</GhostButton>
                  <PrimaryButton onClick={() => setStep(3)} disabled={!form.bankLinked && !allDocsUploaded} style={{ flex: 2 }}>Continue</PrimaryButton>
                </div>
              </div>
            )}

            {/* Step 3 — Review & Submit */}
            {step === 3 && (
              <div>
                <h3 className="type-h3" style={{ marginBottom: 24 }}>Review & Submit</h3>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                   {[
                     { label: 'Applicant', val: form.fullName },
                     { label: 'Loan Amount', val: `₹${Number(form.principal || 0).toLocaleString()}` },
                     { label: 'Duration', val: `${form.months || 0} months` },
                     { label: 'Interest Rate', val: `${form.interest || 0}% APR` },
                     { label: 'Monthly EMI', val: `₹${Math.round(emi || 0).toLocaleString()}` },
                     { label: 'Purpose', val: form.purpose },
                     { label: 'Total Repayment', val: `₹${Math.round((emi || 0) * (form.months || 0)).toLocaleString()}` },
                   ].map(({ label, val }) => (
                     <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                       <span className="type-small" style={{ color: 'var(--text-muted)' }}>{label}</span>
                       <span className="type-num" style={{ fontSize: '0.9rem', fontWeight: 600 }}>{val}</span>
                     </div>
                   ))}
                 </div>
                {error && (
                  <div style={{ padding: '12px 16px', borderRadius: 'var(--r-md)', background: 'rgba(255,76,76,0.1)', border: '1px solid rgba(255,76,76,0.3)', color: 'var(--error)', fontSize: '0.85rem', marginBottom: 16 }}>
                    {error}
                  </div>
                )}
                <p className="type-micro" style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
                  By submitting, Nexus will compute your Health Score and determine instant approval eligibility. No hard credit inquiry.
                </p>
                <div style={{ display: 'flex', gap: 12 }}>
                  <GhostButton onClick={() => setStep(2)} style={{ flex: 1 }}>Back</GhostButton>
                  <PrimaryButton onClick={handleSubmit} loading={submitting} style={{ flex: 2 }}>Submit Application</PrimaryButton>
                </div>
              </div>
            )}
          </GlassCard>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
