import React, { useState, useEffect } from 'react';
import { DynamicIsland } from './components/DynamicIsland';
import { ExpandedPlayer } from './components/ExpandedPlayer';
import { TaskbarPlayer } from './components/TaskbarPlayer';
import { SettingsModal } from './components/SettingsModal';
import { useMediaState } from './hooks/useMediaState';
import { useSettings } from './hooks/useSettings';
import { ACCENT_MAP, extractDominantColor } from './utils/colors';

export const App: React.FC = () => {
  const {
    media,
    sessions,
    isBrowserLinked,
    currentPositionMs,
    togglePlayPause,
    nextTrack,
    prevTrack,
    seekTo,
    switchSession,
  } = useMediaState();

  const {
    config,
    currentMode,
    switchMode,
    updateConfig,
    setAlwaysOnTop,
    snapCorner,
    resetPosition,
    dockToTaskbar,
    undockFromTaskbar,
    setTheme,
    setAccentColor,
  } = useSettings();

  const [dynamicAccent, setDynamicAccent] = useState<string | null>(null);

  // Extract artwork accent color if selected
  useEffect(() => {
    if (config.accent_color === 'dynamic' && media.artwork) {
      extractDominantColor(media.artwork).then((color) => {
        if (color) setDynamicAccent(color);
      });
    } else {
      setDynamicAccent(null);
    }
  }, [config.accent_color, media.artwork]);

  // Determine current active hex & glow
  const currentAccentHex =
    config.accent_color === 'dynamic' && dynamicAccent
      ? dynamicAccent
      : ACCENT_MAP[config.accent_color === 'dynamic' ? 'amber' : config.accent_color]?.hex || '#F59E0B';

  const currentAccentGlow =
    config.accent_color === 'dynamic' && dynamicAccent
      ? `${dynamicAccent}66`
      : ACCENT_MAP[config.accent_color === 'dynamic' ? 'amber' : config.accent_color]?.glow || 'rgba(245, 158, 11, 0.4)';

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.code === 'ArrowRight' && e.ctrlKey) {
        e.preventDefault();
        nextTrack();
      } else if (e.code === 'ArrowLeft' && e.ctrlKey) {
        e.preventDefault();
        prevTrack();
      } else if (e.code === 'Escape') {
        if (currentMode === 'settings' || currentMode === 'expanded') {
          switchMode(config.player_mode === 'taskbar' ? 'taskbar' : 'island');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlayPause, nextTrack, prevTrack, currentMode, switchMode, config.player_mode]);

  return (
    <main className="w-screen h-screen flex items-center justify-center p-0 m-0 bg-transparent overflow-hidden">
      {/* 1. Dynamic Island Mode (Flagship Floating Desktop Capsule) */}
      {(currentMode === 'island' || currentMode === 'compact') && (
        <DynamicIsland
          media={media}
          accentHex={currentAccentHex}
          accentGlow={currentAccentGlow}
          theme={config.theme}
          opacity={config.glass_opacity}
          reducedMotion={config.reduced_motion}
          hoverExpand={config.hover_expand}
          hoverDelayMs={config.hover_delay_ms}
          capsuleSize={config.capsule_size}
          onTogglePlayPause={togglePlayPause}
          onNext={nextTrack}
          onPrev={prevTrack}
          onExpand={() => switchMode('expanded')}
          onOpenSettings={() => switchMode('settings')}
          onDockToTaskbar={dockToTaskbar}
        />
      )}

      {/* 2. Taskbar Docked Strip Mode */}
      {currentMode === 'taskbar' && (
        <TaskbarPlayer
          media={media}
          accentHex={currentAccentHex}
          accentGlow={currentAccentGlow}
          theme={config.theme}
          opacity={config.glass_opacity}
          reducedMotion={config.reduced_motion}
          onTogglePlayPause={togglePlayPause}
          onNext={nextTrack}
          onPrev={prevTrack}
          onExpand={() => switchMode('expanded')}
          onOpenSettings={() => switchMode('settings')}
          onUndock={undockFromTaskbar}
        />
      )}

      {/* 3. Expanded Now Playing View */}
      {currentMode === 'expanded' && (
        <ExpandedPlayer
          media={media}
          sessions={sessions}
          currentPositionMs={currentPositionMs}
          accentHex={currentAccentHex}
          accentGlow={currentAccentGlow}
          theme={config.theme}
          opacity={config.glass_opacity}
          onTogglePlayPause={togglePlayPause}
          onNext={nextTrack}
          onPrev={prevTrack}
          onSeek={seekTo}
          onSelectSession={switchSession}
          onCollapse={() => switchMode(config.player_mode === 'taskbar' ? 'taskbar' : 'island')}
          onOpenSettings={() => switchMode('settings')}
          onSwitchToIsland={() => switchMode('island')}
          onSwitchToTaskbar={() => switchMode('taskbar')}
        />
      )}

      {/* 4. Dedicated Settings Window */}
      {currentMode === 'settings' && (
        <SettingsModal
          config={config}
          isBrowserLinked={isBrowserLinked}
          onUpdateConfig={updateConfig}
          onSetTheme={setTheme}
          onSetAccentColor={setAccentColor}
          onSetAlwaysOnTop={setAlwaysOnTop}
          onSnapCorner={snapCorner}
          onResetPosition={resetPosition}
          onSelectMode={(mode) => switchMode(mode)}
          onClose={() => switchMode(config.player_mode === 'taskbar' ? 'taskbar' : 'island')}
        />
      )}
    </main>
  );
};

export default App;
