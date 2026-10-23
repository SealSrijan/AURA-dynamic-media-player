use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Emitter, Manager};

pub fn setup_tray(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let show_item = MenuItem::with_id(app, "toggle_visible", "Show / Hide Island", true, None::<&str>)?;
    let mode_island = MenuItem::with_id(app, "mode_island", "Dynamic Island (Desktop)", true, None::<&str>)?;
    let mode_taskbar = MenuItem::with_id(app, "mode_taskbar", "Taskbar Strip Mode", true, None::<&str>)?;
    let mode_expanded = MenuItem::with_id(app, "mode_expanded", "Expanded Now Playing", true, None::<&str>)?;
    let reset_pos_item = MenuItem::with_id(app, "reset_position", "Center Island on Screen", true, None::<&str>)?;
    let settings_item = MenuItem::with_id(app, "open_settings", "Settings...", true, None::<&str>)?;
    let quit_item = MenuItem::with_id(app, "quit", "Quit AURA", true, None::<&str>)?;

    let menu = Menu::with_items(
        app,
        &[
            &show_item,
            &mode_island,
            &mode_taskbar,
            &mode_expanded,
            &reset_pos_item,
            &settings_item,
            &quit_item,
        ],
    )?;

    let _tray = TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "toggle_visible" => {
                if let Some(window) = app.get_webview_window("main") {
                    if window.is_visible().unwrap_or(false) {
                        let _ = window.hide();
                    } else {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
            }
            "mode_island" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let (w, h) = crate::commands::get_mode_dimensions("island", "standard", false);
                    let _ = window.set_size(tauri::Size::Logical(tauri::LogicalSize { width: w, height: h }));
                    let _ = window.emit("change_mode", "island");
                }
            }
            "mode_taskbar" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let (w, h) = crate::commands::get_mode_dimensions("taskbar", "standard", false);
                    let _ = window.set_size(tauri::Size::Logical(tauri::LogicalSize { width: w, height: h }));
                    if let Ok(Some(monitor)) = window.current_monitor() {
                        let scale = monitor.scale_factor();
                        let screen_w = monitor.size().width as f64 / scale;
                        let screen_h = monitor.size().height as f64 / scale;
                        let _ = window.set_position(tauri::Position::Logical(tauri::LogicalPosition {
                            x: screen_w - w - 200.0,
                            y: screen_h - h - 3.0,
                        }));
                    }
                    let _ = window.emit("change_mode", "taskbar");
                }
            }
            "mode_expanded" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let (w, h) = crate::commands::get_mode_dimensions("expanded", "standard", false);
                    let _ = window.set_size(tauri::Size::Logical(tauri::LogicalSize { width: w, height: h }));
                    let _ = window.emit("change_mode", "expanded");
                }
            }
            "reset_position" => {
                if let Some(window) = app.get_webview_window("main") {
                    let (w, h) = crate::commands::get_mode_dimensions("island", "standard", false);
                    if let Ok(Some(monitor)) = window.current_monitor() {
                        let scale = monitor.scale_factor();
                        let screen_w = monitor.size().width as f64 / scale;
                        let x = (screen_w - w) / 2.0;
                        let y = 28.0;
                        let _ = window.set_position(tauri::Position::Logical(tauri::LogicalPosition { x, y }));
                        let _ = window.set_size(tauri::Size::Logical(tauri::LogicalSize { width: w, height: h }));
                        let _ = window.emit("change_mode", "island");
                    }
                }
            }
            "open_settings" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let (w, h) = crate::commands::get_mode_dimensions("settings", "standard", false);
                    let _ = window.set_size(tauri::Size::Logical(tauri::LogicalSize { width: w, height: h }));
                    let _ = window.emit("change_mode", "settings");
                }
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    if window.is_visible().unwrap_or(false) {
                        let _ = window.hide();
                    } else {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
            }
        })
        .build(app)?;

    Ok(())
}
