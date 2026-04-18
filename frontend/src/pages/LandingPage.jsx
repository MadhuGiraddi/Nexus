import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useAuth } from '../context/AuthContext';
import nexusBg from '../assets/nexus_bg.png';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const textRef = useRef(null);
  const containerRef = useRef(null);
  const btnRef = useRef(null);
  const bgRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Initial State
      gsap.set(textRef.current, { 
        opacity: 0, 
        scale: 1.2,
        filter: "blur(60px)",
        letterSpacing: "40px"
      });
      gsap.set(btnRef.current, { opacity: 0, y: 20 });
      gsap.set(bgRef.current, { scale: 1.2, opacity: 0 });

      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
      
      // 2. Entrance Sequence
      tl.to(bgRef.current, {
        opacity: 1,
        duration: 2,
        ease: "power2.inOut"
      })
      .to(textRef.current, {
        opacity: 1,
        scale: 1,
        filter: "blur(0px)",
        letterSpacing: "12px",
        duration: 3,
      }, "-=1")
      .to(btnRef.current, {
        opacity: 1,
        y: 0,
        duration: 1.5,
      }, "-=1.5");

      // 3. Kinetic Background Animation (Slow drift/zoom)
      gsap.to(bgRef.current, {
        scale: 1.05,
        x: -20,
        y: -10,
        duration: 20,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });

      // 4. Branding Breath
      gsap.to(textRef.current, {
        scale: 1.03,
        duration: 4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className="landing-root" ref={containerRef}>
      {/* Kinetic Background Image */}
      <div className="bg-container">
        <img 
          ref={bgRef}
          src={nexusBg} 
          alt="" 
          className="kinetic-bg" 
        />
        <div className="bg-overlay" />
      </div>

      <div className="content-center">
        <div className="branding-wrap">
          <span className="brand-tag">NEXUS OPERATING SYSTEM</span>
          <h1 className="nexus-hero-text" ref={textRef}>
            NEXUS
          </h1>
        </div>
        
        <div className="button-wrap" ref={btnRef}>
          <button 
            className="professional-btn"
            onClick={() => navigate('/auth')}
          >
            <span className="btn-glow" />
            <span className="btn-text">ACCESS TERMINAL</span>
            <span className="btn-shimmer" />
          </button>
        </div>
      </div>
    </div>
  );
}
