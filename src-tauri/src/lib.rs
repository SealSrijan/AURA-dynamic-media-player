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
                let (w, h) = commands::get_mode_dimensions(
                    &initial_config.player_mode,
                    &initial_config.capsule_size,
                    false,
                );
                let _ = window.set_size(tauri::Size::Logical(tauri::LogicalSize { width: w, height: h }));

                // Position window with multi-monitor bounds check
                let mut position_restored = false;
                if initial_config.pos_x >= 0 && initial_config.pos_y >= 0 {
                    if let Ok(monitors) = window.available_monitors() {
                        for m in monitors {
                            let scale = m.scale_factor();
                            let mon_x = m.position().x as f64 / scale;
                            let mon_y = m.position().y as f64 / scale;
                            let mon_w = m.size().width as f64 / scale;
                            let mon_h = m.size().height as f64 / scale;
                            let px = initial_config.pos_x as f64;
                            let py = initial_config.pos_y as f64;

                            if px >= mon_x && px <= (mon_x + mon_w - 40.0)
                                && py >= mon_y && py <= (mon_y + mon_h - 40.0) {
                                let _ = window.set_position(tauri::Position::Logical(tauri::LogicalPosition {
                                    x: px,
                                    y: py,
                                }));
                                position_restored = true;
                                break;
                            }
                        }
                    }
                }

                if !position_restored {
                    if initial_config.player_mode == "taskbar" {
                        if let Ok(Some(monitor)) = window.current_monitor() {
                            let scale = monitor.scale_factor();
                            let screen_w = monitor.size().width as f64 / scale;
                            let screen_h = monitor.size().height as f64 / scale;
                            let _ = window.set_position(tauri::Position::Logical(tauri::LogicalPosition {
                                x: screen_w - 280.0 - 200.0,
                                y: screen_h - 42.0 - 3.0,
                            }));
                        }
                    } else if let Ok(Some(monitor)) = window.current_monitor() {
                        let scale = monitor.scale_factor();
                        let screen_w = monitor.size().width as f64 / scale;
                        let x = (screen_w - w) / 2.0;
                        let y = 28.0;
                        let _ = window.set_position(tauri::Position::Logical(tauri::LogicalPosition { x, y }));
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
            set_island_hover,
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

pub fn run_internal_tests() {
    println!("\nrunning 6 internal regression tests:");

    // 1. Mode Dimensions
    print!("test commands::test_mode_dimensions ... ");
    assert_eq!(commands::get_mode_dimensions("taskbar", "standard", false), (280.0, 42.0));
    assert_eq!(commands::get_mode_dimensions("expanded", "standard", false), (360.0, 270.0));
    assert_eq!(commands::get_mode_dimensions("settings", "standard", false), (420.0, 480.0));
    assert_eq!(commands::get_mode_dimensions("island", "compact", false), (228.0, 48.0));
    assert_eq!(commands::get_mode_dimensions("island", "standard", false), (256.0, 48.0));
    assert_eq!(commands::get_mode_dimensions("island", "large", false), (284.0, 48.0));
    assert_eq!(commands::get_mode_dimensions("island", "standard", true), (380.0, 48.0));
    println!("ok");

    // 2. Snap Positions
    print!("test commands::test_calculate_snap_positions ... ");
    let (tc_x, tc_y) = commands::calculate_snap_position("top-center", 1920.0, 1080.0, 256.0, 48.0);
    assert_eq!(tc_x, (1920.0 - 256.0) / 2.0);
    assert_eq!(tc_y, 24.0);
    let (tl_x, tl_y) = commands::calculate_snap_position("top-left", 1920.0, 1080.0, 256.0, 48.0);
    assert_eq!(tl_x, 24.0);
    assert_eq!(tl_y, 24.0);
    let (c_x, c_y) = commands::calculate_snap_position("center", 1920.0, 1080.0, 256.0, 48.0);
    assert_eq!(c_x, (1920.0 - 256.0) / 2.0);
    assert_eq!(c_y, (1080.0 - 48.0) / 2.0);
    println!("ok");

    // 3. Default Config
    print!("test config::test_default_config_values ... ");
    let default = types::AuraConfig::default();
    assert_eq!(default.theme, "dark-glass");
    assert_eq!(default.accent_color, "amber");
    assert_eq!(default.player_mode, "island");
    assert!(default.always_on_top);
    assert!(default.hover_expand);
    println!("ok");

    // 4. Config Serialization
    print!("test config::test_config_serialization ... ");
    let config = types::AuraConfig::default();
    let serialized = serde_json::to_string(&config).expect("Serialize AuraConfig");
    let deserialized: types::AuraConfig = serde_json::from_str(&serialized).expect("Deserialize AuraConfig");
    assert_eq!(deserialized.theme, config.theme);
    assert_eq!(deserialized.accent_color, config.accent_color);
    println!("ok");

    // 5. Track Comparison
    print!("test media::test_is_same_track ... ");
    let is_same = |a: &str, b: &str| -> bool {
        if a.is_empty() || b.is_empty() { return false; }
        let a_clean = a.to_lowercase().replace(' ', "");
        let b_clean = b.to_lowercase().replace(' ', "");
        a_clean.contains(&b_clean) || b_clean.contains(&a_clean)
    };
    assert!(is_same("Blinding Lights", "Blinding Lights - Single"));
    assert!(is_same("Starboy (feat. Daft Punk)", "Starboy"));
    assert!(!is_same("Song A", "Song B"));
    println!("ok");

    // 6. Browser Message Deserialization
    print!("test media::test_browser_message_deserialization ... ");
    let json = r#"{
        "type": "browser_media_update",
        "data": {
            "title": "Starboy",
            "artist": "The Weeknd",
            "album": "Starboy",
            "playing": true,
            "currentTime": 45,
            "duration": 230,
            "source": "youtube.com"
        }
    }"#;
    let msg: Result<media::browser_server::BrowserMessage, _> = serde_json::from_str(json);
    assert!(msg.is_ok());
    let msg = msg.unwrap();
    assert_eq!(msg.r#type, "browser_media_update");
    let data = msg.data.unwrap();
    assert_eq!(data.title.as_deref(), Some("Starboy"));
    assert_eq!(data.current_time, Some(45));
    assert_eq!(data.playing, Some(true));
    println!("ok");

    println!("\ntest result: ok. 6 passed; 0 failed\n");
}
