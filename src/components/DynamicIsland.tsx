import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Music,
  Maximize2,
  PanelBottom,
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import type { MediaState, Theme } from '../types/media';
import { Equalizer } from './Equalizer';

interface DynamicIslandProps {
  media: MediaState;
  accentHex: string;
  accentGlow: string;
  theme?: Theme;
  opacity?: number;
  reducedMotion?: boolean;
  hoverExpand?: boolean;
  hoverDelayMs?: number;
  capsuleSize?: 'compact' | 'standard' | 'large';
  onTogglePlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onExpand: () => void;
  onOpenSettings: () => void;
  onDockToTaskbar?: () => void;
}

export const DynamicIsland: React.FC<DynamicIslandProps> = ({
  media,
  accentHex,
  accentGlow,
  theme = 'dark-glass',
  opacity = 0.88,
  reducedMotion = false,
  hoverExpand = true,
  hoverDelayMs = 400,
  capsuleSize = 'standard',
  onTogglePlayPause,
  onNext,
  onPrev,
  onExpand,
  onOpenSettings,
  onDockToTaskbar,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isPlaying = media.status === 'Playing';
  const songTitle = media.title || 'Dynamic Island';

  // Capsule default compact width based on user preference
  const compactWidth = capsuleSize === 'compact' ? 220 : capsuleSize === 'large' ? 276 : 248;
  const expandedWidth = 376;
  const currentWidth = isHovered && hoverExpand ? expandedWidth : compactWidth;

  const handleMouseEnter = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      setIsHovered(false);
    }, hoverDelayMs);
  };

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    };
  }, []);

  // Native window dragging handler on the entire pill (with smooth mousemove fallback)
  const handleDragMouseDown = async (e: React.MouseEvent) => {
    if (e.button !== 0) return;

    // 1. Trigger native OS dragging
    try {
      await invoke('start_dragging');
    } catch {
      // Fallback
    }

    // 2. Active mousemove fallback tracker to guarantee dragging everywhere
    let lastX = e.screenX;
    let lastY = e.screenY;

    const handleMouseMove = async (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.screenX - lastX;
      const deltaY = moveEvent.screenY - lastY;
      lastX = moveEvent.screenX;
      lastY = moveEvent.screenY;

      if (Math.abs(deltaX) > 0 || Math.abs(deltaY) > 0) {
        try {
          await invoke('move_window', { deltaX, deltaY });
        } catch {
          // Fallback
        }
      }
    };

    const handleMouseUp = async () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      try {
        const win = getCurrentWindow();
        const pos = await win.outerPosition();
        const factor = await win.scaleFactor();
        await invoke('save_position', {
          x: Math.round(pos.x / factor),
          y: Math.round(pos.y / factor),
        });
      } catch {
        // Fallback
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Measure title overflow to trigger smooth ping-pong marquee
  const titleContainerRef = useRef<HTMLDivElement>(null);
  const titleTextRef = useRef<HTMLSpanElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [scrollDist, setScrollDist] = useState(0);

  useEffect(() => {
    if (titleContainerRef.current && titleTextRef.current) {
      const containerW = titleContainerRef.current.clientWidth;
      const textW = titleTextRef.current.scrollWidth;
      if (textW > containerW + 4) {
        setIsOverflowing(true);
        setScrollDist(textW - containerW + 10);
      } else {
        setIsOverflowing(false);
        setScrollDist(0);
      }
    }
  }, [songTitle, currentWidth]);

  const isLight = theme === 'light-frost';
  const isMidnight = theme === 'midnight';

  const islandBgStyle: React.CSSProperties = {
    background: isLight
      ? `linear-gradient(135deg, rgba(255, 255, 255, ${Math.min(0.92, opacity + 0.08)}) 0%, rgba(240, 244, 252, ${opacity}) 100%)`
      : isMidnight
      ? `linear-gradient(135deg, rgba(16, 18, 26, ${opacity}) 0%, rgba(3, 4, 7, ${Math.min(1, opacity + 0.08)}) 100%)`
      : `linear-gradient(135deg, rgba(30, 32, 44, ${opacity * 0.95}) 0%, rgba(10, 12, 18, ${opacity * 1.05}) 100%)`,
    boxShadow: isLight
      ? `
        0 16px 36px -8px rgba(0, 0, 0, 0.16),
        0 4px 12px -2px rgba(0, 0, 0, 0.08),
        0 0 0 1px rgba(255, 255, 255, 0.8) inset,
        inset 0 1.5px 2px 0 rgba(255, 255, 255, 0.9),
        inset 0 -1.5px 2px 0 rgba(0, 0, 0, 0.06),
        0 0 20px -2px ${accentGlow}
      `
      : `
        0 20px 48px -10px rgba(0, 0, 0, 0.9),
        0 6px 16px -3px rgba(0, 0, 0, 0.65),
        0 0 0 1px rgba(255, 255, 255, 0.16),
        inset 0 1.5px 2px 0 rgba(255, 255, 255, 0.45),
        inset 0 -1.5px 2px 0 rgba(0, 0, 0, 0.6),
        inset 1.5px 0 1.5px 0 rgba(255, 255, 255, 0.18),
        inset -1.5px 0 1.5px 0 rgba(255, 255, 255, 0.08),
        0 0 24px -2px ${accentGlow}
      `,
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-0 m-0 bg-transparent overflow-hidden">
      {/* Entire Capsule is Fully Draggable */}
      <div
        data-tauri-drag-region
        onMouseDown={handleDragMouseDown}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onDoubleClick={onExpand}
        className={`group relative flex items-center justify-between h-[44px] px-2.5 py-1 gap-2.5 rounded-full backdrop-blur-[36px] backdrop-saturate-[220%] select-none cursor-grab active:cursor-grabbing transition-all duration-300 ease-out ${
          isLight ? 'text-neutral-900' : 'text-white'
        }`}
        style={{
          ...islandBgStyle,
          width: `${currentWidth}px`,
        }}
        title="Drag anywhere to move • Double-click to expand"
      >
        {/* Top razor-sharp specular edge reflection */}
        <div
          data-tauri-drag-region
          className="pointer-events-none absolute inset-x-4 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/70 to-transparent"
        />

        {/* Left: Spinning Vinyl Disc / Album Artwork (also draggable) */}
        <div
          data-tauri-drag-region
          onMouseDown={handleDragMouseDown}
          className="relative flex-shrink-0 w-8 h-8 rounded-full overflow-hidden bg-neutral-950 ring-1 ring-white/25 shadow-md cursor-grab active:cursor-grabbing hover:scale-105 transition-all duration-200"
        >
          {media.artwork ? (
            <img
              src={media.artwork}
              alt="Album Artwork"
              draggable={false}
              className={`w-full h-full object-cover pointer-events-none select-none ${
                isPlaying && !reducedMotion ? 'animate-spin' : ''
              }`}
              style={{ animationDuration: '8s' }}
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-950 text-neutral-400">
              <Music className="w-4 h-4 opacity-70" />
            </div>
          )}

          {/* Vinyl Center Hole Spindle */}
          <div className="pointer-events-none absolute inset-0 m-auto w-2 h-2 rounded-full bg-black ring-1 ring-white/30" />
          {/* Vinyl Gloss Sheen */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-white/10" />
        </div>

        {/* Center: ONLY THE SONG NAME (moving marquee if too long, fully draggable) */}
        <div
          ref={titleContainerRef}
          data-tauri-drag-region
          onMouseDown={handleDragMouseDown}
          className="relative flex-1 min-w-0 overflow-hidden select-none cursor-grab active:cursor-grabbing leading-none flex items-center"
          style={
            isOverflowing
              ? {
                  maskImage: 'linear-gradient(90deg, transparent 0%, black 6px, black calc(100% - 8px), transparent 100%)',
                  WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, black 6px, black calc(100% - 8px), transparent 100%)',
                }
              : undefined
          }
        >
          <span
            ref={titleTextRef}
            data-tauri-drag-region
            className={`inline-block font-semibold text-[13px] text-white tracking-tight whitespace-nowrap drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] ${
              isOverflowing ? 'animate-marquee-pingpong' : 'truncate'
            }`}
            style={
              isOverflowing
                ? ({
                    '--scroll-dist': `-${scrollDist}px`,
                    animationDuration: `${Math.max(5, songTitle.length * 0.28)}s`,
                  } as React.CSSProperties)
                : undefined
            }
            title={songTitle}
          >
            {songTitle}
          </span>
        </div>

        {/* Hover-revealed Skip Controls (Buttons stop drag propagation) */}
        {isHovered && hoverExpand && (
          <div
            className="flex items-center gap-1 flex-shrink-0 animate-in fade-in zoom-in-95 duration-200"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPrev();
              }}
              className="w-6 h-6 flex items-center justify-center rounded-full bg-white/[0.08] hover:bg-white/[0.2] border border-white/15 backdrop-blur-md text-neutral-200 hover:text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] active:scale-90 transition-all cursor-pointer"
              title="Previous Track"
            >
              <SkipBack className="w-3 h-3 fill-current" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onNext();
              }}
              className="w-6 h-6 flex items-center justify-center rounded-full bg-white/[0.08] hover:bg-white/[0.2] border border-white/15 backdrop-blur-md text-neutral-200 hover:text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] active:scale-90 transition-all cursor-pointer"
              title="Next Track"
            >
              <SkipForward className="w-3 h-3 fill-current" />
            </button>
          </div>
        )}

        {/* Play / Pause Amber Gemstone Button (Stops drag propagation) */}
        <div className="flex items-center flex-shrink-0" onMouseDown={(e) => e.stopPropagation()}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTogglePlayPause();
            }}
            className="relative w-7 h-7 flex items-center justify-center rounded-full text-black active:scale-90 hover:scale-105 transition-all duration-150 cursor-pointer overflow-hidden shadow-md"
            style={{
              background: `linear-gradient(135deg, #FEF08A 0%, ${accentHex} 48%, #D97706 100%)`,
              boxShadow: `
                inset 0 1.5px 1.5px rgba(255, 255, 255, 0.85),
                inset 0 -1.5px 1.5px rgba(0, 0, 0, 0.4),
                0 0 14px ${accentHex}99,
                0 3px 8px rgba(0, 0, 0, 0.5)
              `,
            }}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent" />
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5 fill-current drop-shadow-sm" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current ml-0.5 drop-shadow-sm" />
            )}
          </button>
        </div>

        {/* Hover-revealed Equalizer Waveform */}
        {isHovered && hoverExpand && (
          <div
            className="flex items-center flex-shrink-0 pl-0.5 animate-in fade-in zoom-in-95 duration-200"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <Equalizer
              isPlaying={isPlaying}
              accentHex={accentHex}
              barCount={8}
              reducedMotion={reducedMotion}
            />
          </div>
        )}

        {/* Rightmost Controls: Quick Dock & Diagonal Expand (Settings) */}
        <div
          className="flex items-center gap-0.5 flex-shrink-0"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {onDockToTaskbar && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDockToTaskbar();
              }}
              className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Dock into Taskbar"
            >
              <PanelBottom className="w-3 h-3" />
            </button>
          )}

          {/* Diagonal Expand Icon — Opens Settings Window */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenSettings();
            }}
            className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
            title="AURA Settings"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
