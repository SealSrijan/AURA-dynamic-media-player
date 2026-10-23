use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum PlaybackStatus {
    Playing,
    Paused,
    Stopped,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MediaState {
    pub title: String,
    pub artist: String,
    pub album: String,
    pub artwork: Option<String>,
    pub status: PlaybackStatus,
    pub position_ms: u64,
    pub duration_ms: u64,
    pub can_play: bool,
    pub can_pause: bool,
    pub can_skip_next: bool,
    pub can_skip_prev: bool,
    pub can_seek: bool,
    pub source_id: String,
    pub source_name: String,
    pub is_browser_source: bool,
    pub updated_at_ms: u64,
}

impl Default for MediaState {
    fn default() -> Self {
        Self {
            title: String::new(),
            artist: String::new(),
            album: String::new(),
            artwork: None,
            status: PlaybackStatus::Stopped,
            position_ms: 0,
            duration_ms: 0,
            can_play: false,
            can_pause: false,
            can_skip_next: false,
            can_skip_prev: false,
            can_seek: false,
            source_id: String::new(),
            source_name: String::new(),
            is_browser_source: false,
            updated_at_ms: 0,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionItem {
    pub id: String,
    pub title: String,
    pub artist: String,
    pub source_name: String,
    pub is_playing: bool,
    pub is_active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct AuraConfig {
    pub theme: String,
    pub accent_color: String,
    pub glass_opacity: f32,
    pub always_on_top: bool,
    pub auto_hide_when_empty: bool,
    pub player_mode: String,
    pub snap_position: String,
    pub pos_x: i32,
    pub pos_y: i32,
    pub preferred_source: Option<String>,
    pub reduced_motion: bool,
    pub autostart: bool,
    pub hover_expand: bool,
    pub hover_delay_ms: u64,
    pub capsule_size: String,
    pub taskbar_docked: bool,
}

impl Default for AuraConfig {
    fn default() -> Self {
        Self {
            theme: "dark-glass".to_string(),
            accent_color: "amber".to_string(),
            glass_opacity: 0.88,
            always_on_top: true,
            auto_hide_when_empty: false,
            player_mode: "island".to_string(),
            snap_position: "bottom-right".to_string(),
            pos_x: -1,
            pos_y: -1,
            preferred_source: None,
            reduced_motion: false,
            autostart: false,
            hover_expand: true,
            hover_delay_ms: 400,
            capsule_size: "standard".to_string(),
            taskbar_docked: false,
        }
    }
}
