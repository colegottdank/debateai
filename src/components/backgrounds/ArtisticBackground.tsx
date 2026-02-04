'use client';

import { useEffect, useState, useRef } from 'react';

export default function ArtisticBackground() {
  const [mounted, setMounted] = useState(false);
  const spotlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);

    // Mouse-following spotlight effect
    const handleMouseMove = (e: MouseEvent) => {
      if (spotlightRef.current) {
        const { clientX, clientY } = e;
        spotlightRef.current.style.background = `
          radial-gradient(
            600px circle at ${clientX}px ${clientY}px,
            rgba(201, 102, 74, 0.15),
            transparent 40%
          )
        `;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: -1 }}>
      {/* Base background - dark or light */}
      <div className="absolute inset-0 bg-[#0a0908] dark-only" />
      <div className="absolute inset-0 bg-[#fafafa] light-only" />
      
      {/* Animated gradient mesh */}
      <div className="gradient-mesh" />
      
      {/* Large abstract gradient orbs */}
      <div className="gradient-orb orb-1" />
      <div className="gradient-orb orb-2" />
      <div className="gradient-orb orb-3" />
      <div className="gradient-orb orb-4" />
      
      {/* Noise texture overlay */}
      <div className="noise-overlay" />
      
      {/* Mouse spotlight */}
      <div ref={spotlightRef} className="spotlight-overlay" />
      
      {/* Grid lines for depth */}
      <div className="perspective-grid" />
    </div>
  );
}
