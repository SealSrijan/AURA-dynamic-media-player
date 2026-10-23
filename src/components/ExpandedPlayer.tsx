import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Music,
  Minimize2,
  Settings as SettingsIcon,
  CircleDot,
  Radio,
  PanelBottom,
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import type { MediaState, SessionItem, Theme } from '../types/media';

interface ExpandedPlayerProps {
  media: MediaState;
  sessions: SessionItem[];
  currentPositionMs: number;
  accentHex: string;
  accentGlow: string;
  theme?: Theme;
  opacity?: number;
  onTogglePlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (ms: number) => void;
  onSelectSession: (id: string | null) => void;
  onCollapse: () => void;
  onOpenSettings: () => void;
  onSwitchToIsland: () => void;
  onSwitchToTaskbar?: () => void;
}

export const ExpandedPlayer: React.FC<ExpandedPlayerProps> = ({
  media,
  sessions,
  currentPositionMs,
  accentHex,
  accentGlow,
  theme = 'dark-glass',
  opacity = 0.92,
  onTogglePlayPause,
  onNext,
  onPrev,
  onSeek,
  onSelectSession,
  onCollapse,
  onOpenSettings,
  onSwitchToIsland,
  onSwitchToTaskbar,
}) => {
  const isPlaying = media.status === 'Playing';
  const durationMs = media.duration_ms || 1;
  const progressRatio = Math.min(1, Math.max(0, currentPositionMs / durationMs));

  const formatTime = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSeekClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!media.can_seek || media.duration_ms <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(Math.floor(ratio * media.duration_ms));
  };

  const handleDragMouseDown = async (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    try {
      await getCurrentWindow().startDragging();
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

  const isLight = theme === 'light-frost';

  return (
    <div className="w-full h-full flex items-center justify-center p-0 m-0 bg-transparent overflow-hidden pointer-events-none">
      <div
        data-tauri-drag-region
        onMouseDown={handleDragMouseDown}
        className="pointer-events-auto group relative flex flex-col justify-between w-[350px] h-[260px] p-4 rounded-[26px] backdrop-blur-[36px] backdrop-saturate-[220%] select-none transition-all duration-200"
        style={{
          background: isLight
            ? `linear-gradient(135deg, rgba(255, 255, 255, ${opacity}) 0%, rgba(240, 244, 252, ${opacity}) 100%)`
            : `linear-gradient(135deg, rgba(30, 33, 46, ${opacity * 0.96}) 0%, rgba(10, 12, 18, ${opacity * 1.04}) 100%)`,
          boxShadow: `
            0 24px 54px -12px rgba(0, 0, 0, 0.9),
            0 0 0 1px rgba(255, 255, 255, 0.16),
            inset 0 1.5px 2px 0 rgba(255, 255, 255, 0.45),
            inset 0 -1.5px 2px 0 rgba(0, 0, 0, 0.6),
            0 0 28px -2px ${accentGlow}
          `,
        }}
      >
        {/* Top Specular Rim Line */}
        <div
          data-tauri-drag-region
          className="pointer-events-none absolute inset-x-5 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/70 to-transparent"
        />

        {/* Header Bar */}
        <div data-tauri-drag-region className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.8)]"
              style={{ backgroundColor: accentHex }}
            />
            <span className="text-[11px] font-semibold text-neutral-200 uppercase tracking-wider">
              {media.source_name || 'AURA'}
            </span>
            {media.is_browser_source && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-medium border border-amber-500/30">
                Web Tab
              </span>
            )}
          </div>

          <div className="flex items-center gap-1" onMouseDown={(e) => e.stopPropagation()}>
            {onSwitchToTaskbar && (
              <button
                onClick={onSwitchToTaskbar}
                className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Dock in Taskbar"
              >
                <PanelBottom className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={onSwitchToIsland}
              className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Dynamic Island Mode"
            >
              <CircleDot className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onOpenSettings}
              className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="AURA Settings"
            >
              <SettingsIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onCollapse}
              className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Collapse to Mini Island"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Main Track Info & Artwork */}
        <div data-tauri-drag-region className="flex items-center gap-3.5 my-1">
          <div className="relative w-16 h-16 rounded-[14px] overflow-hidden bg-neutral-900 ring-1 ring-white/20 flex-shrink-0 shadow-[0_8px_20px_rgba(0,0,0,0.6)]">
            {media.artwork ? (
              <img
                src={media.artwork}
                alt="Album Artwork"
                draggable={false}
                className="w-full h-full object-cover select-none pointer-events-none"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-950 text-neutral-400">
                <Music className="w-6 h-6 opacity-60" />
              </div>
            )}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-white/25 to-transparent" />
          </div>

          <div data-tauri-drag-region className="flex flex-col min-w-0 flex-1">
            <span
              className="text-[15px] font-bold text-white truncate drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
              title={media.title || 'No Media Active'}
            >
              {media.title || 'No Media Active'}
            </span>
            <span
              className="text-[12.5px] text-neutral-300 truncate mt-0.5 font-normal"
              title={media.artist || 'Waiting for playback...'}
            >
              {media.artist || 'Waiting for playback...'}
            </span>
            {media.album && (
              <span
                className="text-[11px] text-neutral-400 truncate mt-0.5 opacity-80"
                title={media.album}
              >
                {media.album}
              </span>
            )}
          </div>
        </div>

        {/* Progress & Seek Bar */}
        <div className="flex flex-col gap-1.5 my-1" onMouseDown={(e) => e.stopPropagation()}>
          <div
            onClick={handleSeekClick}
            className={`relative h-2 w-full rounded-full bg-white/10 ring-1 ring-white/10 overflow-hidden ${
              media.can_seek ? 'cursor-pointer' : 'cursor-default'
            }`}
            title={media.can_seek ? 'Click to Seek' : undefined}
          >
            <div
              className="h-full rounded-full transition-all duration-100 ease-linear shadow-[0_0_10px_rgba(245,158,11,0.8)]"
              style={{
                width: `${(progressRatio * 100).toFixed(1)}%`,
                backgroundColor: accentHex,
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-neutral-400 font-mono tracking-wider">
            <span>{formatTime(currentPositionMs)}</span>
            <span>{media.duration_ms > 0 ? formatTime(media.duration_ms) : '--:--'}</span>
          </div>
        </div>

        {/* Transport Controls */}
        <div
          className="flex items-center justify-center gap-4"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            onClick={onPrev}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/[0.08] hover:bg-white/[0.18] border border-white/15 backdrop-blur-md text-neutral-200 hover:text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] active:scale-90 transition-all cursor-pointer"
            title="Previous Track"
          >
            <SkipBack className="w-4 h-4 fill-current" />
          </button>

          <button
            onClick={onTogglePlayPause}
            className="relative w-11 h-11 flex items-center justify-center rounded-[14px] text-black active:scale-90 hover:scale-105 transition-all cursor-pointer overflow-hidden shadow-lg"
            style={{
              background: `linear-gradient(135deg, #FEF08A 0%, ${accentHex} 48%, #D97706 100%)`,
              boxShadow: `
                inset 0 1.5px 1.5px rgba(255, 255, 255, 0.85),
                inset 0 -1.5px 1.5px rgba(0, 0, 0, 0.4),
                0 0 20px ${accentHex}99,
                0 4px 12px rgba(0, 0, 0, 0.5)
              `,
            }}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent" />
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current drop-shadow-sm" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5 drop-shadow-sm" />
            )}
          </button>

          <button
            onClick={onNext}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/[0.08] hover:bg-white/[0.18] border border-white/15 backdrop-blur-md text-neutral-200 hover:text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] active:scale-90 transition-all cursor-pointer"
            title="Next Track"
          >
            <SkipForward className="w-4 h-4 fill-current" />
          </button>
        </div>

        {/* Multiple Sessions Selector (if > 1 session detected) */}
        {sessions.length > 1 && (
          <div
            className="flex items-center gap-1.5 overflow-x-auto pt-1 no-scrollbar border-t border-white/10"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <Radio className="w-3 h-3 text-neutral-400 flex-shrink-0" />
            <span className="text-[10px] text-neutral-400 flex-shrink-0">Sources:</span>
            {sessions.map((s) => {
              const isSelected = media.source_id === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => onSelectSession(s.id)}
                  className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 font-medium transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/30 text-amber-200 border border-amber-500/50 shadow-sm'
                      : 'bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 border border-transparent'
                  }`}
                >
                  {s.source_name}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
