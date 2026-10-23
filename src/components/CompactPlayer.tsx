import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Music, Maximize2, Settings as SettingsIcon } from 'lucide-react';
import type { MediaState } from '../types/media';
import { Equalizer } from './Equalizer';

interface CompactPlayerProps {
  media: MediaState;
  accentHex: string;
  reducedMotion?: boolean;
  onTogglePlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onExpand: () => void;
  onOpenSettings: () => void;
}

export const CompactPlayer: React.FC<CompactPlayerProps> = ({
  media,
  accentHex,
  reducedMotion = false,
  onTogglePlayPause,
  onNext,
  onPrev,
  onExpand,
  onOpenSettings,
}) => {
  const isPlaying = media.status === 'Playing';
  const hasTrack = Boolean(media.title);

  return (
    <div
      data-tauri-drag-region
      className="group relative flex items-center justify-between w-full h-[74px] px-3.5 py-2.5 gap-3"
    >
      {/* Left: Album Artwork in iPhone Squircle Frame */}
      <div
        onClick={onExpand}
        className="relative flex-shrink-0 w-12 h-12 rounded-[13px] overflow-hidden bg-neutral-900 ring-1 ring-white/20 shadow-[0_4px_14px_rgba(0,0,0,0.55)] cursor-pointer hover:scale-[1.04] active:scale-95 transition-all duration-200"
        title="Click to expand"
      >
        {media.artwork ? (
          <img
            src={media.artwork}
            alt="Album art"
            className="w-full h-full object-cover select-none"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-950 text-neutral-400">
            <Music className="w-5 h-5 opacity-70" />
          </div>
        )}

        {/* Glossy Glass Sheen on Top Half of Artwork */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[48%] bg-gradient-to-b from-white/25 via-white/5 to-transparent" />
      </div>

      {/* Center-Left: Track Title & Artist (iOS SF Pro Typography) */}
      <div
        data-tauri-drag-region
        onClick={onExpand}
        className="flex flex-col flex-1 min-w-0 justify-center cursor-pointer select-none"
      >
        <div className="flex items-center gap-1.5">
          <span
            className="font-semibold text-[13.5px] leading-tight truncate text-white tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
            title={media.title || 'No Media Playing'}
          >
            {media.title || 'No Media Playing'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span
            className="text-[11.5px] leading-tight truncate text-neutral-300 font-normal tracking-tight drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]"
            title={media.artist || (hasTrack ? media.source_name : 'Waiting for audio...')}
          >
            {media.artist || (hasTrack ? media.source_name : 'Waiting for audio...')}
          </span>
          {media.source_name && hasTrack && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/[0.12] text-neutral-200 font-medium tracking-wider uppercase border border-white/10 shadow-sm">
              {media.source_name}
            </span>
          )}
        </div>
      </div>

      {/* Center-Right: Tactile Liquid Glass Controls */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Previous Track Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          className="w-7 h-7 flex items-center justify-center rounded-full bg-white/[0.08] hover:bg-white/[0.18] border border-white/15 backdrop-blur-md text-neutral-200 hover:text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] active:scale-88 transition-all duration-150 cursor-pointer"
          title="Previous Track"
        >
          <SkipBack className="w-3.5 h-3.5 fill-current" />
        </button>

        {/* Play / Pause Amber Gemstone Glass Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTogglePlayPause();
          }}
          className="relative w-8 h-8 flex items-center justify-center rounded-[11px] text-black active:scale-90 hover:scale-[1.05] transition-all duration-150 cursor-pointer overflow-hidden"
          style={{
            background: `linear-gradient(135deg, #FEF08A 0%, ${accentHex} 48%, #D97706 100%)`,
            boxShadow: `
              inset 0 1.5px 1.5px rgba(255, 255, 255, 0.85),
              inset 0 -1.5px 1.5px rgba(0, 0, 0, 0.4),
              0 0 18px ${accentHex}99,
              0 4px 10px rgba(0, 0, 0, 0.5)
            `,
          }}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {/* Top highlight glare */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent" />
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-current drop-shadow-sm" />
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5 drop-shadow-sm" />
          )}
        </button>

        {/* Next Track Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="w-7 h-7 flex items-center justify-center rounded-full bg-white/[0.08] hover:bg-white/[0.18] border border-white/15 backdrop-blur-md text-neutral-200 hover:text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] active:scale-88 transition-all duration-150 cursor-pointer"
          title="Next Track"
        >
          <SkipForward className="w-3.5 h-3.5 fill-current" />
        </button>
      </div>

      {/* Right: Animated Equalizer Waveform */}
      <div className="flex items-center flex-shrink-0 pl-1">
        <Equalizer
          isPlaying={isPlaying}
          accentHex={accentHex}
          barCount={13}
          reducedMotion={reducedMotion}
        />
      </div>

      {/* Hover action shortcuts with iOS glass pill styling */}
      <div className="absolute right-2.5 top-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1 bg-black/60 backdrop-blur-xl px-1.5 py-0.5 rounded-full border border-white/15 shadow-lg">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onExpand();
          }}
          className="p-1 text-neutral-300 hover:text-white transition-colors cursor-pointer"
          title="Expand Details"
        >
          <Maximize2 className="w-3 h-3" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenSettings();
          }}
          className="p-1 text-neutral-300 hover:text-white transition-colors cursor-pointer"
          title="Settings"
        >
          <SettingsIcon className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
