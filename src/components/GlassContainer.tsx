import React from 'react';
import type { Theme } from '../types/media';

interface GlassContainerProps {
  children: React.ReactNode;
  theme?: Theme;
  opacity?: number;
  accentGlow?: string;
  className?: string;
  isTaskbarMode?: boolean;
}

export const GlassContainer: React.FC<GlassContainerProps> = ({
  children,
  theme = 'dark-glass',
  opacity = 0.88,
  accentGlow = 'rgba(245, 158, 11, 0.4)',
  className = '',
  isTaskbarMode = false,
}) => {
  // iPhone Liquid Glass Material definitions
  const isLight = theme === 'light-frost';
  const isMidnight = theme === 'midnight';

  const containerStyle: React.CSSProperties = {
    background: isLight
      ? `linear-gradient(135deg, rgba(255, 255, 255, ${Math.min(0.92, opacity + 0.08)}) 0%, rgba(240, 244, 252, ${opacity}) 100%)`
      : isMidnight
      ? `linear-gradient(135deg, rgba(16, 18, 26, ${opacity}) 0%, rgba(3, 4, 7, ${Math.min(1, opacity + 0.08)}) 100%)`
      : `linear-gradient(135deg, rgba(32, 35, 48, ${opacity * 0.95}) 0%, rgba(12, 14, 22, ${opacity * 1.05}) 100%)`, // Deep Smoky iPhone Dark Glass
    boxShadow: isLight
      ? `
        0 16px 40px -10px rgba(0, 0, 0, 0.18),
        0 4px 12px -2px rgba(0, 0, 0, 0.08),
        0 0 0 1px rgba(255, 255, 255, 0.8) inset,
        inset 0 1.5px 2px 0 rgba(255, 255, 255, 0.9),
        inset 0 -1.5px 2px 0 rgba(0, 0, 0, 0.06),
        0 0 24px -2px ${accentGlow}
      `
      : `
        0 24px 54px -12px rgba(0, 0, 0, 0.85),
        0 8px 20px -4px rgba(0, 0, 0, 0.6),
        0 0 0 1px rgba(255, 255, 255, 0.16),
        inset 0 1.5px 2px 0 rgba(255, 255, 255, 0.45),
        inset 0 -1.5px 2px 0 rgba(0, 0, 0, 0.6),
        inset 1.5px 0 1.5px 0 rgba(255, 255, 255, 0.18),
        inset -1.5px 0 1.5px 0 rgba(255, 255, 255, 0.08),
        0 0 28px -2px ${accentGlow}
      `,
  };

  const roundedClass = isTaskbarMode ? 'rounded-[16px]' : 'rounded-[26px]';

  return (
    <div
      data-tauri-drag-region
      className={`relative w-full h-full ${roundedClass} backdrop-blur-[36px] backdrop-saturate-[220%] backdrop-contrast-[105%] transition-all duration-300 ease-out select-none overflow-hidden ${
        isLight ? 'text-neutral-900' : 'text-white'
      } ${className}`}
      style={containerStyle}
    >
      {/* iOS Liquid Glass Diagonal Specular Glare */}
      <div
        data-tauri-drag-region
        className="pointer-events-none absolute -inset-full opacity-60 mix-blend-overlay"
        style={{
          background: isLight
            ? 'radial-gradient(circle at 35% 20%, rgba(255, 255, 255, 0.6) 0%, transparent 60%)'
            : 'radial-gradient(circle at 30% 15%, rgba(255, 255, 255, 0.22) 0%, transparent 55%)',
        }}
      />

      {/* Razor-sharp top glass rim highlight (Apple iOS Specular Edge) */}
      <div
        data-tauri-drag-region
        className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/70 to-transparent"
      />

      {/* Subtle bottom glass reflection */}
      <div
        data-tauri-drag-region
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"
      />

      {/* Organic Silicate Micro-Texture Noise Overlay */}
      <div
        data-tauri-drag-region
        className="pointer-events-none absolute inset-0 opacity-[0.035] mix-blend-overlay bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px]"
      />

      {/* Content wrapper */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
};
