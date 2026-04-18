import React, { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, animate } from 'framer-motion';

export default function AnimatedNumber({ value = 0, prefix = '', suffix = '', decimals = 2, className = '' }) {
  const ref  = useRef(null);
  const prev = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const from = prev.current;
    const to   = value;
    prev.current = to;

    const controls = animate(from, to, {
      duration: 1.2,
      ease: [0.16, 1, 0.3, 1],
      onUpdate(v) {
        el.textContent = prefix + v.toLocaleString('en-US', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }) + suffix;
      },
    });
    return controls.stop;
  }, [value, prefix, suffix, decimals]);

  return (
    <span
      ref={ref}
      className={className}
    >
      {prefix}{value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}
    </span>
  );
}
