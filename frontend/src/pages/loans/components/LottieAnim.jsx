import React, { useEffect, useRef } from 'react';

// Assumes lottie script is loaded globally via CDN
export default function LottieAnim({ path, width = '100%', height = '100%', loop = true, autoplay = true, onComplete }) {
  const containerRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    if (!window.lottie || !containerRef.current) return;

    animRef.current = window.lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'svg',
      loop: loop,
      autoplay: autoplay,
      path: path,
    });

    if (onComplete) {
      animRef.current.addEventListener('complete', () => {
        onComplete();
        if (!loop) animRef.current.destroy();
      });
    }

    return () => {
      if (animRef.current) {
        animRef.current.destroy();
      }
    };
  }, [path, loop, autoplay, onComplete]);

  return <div ref={containerRef} style={{ width, height }} className="lottie-container" />;
}
