import { useState, useEffect, useRef, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type { MediaState, SessionItem } from '../types/media';

const DEFAULT_STATE: MediaState = {
  title: '',
  artist: '',
  album: '',
  artwork: null,
  status: 'Stopped',
  position_ms: 0,
  duration_ms: 0,
  can_play: false,
  can_pause: false,
  can_skip_next: false,
  can_skip_prev: false,
  can_seek: false,
  source_id: '',
  source_name: '',
  is_browser_source: false,
  updated_at_ms: 0,
};

export function useMediaState() {
  const [media, setMedia] = useState<MediaState>(DEFAULT_STATE);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [isBrowserLinked, setIsBrowserLinked] = useState<boolean>(false);
  const [currentPositionMs, setCurrentPositionMs] = useState<number>(0);

  const lastServerUpdateRef = useRef<number>(0);
  const basePositionRef = useRef<number>(0);

  // Initial fetch
  const fetchState = useCallback(async () => {
    try {
      const state = await invoke<MediaState>('get_media_state');
      setMedia(state);
      basePositionRef.current = state.position_ms;
      setCurrentPositionMs(state.position_ms);
      lastServerUpdateRef.current = Date.now();

      const sess = await invoke<SessionItem[]>('get_sessions');
      setSessions(sess);

      const linked = await invoke<boolean>('is_browser_connected');
      setIsBrowserLinked(linked);
    } catch (err) {
      console.warn('Failed to fetch media state:', err);
    }
  }, []);

  useEffect(() => {
    fetchState();

    // Listen to real-time events from Rust
    let unlisten: (() => void) | undefined;
    listen<MediaState>('media_state_changed', (event) => {
      setMedia(event.payload);
      basePositionRef.current = event.payload.position_ms;
      setCurrentPositionMs(event.payload.position_ms);
      lastServerUpdateRef.current = Date.now();
    }).then((fn) => {
      unlisten = fn;
    });

    // Refresh session list periodically
    const sessionInterval = setInterval(async () => {
      try {
        const sess = await invoke<SessionItem[]>('get_sessions');
        setSessions(sess);
        const linked = await invoke<boolean>('is_browser_connected');
        setIsBrowserLinked(linked);
      } catch {}
    }, 4000);

    return () => {
      if (unlisten) unlisten();
      clearInterval(sessionInterval);
    };
  }, [fetchState]);

  // Local clock interpolation for silky smooth seek bar & timers
  useEffect(() => {
    if (media.status !== 'Playing') {
      setCurrentPositionMs(basePositionRef.current);
      return;
    }

    const timer = setInterval(() => {
      const elapsed = Date.now() - lastServerUpdateRef.current;
      const calculated = basePositionRef.current + elapsed;
      if (media.duration_ms > 0) {
        setCurrentPositionMs(Math.min(calculated, media.duration_ms));
      } else {
        setCurrentPositionMs(calculated);
      }
    }, 250);

    return () => clearInterval(timer);
  }, [media.status, media.duration_ms]);

  // Actions
  const togglePlayPause = async () => {
    const previousStatus = media.status;
    const nextStatus = previousStatus === 'Playing' ? 'Paused' : 'Playing';
    setMedia((prev) => ({ ...prev, status: nextStatus }));

    try {
      const ok = await invoke<boolean>('media_toggle');
      if (!ok) {
        // Rollback if native call returned false
        setMedia((prev) => ({ ...prev, status: previousStatus }));
      }
    } catch (err) {
      console.warn('Playback toggle failed, rolling back:', err);
      setMedia((prev) => ({ ...prev, status: previousStatus }));
    }
  };

  const nextTrack = async () => {
    try {
      await invoke('media_next');
    } catch (err) {
      console.warn('Next track failed:', err);
    }
  };

  const prevTrack = async () => {
    try {
      await invoke('media_prev');
    } catch (err) {
      console.warn('Prev track failed:', err);
    }
  };

  const seekTo = async (ms: number) => {
    const safeMs = Math.max(0, Math.floor(ms));
    basePositionRef.current = safeMs;
    lastServerUpdateRef.current = Date.now();
    setCurrentPositionMs(safeMs);
    try {
      await invoke('media_seek', { positionMs: safeMs });
    } catch (err) {
      console.warn('Media seek failed:', err);
    }
  };

  const switchSession = async (sourceId: string | null) => {
    await invoke('set_active_source', { sourceId });
    setTimeout(fetchState, 150);
  };

  return {
    media,
    sessions,
    isBrowserLinked,
    currentPositionMs,
    togglePlayPause,
    nextTrack,
    prevTrack,
    seekTo,
    switchSession,
    refresh: fetchState,
  };
}
