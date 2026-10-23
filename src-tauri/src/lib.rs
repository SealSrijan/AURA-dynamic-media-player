pub mod commands;
pub mod config;
pub mod media;
pub mod tray;
pub mod types;

use commands::*;
use config::ConfigManager;
use media::MediaManager;
use std::sync::Arc;
use tauri::{Emitter, Manager};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let config_manager = Arc::new(ConfigManager::new());
    let media_manager = Arc::new(MediaManager::new());

    let initial_config = config_manager.load();

    let state = AppState {
        media_manager: Arc::clone(&media_manager),
        config_manager: Arc::clone(&config_manager),
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::new().build())
        .manage(state)
        .setup(move |app| {
            // Start background companion browser server
            media_manager.start();

            if let Some(window) = app.get_webview_window("main") {
                // Ensure the window does NOT show as a separate app in the Windows taskbar
                let _ = window.set_skip_taskbar(true);

                // Apply saved always on top
                let _ = window.set_always_on_top(initial_config.always_on_top);

                // Set initial mode size
                let (w, h) = match initial_config.player_mode.as_str() {
                    "taskbar" => (280.0, 42.0),
                    "expanded" => (360.0, 270.0),
                    "settings" => (420.0, 480.0),
                    _ => (390.0, 56.0), // "island" default (transparent canvas allows smooth hover expansion)
                };
                let _ = window.set_size(tauri::Size::Logical(tauri::LogicalSize { width: w, height: h }));

                // Position window
                if initial_config.pos_x >= 0 && initial_config.pos_y >= 0 {
                    let _ = window.set_position(tauri::Position::Logical(tauri::LogicalPosition {
                        x: initial_config.pos_x as f64,
                        y: initial_config.pos_y as f64,
                    }));
                } else if initial_config.player_mode == "taskbar" {
                    if let Ok(Some(monitor)) = window.current_monitor() {
                        let scale = monitor.scale_factor();
                        let screen_w = monitor.size().width as f64 / scale;
                        let screen_h = monitor.size().height as f64 / scale;
                        let _ = window.set_position(tauri::Position::Logical(tauri::LogicalPosition {
                            x: screen_w - 280.0 - 200.0,
                            y: screen_h - 42.0 - 3.0,
                        }));
                    }
                } else {
                    // Snap to top-center of screen by default for authentic Dynamic Island aesthetic
                    if let Ok(Some(monitor)) = window.current_monitor() {
                        let scale = monitor.scale_factor();
                        let screen_w = monitor.size().width as f64 / scale;
                        let x = (screen_w - 390.0) / 2.0;
                        let y = 32.0;
                        let _ = window.set_position(tauri::Position::Logical(tauri::LogicalPosition { x, y }));
                    } else {
                        let _ = snap_window_to_bottom_right(&window);
                    }
                }
            }

            // Setup system tray
            let _ = tray::setup_tray(app.handle());

            // Background polling loop to emit state updates to frontend
            let app_handle = app.handle().clone();
            let media_mgr = Arc::clone(&media_manager);

            tauri::async_runtime::spawn(async move {
                let mut last_title = String::new();
                let mut last_status = types::PlaybackStatus::Stopped;
                let mut last_pos = 0u64;

                loop {
                    tokio::time::sleep(tokio::time::Duration::from_millis(800)).await;
                    let current = media_mgr.get_state().await;

                    // Emit event if state changed or playing
                    let is_playing = current.status == types::PlaybackStatus::Playing;
                    let changed = current.title != last_title
                        || current.status != last_status
                        || (is_playing && current.position_ms.abs_diff(last_pos) >= 800);

                    if changed {
                        last_title = current.title.clone();
                        last_status = current.status.clone();
                        last_pos = current.position_ms;
                        let _ = app_handle.emit("media_state_changed", &current);
                    }
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_media_state,
            media_play,
            media_pause,
            media_toggle,
            media_next,
            media_prev,
            media_seek,
            get_sessions,
            set_active_source,
            get_config,
            save_config,
            is_browser_connected,
            set_player_mode,
            set_always_on_top,
            snap_to_corner,
            save_position,
            reset_position,
            dock_to_taskbar,
            undock_from_taskbar,
            start_dragging,
            move_window,
            quit_app,
        ])
        .run(tauri::generate_context!())
        .expect("error while running AURA application");
}

fn snap_window_to_bottom_right(window: &tauri::WebviewWindow) -> Result<(), Box<dyn std::error::Error>> {
    if let Ok(Some(monitor)) = window.current_monitor() {
        let screen_size = monitor.size();
        let scale = monitor.scale_factor();
        let screen_w = screen_size.width as f64 / scale;
        let screen_h = screen_size.height as f64 / scale;

        let cur_size = window.outer_size().unwrap_or(tauri::PhysicalSize { width: 360, height: 74 });
        let w = cur_size.width as f64 / scale;
        let h = cur_size.height as f64 / scale;

        let margin = 24.0;
        let taskbar_offset = 56.0;

        let x = screen_w - w - margin;
        let y = screen_h - h - taskbar_offset;

        let _ = window.set_position(tauri::Position::Logical(tauri::LogicalPosition { x, y }));
    }
    Ok(())
}
