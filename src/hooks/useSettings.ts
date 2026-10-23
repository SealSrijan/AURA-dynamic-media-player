import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type { AuraConfig, PlayerMode, Theme, AccentColor } from '../types/media';

const DEFAULT_CONFIG: AuraConfig = {
  theme: 'dark-glass',
  accent_color: 'amber',
  glass_opacity: 0.88,
  always_on_top: true,
  auto_hide_when_empty: false,
  player_mode: 'island',
  snap_position: 'bottom-right',
  pos_x: -1,
  pos_y: -1,
  preferred_source: null,
  reduced_motion: false,
  autostart: false,
  hover_expand: true,
  hover_delay_ms: 400,
  capsule_size: 'standard',
  taskbar_docked: false,
};

export function useSettings() {
  const [config, setConfig] = useState<AuraConfig>(DEFAULT_CONFIG);
  const [currentMode, setCurrentMode] = useState<PlayerMode>('island');

  useEffect(() => {
    invoke<AuraConfig>('get_config').then((loaded) => {
      setConfig(loaded);
      setCurrentMode(loaded.player_mode);
    }).catch(console.warn);

    let unlisten: (() => void) | undefined;
    listen<string>('change_mode', (event) => {
      const mode = event.payload as PlayerMode;
      setCurrentMode(mode);
    }).then((fn) => {
      unlisten = fn;
    });

    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  const updateConfig = useCallback(async (updates: Partial<AuraConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...updates };
      invoke('save_config', { config: next }).catch(console.warn);
      return next;
    });
  }, []);

  const switchMode = useCallback(async (mode: PlayerMode) => {
    setCurrentMode(mode);
    await invoke('set_player_mode', { mode });
    if (mode === 'taskbar') {
      await invoke('dock_to_taskbar');
    }
    updateConfig({ player_mode: mode });
  }, [updateConfig]);

  const setAlwaysOnTop = useCallback(async (enabled: boolean) => {
    await invoke('set_always_on_top', { enabled });
    updateConfig({ always_on_top: enabled });
  }, [updateConfig]);

  const snapCorner = useCallback(async (corner: string) => {
    await invoke('snap_to_corner', { corner });
    updateConfig({ snap_position: corner });
  }, [updateConfig]);

  const resetPosition = useCallback(async () => {
    await invoke('reset_position');
  }, []);

  const dockToTaskbar = useCallback(async () => {
    setCurrentMode('taskbar');
    await invoke('dock_to_taskbar');
    updateConfig({ player_mode: 'taskbar', taskbar_docked: true });
  }, [updateConfig]);

  const undockFromTaskbar = useCallback(async () => {
    setCurrentMode('island');
    await invoke('undock_from_taskbar');
    updateConfig({ player_mode: 'island', taskbar_docked: false });
  }, [updateConfig]);

  const setTheme = useCallback((theme: Theme) => {
    updateConfig({ theme });
  }, [updateConfig]);

  const setAccentColor = useCallback((accent_color: AccentColor) => {
    updateConfig({ accent_color });
  }, [updateConfig]);

  const setGlassOpacity = useCallback((glass_opacity: number) => {
    updateConfig({ glass_opacity });
  }, [updateConfig]);

  return {
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
    setGlassOpacity,
  };
}
