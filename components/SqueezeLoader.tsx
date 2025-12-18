'use client';

import React, { useEffect, useMemo } from 'react';

interface SqueezeLoaderProps {
  size?: number; // Size in pixels
  color1?: string;
  color2?: string;
  spinDuration?: number; // Duration in seconds
  squeezeDuration?: number; // Duration in seconds
  className?: string;
  containerClassName?: string;
}

export function SqueezeLoader({
  size = 60,
  color1 = '#3498db',
  color2 = '#e74c3c',
  spinDuration = 10,
  squeezeDuration = 3,
  className = '',
  containerClassName = '',
}: SqueezeLoaderProps) {
  const animationId = useMemo(() => `squeeze-loader-${Math.random().toString(36).substr(2, 9)}`, []);

  useEffect(() => {
    // Inject keyframes into document
    const styleId = `squeeze-loader-style-${animationId}`;
    let style = document.getElementById(styleId) as HTMLStyleElement;

    if (!style) {
      style = document.createElement('style');
      style.id = styleId;
      document.head.appendChild(style);
    }

    style.textContent = `
      @keyframes squeeze-${animationId} {
        0% { inset: 0 2em 2em 0; }
        12.5% { inset: 0 2em 0 0; }
        25% { inset: 2em 2em 0 0; }
        37.5% { inset: 2em 0 0 0; }
        50% { inset: 2em 0 0 2em; }
        62.5% { inset: 0 0 0 2em; }
        75% { inset: 0 0 2em 2em; }
        87.5% { inset: 0 0 2em 0; }
        100% { inset: 0 2em 2em 0; }
      }
      @keyframes spin-${animationId} {
        to { transform: rotate(-360deg); }
      }
    `;

    return () => {
      const styleToRemove = document.getElementById(styleId);
      if (styleToRemove) {
        document.head.removeChild(styleToRemove);
      }
    };
  }, [animationId]);

  return (
    <div className={`flex items-center justify-center min-h-screen w-screen ${containerClassName}`}>
      <div className={`flex justify-center ${className}`}>
        <div
          className="relative"
          style={{
            '--color1': color1,
            '--color2': color2,
            width: `${size}px`,
            height: `${size}px`,
            animation: `spin-${animationId} ${spinDuration}s infinite linear`,
          } as React.CSSProperties}
        >
          {/* First element (blue by default) */}
          <div
            className="absolute inset-0"
            style={{
              background: 'var(--color1)',
              animation: `squeeze-${animationId} ${squeezeDuration}s infinite`,
            } as React.CSSProperties}
          />

          {/* Second element (red by default) with rounded corners */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'var(--color2)',
              animation: `squeeze-${animationId} ${squeezeDuration}s infinite`,
              animationDelay: '-1.25s',
            } as React.CSSProperties}
          />
        </div>
      </div>
    </div>
  );
}

