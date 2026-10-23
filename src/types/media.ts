export type PlaybackStatus = 'Playing' | 'Paused' | 'Stopped';

export interface MediaState {
  title: string;
  artist: string;
  album: string;
  artwork: string | null;
  status: PlaybackStatus;
  position_ms: number;
  duration_ms: number;
  can_play: boolean;
  can_pause: boolean;
  can_skip_next: boolean;
  can_skip_prev: boolean;
  can_seek: boolean;
  source_id: string;
  source_name: string;
  is_browser_source: boolean;
  updated_at_ms: number;
}

export interface SessionItem {
  id: string;
  title: string;
  artist: string;
  source_name: string;
  is_playing: boolean;
  is_active: boolean;
}

export type PlayerMode = 'compact' | 'expanded' | 'island' | 'taskbar' | 'settings';

export type AccentColor = 'amber' | 'cyan' | 'purple' | 'emerald' | 'dynamic';
export type Theme = 'dark-glass' | 'light-frost' | 'midnight';

export interface AuraConfig {
  theme: Theme;
  accent_color: AccentColor;
  glass_opacity: number;
  always_on_top: boolean;
  auto_hide_when_empty: boolean;
  player_mode: PlayerMode;
  snap_position: string;
  pos_x: number;
  pos_y: number;
  preferred_source: string | null;
  reduced_motion: boolean;
  autostart: boolean;
  hover_expand: boolean;
  hover_delay_ms: number;
  capsule_size: 'compact' | 'standard' | 'large';
  taskbar_docked: boolean;
}
