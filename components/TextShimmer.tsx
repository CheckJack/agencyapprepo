'use client';
import React, { useMemo, useEffect, type JSX } from 'react';
import { cn } from '@/lib/utils';

interface TextShimmerProps {
  children: string;
  as?: React.ElementType;
  className?: string;
  duration?: number;
  spread?: number;
  baseColor?: string;
  gradientColor?: string;
}

export function TextShimmer({
  children,
  as: Component = 'p',
  className,
  duration = 2,
  spread = 2,
  baseColor,
  gradientColor,
}: TextShimmerProps) {
  const dynamicSpread = useMemo(() => {
    return children.length * spread;
  }, [children, spread]);

  const finalBaseColor = baseColor || '#a1a1aa';
  const finalGradientColor = gradientColor || '#000';

  // Build the background gradient
  const bgGradient = `linear-gradient(90deg, #0000 calc(50% - var(--spread)), ${finalGradientColor}, #0000 calc(50% + var(--spread)))`;
  const baseGradient = `linear-gradient(${finalBaseColor}, ${finalBaseColor})`;

  // Create unique animation name
  const animationId = useMemo(() => `shimmer-${Math.random().toString(36).substr(2, 9)}`, []);

  useEffect(() => {
    // Inject keyframes into document
    const styleId = `shimmer-style-${animationId}`;
    let style = document.getElementById(styleId) as HTMLStyleElement;
    
    if (!style) {
      style = document.createElement('style');
      style.id = styleId;
      document.head.appendChild(style);
    }
    
    style.textContent = `
      @keyframes ${animationId} {
        from {
          background-position: 100% 50%, 0% 0%;
        }
        to {
          background-position: 0% 50%, 0% 0%;
        }
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
    <Component
      className={cn(
        'relative inline-block bg-clip-text text-transparent',
        className
      )}
      style={
        {
          '--spread': `${dynamicSpread}px`,
          ...(baseColor && {
            '--base-color': finalBaseColor,
            '--base-gradient-color': finalGradientColor,
            '--bg': bgGradient,
          }),
          backgroundImage: baseColor
            ? `${bgGradient}, ${baseGradient}`
            : `var(--bg), linear-gradient(var(--base-color), var(--base-color))`,
          backgroundSize: '250% 100%, auto',
          backgroundRepeat: 'no-repeat, repeat',
          backgroundPosition: '100% 50%, 0% 0%',
          animation: `${animationId} ${duration}s linear infinite`,
        } as React.CSSProperties
      }
    >
      {children}
    </Component>
  );
}

