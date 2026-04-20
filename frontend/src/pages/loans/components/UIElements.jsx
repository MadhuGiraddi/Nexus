import React from 'react';
import { motion } from 'framer-motion';

// Glass Cards
export function GlassCard({ children, tier = 1, className = '', ...props }) {
  const getTierClass = () => {
    switch (tier) {
      case 2: return 'loan-card-elevated';
      case 3: return 'loan-card-gold';
      default: return 'loan-card';
    }
  };

  return (
    <motion.div 
      className={`${getTierClass()} ${className}`}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Buttons
export function PrimaryButton({ children, icon, loading, onClick, className = '', ...props }) {
  return (
    <button className={`btn-primary ${className}`} onClick={onClick} disabled={loading} {...props}>
      {loading ? (
        <span className="material-symbols-rounded spin">progress_activity</span>
      ) : (
        <>
          {children}
          {icon && <span className="material-symbols-rounded">{icon}</span>}
        </>
      )}
    </button>
  );
}

export function GhostButton({ children, onClick, className = '', ...props }) {
  return (
    <button className={`btn-ghost ${className}`} onClick={onClick} {...props}>
      {children}
    </button>
  );
}

export function IconButton({ icon, onClick, className = '', ...props }) {
  return (
    <button className={`btn-icon ${className}`} onClick={onClick} {...props}>
      <span className="material-symbols-rounded">{icon}</span>
    </button>
  );
}

// Badges
export function Badge({ children, variant = 'gold', icon, className = '' }) {
  return (
    <div className={`badge badge-${variant} ${className}`}>
      {icon && <span className="material-symbols-rounded" style={{ fontSize: '14px' }}>{icon}</span>}
      {children}
    </div>
  );
}

// Input Fields
export function InputField({ label, error, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
      {label && <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{label}</label>}
      <div style={{ position: 'relative' }}>
        <input 
          className="loan-input" 
          style={{ borderColor: error ? 'var(--error)' : undefined, boxShadow: error ? '0 0 10px rgba(255,76,76,0.2)' : undefined }}
          {...props} 
        />
      </div>
      {error && <span style={{ color: 'var(--error)', fontSize: '0.75rem', marginTop: '4px' }}>{error}</span>}
    </div>
  );
}

// Range Slider
export function RangeSlider({ value, min, max, onChange, className = '' }) {
  const percentage = ((value - min) / (max - min)) * 100;
  
  return (
    <input 
      type="range" 
      min={min} 
      max={max} 
      value={value} 
      onChange={onChange}
      className={`loan-slider ${className}`}
      style={{
        background: `linear-gradient(90deg, var(--gold) ${percentage}%, rgba(255,255,255,0.07) ${percentage}%)`
      }}
    />
  );
}

// Toggle Switch
export function ToggleSwitch({ checked, onChange }) {
  return (
    <div className={`toggle-switch ${checked ? 'on' : ''}`} onClick={() => onChange(!checked)}>
      <div className="toggle-thumb" />
    </div>
  );
}

// Progress Bar
export function ProgressBar({ value, max = 100 }) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="progress-track" style={{ width: '100%' }}>
      <div className="progress-fill" style={{ width: `${percentage}%` }} />
    </div>
  );
}

// Form Stepper
export function FormStepper({ steps, currentStep }) {
  return (
    <div className="stepper">
      {steps.map((step, idx) => {
        const isDone = idx < currentStep;
        const isActive = idx === currentStep;
        const stateClass = isActive ? 'active' : isDone ? 'done' : 'pending';
        
        return (
          <React.Fragment key={idx}>
            <div className={`step-node ${stateClass}`}>
              {isDone ? <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>check</span> : (idx + 1)}
            </div>
            {idx < steps.length - 1 && (
              <div className="step-line">
                <div className="step-line-fill" style={{ width: isDone ? '100%' : '0%' }} />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
