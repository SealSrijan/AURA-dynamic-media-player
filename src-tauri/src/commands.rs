use crate::config::ConfigManager;
use crate::media::MediaManager;
use crate::types::{AuraConfig, MediaState, SessionItem};
use std::sync::Arc;
use tauri::{AppHandle, WebviewWindow};

pub struct AppState {
    pub media_manager: Arc<MediaManager>,
    pub config_manager: Arc<ConfigManager>,
}

#[tauri::command]
pub async fn get_media_state(state: tauri::State<'_, AppState>) -> Result<MediaState, String> {
    Ok(state.media_manager.get_state().await)
}

#[tauri::command]
pub async fn media_play(state: tauri::State<'_, AppState>) -> Result<bool, String> {
    Ok(state.media_manager.play().await)
}

#[tauri::command]
pub async fn media_pause(state: tauri::State<'_, AppState>) -> Result<bool, String> {
    Ok(state.media_manager.pause().await)
}

#[tauri::command]
pub async fn media_toggle(state: tauri::State<'_, AppState>) -> Result<bool, String> {
    Ok(state.media_manager.toggle_play_pause().await)
}

#[tauri::command]
pub async fn media_next(state: tauri::State<'_, AppState>) -> Result<bool, String> {
    Ok(state.media_manager.skip_next().await)
}

#[tauri::command]
pub async fn media_prev(state: tauri::State<'_, AppState>) -> Result<bool, String> {
    Ok(state.media_manager.skip_previous().await)
}

#[tauri::command]
pub async fn media_seek(position_ms: u64, state: tauri::State<'_, AppState>) -> Result<bool, String> {
    Ok(state.media_manager.seek_to(position_ms).await)
}

#[tauri::command]
pub async fn get_sessions(state: tauri::State<'_, AppState>) -> Result<Vec<SessionItem>, String> {
    Ok(state.media_manager.get_sessions())
}

#[tauri::command]
pub async fn set_active_source(source_id: Option<String>, state: tauri::State<'_, AppState>) -> Result<(), String> {
    state.media_manager.set_preferred_source(source_id).await;
    Ok(())
}

#[tauri::command]
pub fn get_config(state: tauri::State<'_, AppState>) -> Result<AuraConfig, String> {
    Ok(state.config_manager.load())
}

#[tauri::command]
pub fn save_config(config: AuraConfig, state: tauri::State<'_, AppState>) -> Result<(), String> {
    state.config_manager.save(&config)
}

#[tauri::command]
pub async fn is_browser_connected(state: tauri::State<'_, AppState>) -> Result<bool, String> {
    Ok(state.media_manager.is_extension_connected())
}

#[tauri::command]
pub fn set_player_mode(
    window: WebviewWindow,
    mode: String,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    let (width, height) = match mode.as_str() {
        "taskbar" => (280.0, 42.0),
        "expanded" => (360.0, 270.0),
        "settings" => (420.0, 480.0),
        _ => (390.0, 56.0), // "island" default (allows smooth hover expand inside 390x56 transparent bounds)
    };

    let _ = window.set_size(tauri::Size::Logical(tauri::LogicalSize { width, height }));

    // Adjust position if expanding would push the window off the screen
    if let Ok(Some(monitor)) = window.current_monitor() {
        let scale = monitor.scale_factor();
        let screen_h = monitor.size().height as f64 / scale;
        let screen_w = monitor.size().width as f64 / scale;
        if let Ok(pos) = window.outer_position() {
            let cur_x = pos.x as f64 / scale;
            let cur_y = pos.y as f64 / scale;
            let mut new_y = cur_y;
            let mut new_x = cur_x;

            if cur_y + height > screen_h - 40.0 {
                new_y = (screen_h - height - 56.0).max(10.0);
            }
            if cur_x + width > screen_w - 20.0 {
                new_x = (screen_w - width - 24.0).max(10.0);
            }
            if (new_y - cur_y).abs() > 1.0 || (new_x - cur_x).abs() > 1.0 {
                let _ = window.set_position(tauri::Position::Logical(tauri::LogicalPosition {
                    x: new_x,
                    y: new_y,
                }));
            }
        }
    }

    // Persist mode in config
    let mut config = state.config_manager.load();
    config.player_mode = mode;
    let _ = state.config_manager.save(&config);

    Ok(())
}

#[tauri::command]
pub fn set_always_on_top(
    window: WebviewWindow,
    enabled: bool,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    let _ = window.set_always_on_top(enabled);
    let mut config = state.config_manager.load();
    config.always_on_top = enabled;
    let _ = state.config_manager.save(&config);
    Ok(())
}

#[tauri::command]
pub fn snap_to_corner(
    window: WebviewWindow,
    corner: String,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    if let Ok(Some(monitor)) = window.current_monitor() {
        let screen_size = monitor.size();
        let scale = monitor.scale_factor();
        let screen_w = screen_size.width as f64 / scale;
        let screen_h = screen_size.height as f64 / scale;

        let cur_size = window.outer_size().unwrap_or(tauri::PhysicalSize { width: 360, height: 74 });
        let w = cur_size.width as f64 / scale;
        let h = cur_size.height as f64 / scale;

        let margin = 24.0;
        let taskbar_offset = 56.0; // Typical Windows taskbar

        let (x, y) = match corner.as_str() {
            "taskbar" => {
                // Dock directly in the taskbar strip, aligned to the left of the system tray clock
                let tray_offset = 220.0;
                (screen_w - w - tray_offset, screen_h - h - 3.0)
            }
            "bottom-left" => (margin, screen_h - h - taskbar_offset),
            "top-right" => (screen_w - w - margin, margin),
            "top-left" => (margin, margin),
            "center" => ((screen_w - w) / 2.0, (screen_h - h) / 2.0),
            _ => (screen_w - w - margin, screen_h - h - taskbar_offset), // "bottom-right"
        };

        let _ = window.set_position(tauri::Position::Logical(tauri::LogicalPosition { x, y }));

        let mut config = state.config_manager.load();
        config.snap_position = corner;
        config.pos_x = x as i32;
        config.pos_y = y as i32;
        let _ = state.config_manager.save(&config);
    }
    Ok(())
}

#[tauri::command]
pub fn save_position(
    x: i32,
    y: i32,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    let mut config = state.config_manager.load();
    config.pos_x = x;
    config.pos_y = y;
    let _ = state.config_manager.save(&config);
    Ok(())
}

#[tauri::command]
pub fn reset_position(
    window: WebviewWindow,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    if let Ok(Some(monitor)) = window.current_monitor() {
        let scale = monitor.scale_factor();
        let screen_w = monitor.size().width as f64 / scale;
        let width = 390.0;
        let height = 56.0;

        let _ = window.set_size(tauri::Size::Logical(tauri::LogicalSize { width, height }));

        // Position at top center of primary monitor (Dynamic Island aesthetic)
        let x = (screen_w - width) / 2.0;
        let y = 32.0;

        let _ = window.set_position(tauri::Position::Logical(tauri::LogicalPosition { x, y }));

        let mut config = state.config_manager.load();
        config.player_mode = "island".to_string();
        config.pos_x = x as i32;
        config.pos_y = y as i32;
        config.taskbar_docked = false;
        let _ = state.config_manager.save(&config);
    }
    Ok(())
}

#[tauri::command]
pub fn dock_to_taskbar(
    window: WebviewWindow,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    if let Ok(Some(monitor)) = window.current_monitor() {
        let scale = monitor.scale_factor();
        let screen_w = monitor.size().width as f64 / scale;
        let screen_h = monitor.size().height as f64 / scale;
        let width = 280.0;
        let height = 42.0;

        let _ = window.set_size(tauri::Size::Logical(tauri::LogicalSize { width, height }));

        // Place flush against the bottom taskbar, left of system tray icons
        let x = screen_w - width - 200.0;
        let y = screen_h - height - 3.0;

        let _ = window.set_position(tauri::Position::Logical(tauri::LogicalPosition { x, y }));

        let mut config = state.config_manager.load();
        config.player_mode = "taskbar".to_string();
        config.taskbar_docked = true;
        config.pos_x = x as i32;
        config.pos_y = y as i32;
        let _ = state.config_manager.save(&config);
    }
    Ok(())
}

#[tauri::command]
pub fn undock_from_taskbar(
    window: WebviewWindow,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    if let Ok(Some(monitor)) = window.current_monitor() {
        let scale = monitor.scale_factor();
        let screen_w = monitor.size().width as f64 / scale;
        let screen_h = monitor.size().height as f64 / scale;
        let width = 390.0;
        let height = 56.0;

        let _ = window.set_size(tauri::Size::Logical(tauri::LogicalSize { width, height }));

        // Float 90px above the taskbar
        let x = screen_w - width - 30.0;
        let y = screen_h - height - 90.0;

        let _ = window.set_position(tauri::Position::Logical(tauri::LogicalPosition { x, y }));

        let mut config = state.config_manager.load();
        config.player_mode = "island".to_string();
        config.taskbar_docked = false;
        config.pos_x = x as i32;
        config.pos_y = y as i32;
        let _ = state.config_manager.save(&config);
    }
    Ok(())
}

#[tauri::command]
pub fn start_dragging(window: WebviewWindow) -> Result<(), String> {
    let _ = window.start_dragging();
    Ok(())
}

#[tauri::command]
pub fn move_window(delta_x: f64, delta_y: f64, window: WebviewWindow) -> Result<(), String> {
    if let Ok(pos) = window.outer_position() {
        if let Ok(Some(monitor)) = window.current_monitor() {
            let scale = monitor.scale_factor();
            let cur_x = pos.x as f64 / scale;
            let cur_y = pos.y as f64 / scale;
            let new_x = cur_x + delta_x;
            let new_y = cur_y + delta_y;
            let _ = window.set_position(tauri::Position::Logical(tauri::LogicalPosition {
                x: new_x,
                y: new_y,
            }));
        }
    }
    Ok(())
}

#[tauri::command]
pub fn quit_app(app: AppHandle) {
    app.exit(0);
}
