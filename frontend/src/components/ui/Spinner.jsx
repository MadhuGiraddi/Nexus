import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Spinner({ size = 24, className = '' }) {
  return <Loader2 size={size} className={`spin ${className}`} style={{ color: 'var(--accent)' }} />;
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`glass-card skeleton-card ${className}`}>
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-value" />
      <div className="skeleton skeleton-bar" />
    </div>
  );
}
