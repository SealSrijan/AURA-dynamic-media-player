import React from 'react';
import { Play, Pause, Music, Maximize2 } from 'lucide-react';
import type { MediaState } from '../types/media';

interface IslandPlayerProps {
  media: MediaState;
  accentHex: string;
  onTogglePlayPause: () => void;
  onExpand: () => void;
}

export const IslandPlayer: React.FC<IslandPlayerProps> = ({
  media,
  accentHex,
  onTogglePlayPause,
  onExpand,
}) => {
  const isPlaying = media.status === 'Playing';

  return (
    <div
      data-tauri-drag-region
      onClick={onExpand}
      className="group relative flex items-center justify-between w-full h-[48px] px-3 py-1.5 gap-2.5 cursor-pointer select-none rounded-full"
      title="Click to expand"
    >
      {/* Dynamic Island Spinning Vinyl Disc with Center Spindle */}
      <div className="relative flex-shrink-0 w-8 h-8 rounded-full overflow-hidden bg-neutral-950 ring-1 ring-white/20 shadow-md">
        {media.artwork ? (
          <img
            src={media.artwork}
            alt="Art"
            className={`w-full h-full object-cover ${isPlaying ? 'animate-spin' : ''}`}
            style={{ animationDuration: '8s' }}
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-neutral-900 text-neutral-400">
            <Music className="w-3.5 h-3.5 opacity-70" />
          </div>
        )}
        {/* Center Vinyl Hole */}
        <div className="pointer-events-none absolute inset-0 m-auto w-2 h-2 rounded-full bg-black ring-1 ring-white/30" />
        {/* Vinyl Specular Light Reflection */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-white/10" />
      </div>

      {/* Track Name */}
      <div data-tauri-drag-region className="flex flex-col min-w-0 flex-1 justify-center">
        <span className="text-[12px] font-semibold text-white truncate leading-tight tracking-tight drop-shadow-sm">
          {media.title || 'Dynamic Island'}
        </span>
        <span className="text-[10px] text-neutral-300 truncate leading-tight mt-0.5 opacity-80">
          {media.artist || media.source_name || 'No Media'}
        </span>
      </div>

      {/* Mini Controls */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTogglePlayPause();
          }}
          className="relative w-6 h-6 flex items-center justify-center rounded-full text-black cursor-pointer shadow-md active:scale-90 hover:scale-105 transition-all overflow-hidden"
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
            onExpand();
          }}
          className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          title="Expand"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
