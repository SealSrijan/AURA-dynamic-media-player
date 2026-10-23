import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Music,
  ArrowUpRight,
  Settings as SettingsIcon,
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import type { MediaState, Theme } from '../types/media';
import { Equalizer } from './Equalizer';

interface TaskbarPlayerProps {
  media: MediaState;
  accentHex: string;
  accentGlow: string;
  theme?: Theme;
  opacity?: number;
  reducedMotion?: boolean;
  onTogglePlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onExpand: () => void;
  onOpenSettings: () => void;
  onUndock?: () => void;
}

export const TaskbarPlayer: React.FC<TaskbarPlayerProps> = ({
  media,
  accentHex,
  accentGlow,
  theme = 'dark-glass',
  opacity = 0.92,
  reducedMotion = false,
  onTogglePlayPause,
  onNext,
  onPrev,
  onExpand,
  onOpenSettings,
  onUndock,
}) => {
  const isPlaying = media.status === 'Playing';

  const handleDragMouseDown = async (e: React.MouseEvent) => {
    if (e.button !== 0) return;

    try {
      await invoke('start_dragging');
    } catch {
      // Fallback
    }

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

  const isLight = theme === 'light-frost';

  return (
    <div className="w-full h-full flex items-center justify-center p-0 m-0 bg-transparent overflow-hidden">
      <div
        data-tauri-drag-region
        onMouseDown={handleDragMouseDown}
        className="group relative flex items-center justify-between w-[276px] h-[38px] px-2.5 py-1 gap-2 rounded-[14px] backdrop-blur-[36px] backdrop-saturate-[220%] select-none cursor-grab active:cursor-grabbing transition-all duration-200"
        style={{
          background: isLight
            ? `linear-gradient(135deg, rgba(255, 255, 255, ${opacity}) 0%, rgba(240, 244, 252, ${opacity}) 100%)`
            : `linear-gradient(135deg, rgba(26, 29, 40, ${opacity * 0.95}) 0%, rgba(8, 10, 16, ${opacity * 1.05}) 100%)`,
          boxShadow: `
            0 12px 30px -6px rgba(0, 0, 0, 0.8),
            0 0 0 1px rgba(255, 255, 255, 0.15),
            inset 0 1px 1px 0 rgba(255, 255, 255, 0.45),
            inset 0 -1px 1px 0 rgba(0, 0, 0, 0.5),
            0 0 16px -2px ${accentGlow}
          `,
        }}
      >
        {/* Top razor-thin specular line */}
        <div
          data-tauri-drag-region
          className="pointer-events-none absolute inset-x-3 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/60 to-transparent"
        />

        {/* Mini Album Art / Spinner */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            onExpand();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          className="relative flex-shrink-0 w-6 h-6 rounded-[7px] overflow-hidden bg-neutral-900 ring-1 ring-white/20 shadow-sm cursor-pointer hover:scale-105 active:scale-95 transition-all duration-150"
          title="Click to expand"
        >
          {media.artwork ? (
            <img
              src={media.artwork}
              alt="Album art"
              draggable={false}
              className="w-full h-full object-cover pointer-events-none select-none"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-950 text-neutral-400">
              <Music className="w-3 h-3 opacity-70" />
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent" />
        </div>

        {/* Track Title */}
        <div
          data-tauri-drag-region
          onClick={(e) => {
            e.stopPropagation();
            onExpand();
          }}
          className="flex flex-col flex-1 min-w-0 justify-center cursor-pointer leading-tight"
        >
          <span
            className="font-semibold text-[11px] truncate text-white tracking-tight drop-shadow-sm"
            title={media.title || 'Taskbar Dock'}
          >
            {media.title || 'Taskbar Dock'}
          </span>
          <span
            className="text-[9.5px] truncate text-neutral-300 font-normal opacity-80"
            title={media.artist || media.source_name}
          >
            {media.artist || media.source_name || 'Idle'}
          </span>
        </div>

        {/* Transport Controls */}
        <div className="flex items-center gap-1 flex-shrink-0" onMouseDown={(e) => e.stopPropagation()}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            className="w-5 h-5 flex items-center justify-center rounded-full text-neutral-300 hover:text-white hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
            title="Previous Track"
          >
            <SkipBack className="w-2.5 h-2.5 fill-current" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onTogglePlayPause();
            }}
            className="relative w-6 h-6 flex items-center justify-center rounded-[7px] text-black active:scale-90 hover:scale-105 transition-all cursor-pointer overflow-hidden shadow-md"
            style={{
              background: `linear-gradient(135deg, #FEF08A 0%, ${accentHex} 50%, #D97706 100%)`,
              boxShadow: `0 0 10px ${accentHex}88, inset 0 1px 1px rgba(255,255,255,0.8)`,
            }}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent" />
            {isPlaying ? (
              <Pause className="w-3 h-3 fill-current" />
            ) : (
              <Play className="w-3 h-3 fill-current ml-0.5" />
            )}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            className="w-5 h-5 flex items-center justify-center rounded-full text-neutral-300 hover:text-white hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
            title="Next Track"
          >
            <SkipForward className="w-2.5 h-2.5 fill-current" />
          </button>
        </div>

        {/* Compact Equalizer */}
        <div className="flex items-center flex-shrink-0" onMouseDown={(e) => e.stopPropagation()}>
          <Equalizer
            isPlaying={isPlaying}
            accentHex={accentHex}
            barCount={6}
            reducedMotion={reducedMotion}
          />
        </div>

        {/* Undock to Desktop button */}
        <div className="flex items-center gap-0.5 flex-shrink-0" onMouseDown={(e) => e.stopPropagation()}>
          {onUndock && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUndock();
              }}
              className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Undock to Desktop Floating Island"
            >
              <ArrowUpRight className="w-3 h-3" />
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenSettings();
            }}
            className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="AURA Settings"
          >
            <SettingsIcon className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
