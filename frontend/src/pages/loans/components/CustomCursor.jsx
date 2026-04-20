import React, { useEffect, useRef, useState } from 'react';

export default function CustomCursor() {
  const ringRef = useRef(null);
  const dotRef  = useRef(null);
  
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);

  // Mouse coords
  const mouse = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const ringPos = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });

  useEffect(() => {
    // Only run on non-touch devices
    if (window.matchMedia('(pointer: coarse)').matches) return;

    let reqId;
    const onMouseMove = (e) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
      
      if (dotRef.current) {
        dotRef.current.style.left = `${e.clientX}px`;
        dotRef.current.style.top  = `${e.clientY}px`;
      }
    };

    const render = () => {
      // Lag logic for ring
      ringPos.current.x += (mouse.current.x - ringPos.current.x) * 0.12;
      ringPos.current.y += (mouse.current.y - ringPos.current.y) * 0.12;
      
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(calc(${ringPos.current.x}px - 50%), calc(${ringPos.current.y}px - 50%), 0)`;
      }
      
      reqId = requestAnimationFrame(render);
    };

    const onMouseDown = () => setIsClicking(true);
    const onMouseUp   = () => setIsClicking(false);

    // Hover detection for interactive elements
    const handleMouseOver = (e) => {
      const target = e.target.closest('button, a, input, select, textarea, .hoverable, .loan-card, .loan-card-elevated, .loan-card-gold');
      if (target) setIsHovering(true);
    };
    const handleMouseOut = (e) => {
      const target = e.target.closest('button, a, input, select, textarea, .hoverable, .loan-card, .loan-card-elevated, .loan-card-gold');
      if (target) setIsHovering(false);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);
    
    reqId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      cancelAnimationFrame(reqId);
    };
  }, []);

  if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) {
    return null; // hide on mobile
  }

  return (
    <>
      <div 
        ref={ringRef} 
        className={`custom-cursor-ring ${isHovering ? 'hover' : ''} ${isClicking ? 'click' : ''}`}
      />
      <div ref={dotRef} className="custom-cursor-dot" />
    </>
  );
}
