import React, { useState } from 'react';
import {
  X,
  Layers,
  Pin,
  Compass,
  Zap,
  Globe,
  RotateCcw,
  Check,
  Sliders,
  Radio,
  Keyboard,
  Info,
  Sparkles,
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import type { AuraConfig, Theme, AccentColor, PlayerMode } from '../types/media';

interface SettingsModalProps {
  config: AuraConfig;
  isBrowserLinked: boolean;
  onUpdateConfig: (updates: Partial<AuraConfig>) => void;
  onSetTheme: (theme: Theme) => void;
  onSetAccentColor: (accent: AccentColor) => void;
  onSetAlwaysOnTop: (enabled: boolean) => void;
  onSnapCorner: (corner: string) => void;
  onResetPosition: () => void;
  onSelectMode?: (mode: PlayerMode) => void;
  onClose: () => void;
}

type Tab = 'appearance' | 'behavior' | 'media' | 'advanced';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  config,
  isBrowserLinked,
  onUpdateConfig,
  onSetTheme,
  onSetAccentColor,
  onSetAlwaysOnTop,
  onSnapCorner,
  onResetPosition,
  onSelectMode,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('appearance');

  const themes: { id: Theme; label: string }[] = [
    { id: 'dark-glass', label: 'Dark Liquid Glass' },
    { id: 'light-frost', label: 'Light Frost' },
    { id: 'midnight', label: 'Midnight OLED' },
  ];

  const accents: { id: AccentColor; label: string; color: string }[] = [
    { id: 'amber', label: 'Amber', color: '#F59E0B' },
    { id: 'cyan', label: 'Cyan', color: '#06B6D4' },
    { id: 'purple', label: 'Purple', color: '#A855F7' },
    { id: 'emerald', label: 'Emerald', color: '#10B981' },
    { id: 'dynamic', label: 'Artwork Dynamic', color: 'linear-gradient(135deg, #f59e0b, #06b6d4)' },
  ];

  const snapPositions = [
    { id: 'taskbar', label: 'Taskbar Dock' },
    { id: 'top-center', label: 'Top Island' },
    { id: 'bottom-right', label: 'Bottom Right' },
    { id: 'top-right', label: 'Top Right' },
    { id: 'center', label: 'Center Screen' },
  ];

  const capsuleSizes: { id: 'compact' | 'standard' | 'large'; label: string }[] = [
    { id: 'compact', label: 'Compact (228px)' },
    { id: 'standard', label: 'Standard (252px)' },
    { id: 'large', label: 'Large (280px)' },
  ];

  const handleDragMouseDown = async (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    try {
      const win = getCurrentWindow();
      await win.startDragging();
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

  const isLight = config.theme === 'light-frost';

  return (
    <div className="w-full h-full flex items-center justify-center p-0 m-0 bg-transparent overflow-hidden pointer-events-none">
      <div
        data-tauri-drag-region
        onMouseDown={handleDragMouseDown}
        className="pointer-events-auto group relative flex flex-col w-[410px] h-[470px] p-4 rounded-[26px] backdrop-blur-[36px] backdrop-saturate-[220%] select-none transition-all duration-200 text-white text-[12px]"
        style={{
          background: isLight
            ? `linear-gradient(135deg, rgba(255, 255, 255, 0.94) 0%, rgba(240, 244, 252, 0.92) 100%)`
            : `linear-gradient(135deg, rgba(30, 33, 46, 0.96) 0%, rgba(10, 12, 18, 0.98) 100%)`,
          boxShadow: `
            0 24px 54px -12px rgba(0, 0, 0, 0.9),
            0 0 0 1px rgba(255, 255, 255, 0.16),
            inset 0 1.5px 2px 0 rgba(255, 255, 255, 0.45),
            inset 0 -1.5px 2px 0 rgba(0, 0, 0, 0.6),
            0 0 28px -2px rgba(245, 158, 11, 0.4)
          `,
          color: isLight ? '#171717' : '#FFFFFF',
        }}
      >
        {/* Top Specular Rim */}
        <div
          data-tauri-drag-region
          className="pointer-events-none absolute inset-x-5 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/70 to-transparent"
        />

        {/* Header Bar */}
        <div data-tauri-drag-region className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-[14px] tracking-tight">AURA Dynamic Island Settings</span>
          </div>
          <button
            onClick={onClose}
            onMouseDown={(e) => e.stopPropagation()}
            className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div
          className="grid grid-cols-4 gap-1 p-1 my-2 bg-black/25 rounded-xl border border-white/10"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setActiveTab('appearance')}
            className={`py-1 text-[11px] font-medium rounded-lg transition-all cursor-pointer ${
              activeTab === 'appearance'
                ? 'bg-amber-500 text-black font-semibold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Appearance
          </button>
          <button
            onClick={() => setActiveTab('behavior')}
            className={`py-1 text-[11px] font-medium rounded-lg transition-all cursor-pointer ${
              activeTab === 'behavior'
                ? 'bg-amber-500 text-black font-semibold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Behavior
          </button>
          <button
            onClick={() => setActiveTab('media')}
            className={`py-1 text-[11px] font-medium rounded-lg transition-all cursor-pointer ${
              activeTab === 'media'
                ? 'bg-amber-500 text-black font-semibold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Media
          </button>
          <button
            onClick={() => setActiveTab('advanced')}
            className={`py-1 text-[11px] font-medium rounded-lg transition-all cursor-pointer ${
              activeTab === 'advanced'
                ? 'bg-amber-500 text-black font-semibold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Advanced
          </button>
        </div>

        {/* Tab Body Scrollable */}
        <div
          className="flex flex-col gap-3 my-1 overflow-y-auto pr-1 no-scrollbar flex-1"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* TAB 1: APPEARANCE */}
          {activeTab === 'appearance' && (
            <div className="flex flex-col gap-3 animate-in fade-in duration-150">
              {/* Theme Selection */}
              <div className="flex flex-col gap-1.5">
                <span className="text-neutral-400 font-medium text-[11px] flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" /> Glass Material
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {themes.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => onSetTheme(t.id)}
                      className={`py-1.5 px-2 rounded-lg font-medium text-center border text-[10.5px] transition-all cursor-pointer ${
                        config.theme === t.id
                          ? 'bg-white/20 border-white/40 text-white shadow-sm'
                          : 'bg-white/5 border-white/5 text-neutral-400 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Accent Color Palette */}
              <div className="flex flex-col gap-1.5">
                <span className="text-neutral-400 font-medium text-[11px] flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" /> Accent Illumination
                </span>
                <div className="flex items-center gap-2">
                  {accents.map((a) => {
                    const isSelected = config.accent_color === a.id;
                    return (
                      <button
                        key={a.id}
                        onClick={() => onSetAccentColor(a.id)}
                        className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-transform cursor-pointer ${
                          isSelected ? 'scale-110 border-white shadow-md' : 'border-transparent hover:scale-105 opacity-80'
                        }`}
                        style={{ background: a.color }}
                        title={a.label}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-black drop-shadow" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Capsule Sizing */}
              <div className="flex flex-col gap-1.5">
                <span className="text-neutral-400 font-medium text-[11px] flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5" /> Island Pill Sizing
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {capsuleSizes.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => onUpdateConfig({ capsule_size: s.id })}
                      className={`py-1.5 px-2 rounded-lg font-medium text-center border text-[10.5px] transition-all cursor-pointer ${
                        config.capsule_size === s.id
                          ? 'bg-amber-500/25 border-amber-500/50 text-amber-300 shadow-sm'
                          : 'bg-white/5 border-white/5 text-neutral-400 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Glass Opacity */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-neutral-400 font-medium">Glass Opacity</span>
                  <span className="text-neutral-300 font-mono">{Math.round(config.glass_opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.4"
                  max="1"
                  step="0.05"
                  value={config.glass_opacity}
                  onChange={(e) => onUpdateConfig({ glass_opacity: parseFloat(e.target.value) })}
                  className="w-full accent-amber-400 cursor-pointer h-1.5 bg-white/20 rounded-lg"
                />
              </div>

              {/* Reduced Motion Toggle */}
              <label className="flex items-center justify-between cursor-pointer pt-1">
                <span className="text-neutral-300">Reduced Motion (Disable equalizer flutter)</span>
                <input
                  type="checkbox"
                  checked={config.reduced_motion}
                  onChange={(e) => onUpdateConfig({ reduced_motion: e.target.checked })}
                  className="accent-amber-400 w-4 h-4 cursor-pointer"
                />
              </label>
            </div>
          )}

          {/* TAB 2: BEHAVIOR */}
          {activeTab === 'behavior' && (
            <div className="flex flex-col gap-3 animate-in fade-in duration-150">
              {/* Expand on Hover */}
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="font-semibold text-neutral-200">Expand on Hover</div>
                  <div className="text-[10px] text-neutral-400">Reveal equalizer & skips on mouse hover</div>
                </div>
                <input
                  type="checkbox"
                  checked={config.hover_expand}
                  onChange={(e) => onUpdateConfig({ hover_expand: e.target.checked })}
                  className="accent-amber-400 w-4 h-4 cursor-pointer"
                />
              </label>

              {/* Hover Delay */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-neutral-400 font-medium">Hover Collapse Delay</span>
                  <span className="text-neutral-300 font-mono">{config.hover_delay_ms} ms</span>
                </div>
                <input
                  type="range"
                  min="200"
                  max="1200"
                  step="100"
                  value={config.hover_delay_ms}
                  onChange={(e) => onUpdateConfig({ hover_delay_ms: parseInt(e.target.value) })}
                  className="w-full accent-amber-400 cursor-pointer h-1.5 bg-white/20 rounded-lg"
                />
              </div>

              {/* Always on Top */}
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-neutral-300 flex items-center gap-2">
                  <Pin className="w-3.5 h-3.5 text-neutral-400" /> Keep Always on Top
                </span>
                <input
                  type="checkbox"
                  checked={config.always_on_top}
                  onChange={(e) => onSetAlwaysOnTop(e.target.checked)}
                  className="accent-amber-400 w-4 h-4 cursor-pointer"
                />
              </label>

              {/* Quick Screen Alignment */}
              <div className="flex flex-col gap-1.5">
                <span className="text-neutral-400 font-medium text-[11px] flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5" /> Screen Snapping Preset
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {snapPositions.map((pos) => (
                    <button
                      key={pos.id}
                      onClick={() => onSnapCorner(pos.id)}
                      className={`py-1 px-1.5 rounded-lg text-[10px] font-medium border text-center transition-all cursor-pointer ${
                        config.snap_position === pos.id
                          ? 'bg-amber-500/30 border-amber-500/50 text-amber-200'
                          : 'bg-white/5 border-white/5 text-neutral-400 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {pos.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reset Position Button */}
              <button
                onClick={onResetPosition}
                className="w-full py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-200 text-center font-medium cursor-pointer transition-colors"
              >
                Center Dynamic Island on Top of Screen
              </button>
            </div>
          )}

          {/* TAB 3: MEDIA */}
          {activeTab === 'media' && (
            <div className="flex flex-col gap-3 animate-in fade-in duration-150">
              {/* Native GSMTC Integration Status */}
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-neutral-200 flex items-center gap-1.5">
                    <Radio className="w-4 h-4 text-emerald-400" /> Windows GSMTC Media
                  </div>
                  <span className="text-[9.5px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                    Native Active
                  </span>
                </div>
                <div className="text-[10.5px] text-neutral-400">
                  Detects Spotify Desktop, VLC, Brave, Edge, Chrome, and system audio sessions automatically via WinRT.
                </div>
              </div>

              {/* Browser Companion Extension Status */}
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-neutral-200 flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-amber-400" /> Companion Extension
                  </div>
                  <span
                    className={`text-[9.5px] px-2 py-0.5 rounded-full font-semibold border ${
                      isBrowserLinked
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    }`}
                  >
                    {isBrowserLinked ? 'Connected (ws:48123)' : 'Ready for Linking'}
                  </span>
                </div>
                <div className="text-[10.5px] text-neutral-400">
                  Load unpacked from <code className="text-amber-300">browser-extension/</code> in Chrome/Brave for deep YouTube & Spotify Web timeline scrubbing.
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ADVANCED */}
          {activeTab === 'advanced' && (
            <div className="flex flex-col gap-3 animate-in fade-in duration-150">
              {/* Keyboard Shortcuts */}
              <div className="flex flex-col gap-1.5">
                <span className="text-neutral-400 font-medium text-[11px] flex items-center gap-1.5">
                  <Keyboard className="w-3.5 h-3.5" /> Keyboard Shortcuts
                </span>
                <div className="grid grid-cols-2 gap-1.5 text-[10.5px]">
                  <div className="p-2 rounded-lg bg-white/5 border border-white/10 flex justify-between">
                    <span className="text-neutral-300">Play / Pause</span>
                    <kbd className="px-1.5 py-0.5 bg-black/40 rounded text-neutral-200 font-mono text-[9px]">Space</kbd>
                  </div>
                  <div className="p-2 rounded-lg bg-white/5 border border-white/10 flex justify-between">
                    <span className="text-neutral-300">Next Track</span>
                    <kbd className="px-1.5 py-0.5 bg-black/40 rounded text-neutral-200 font-mono text-[9px]">Ctrl + →</kbd>
                  </div>
                  <div className="p-2 rounded-lg bg-white/5 border border-white/10 flex justify-between">
                    <span className="text-neutral-300">Previous Track</span>
                    <kbd className="px-1.5 py-0.5 bg-black/40 rounded text-neutral-200 font-mono text-[9px]">Ctrl + ←</kbd>
                  </div>
                  <div className="p-2 rounded-lg bg-white/5 border border-white/10 flex justify-between">
                    <span className="text-neutral-300">Collapse View</span>
                    <kbd className="px-1.5 py-0.5 bg-black/40 rounded text-neutral-200 font-mono text-[9px]">Esc</kbd>
                  </div>
                </div>
              </div>

              {/* Version & Info */}
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                <Info className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                <div className="flex flex-col text-[10px] text-neutral-400">
                  <span className="text-neutral-200 font-semibold">AURA Dynamic Island 2.0</span>
                  <span>Tauri 2.12 • Rust 1.99 • React 19 • Windows WinRT GSMTC</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="pt-2 border-t border-white/10 flex items-center justify-between"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              onUpdateConfig({
                theme: 'dark-glass',
                accent_color: 'amber',
                glass_opacity: 0.88,
                always_on_top: true,
                reduced_motion: false,
                player_mode: 'island',
                hover_expand: true,
                hover_delay_ms: 400,
                capsule_size: 'standard',
              });
              if (onSelectMode) onSelectMode('island');
            }}
            className="flex items-center gap-1 text-[10.5px] text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" /> Reset Defaults
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-amber-500 text-black font-semibold text-[11px] hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-md"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
