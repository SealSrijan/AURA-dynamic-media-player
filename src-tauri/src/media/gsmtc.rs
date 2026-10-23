use crate::types::{MediaState, PlaybackStatus, SessionItem};
use base64::engine::general_purpose::STANDARD as BASE64_STANDARD;
use base64::Engine;
use std::time::{SystemTime, UNIX_EPOCH};
use windows::Media::Control::{
    GlobalSystemMediaTransportControlsSession,
    GlobalSystemMediaTransportControlsSessionManager,
    GlobalSystemMediaTransportControlsSessionPlaybackStatus,
};
use windows::Storage::Streams::DataReader;

pub struct GsmtcEngine {
    manager: Option<GlobalSystemMediaTransportControlsSessionManager>,
}

impl GsmtcEngine {
    pub fn new() -> Self {
        let manager = match GlobalSystemMediaTransportControlsSessionManager::RequestAsync() {
            Ok(async_op) => async_op.get().ok(),
            Err(e) => {
                log::warn!("Failed to initialize GSMTC Manager: {:?}", e);
                None
            }
        };

        Self { manager }
    }

    pub fn get_current_state(&self) -> Option<MediaState> {
        let manager = self.manager.as_ref()?;
        let session = self.get_best_session(manager)?;
        self.extract_session_state(&session)
    }

    pub fn get_sessions(&self) -> Vec<SessionItem> {
        let mut items = Vec::new();
        let Some(manager) = self.manager.as_ref() else {
            return items;
        };

        let current_id = manager
            .GetCurrentSession()
            .ok()
            .and_then(|s| s.SourceAppUserModelId().ok())
            .map(|h| h.to_string())
            .unwrap_or_default();

        if let Ok(sessions) = manager.GetSessions() {
            if let Ok(count) = sessions.Size() {
                for i in 0..count {
                    if let Ok(s) = sessions.GetAt(i) {
                        let app_id = s.SourceAppUserModelId().map(|h| h.to_string()).unwrap_or_default();
                        let source_name = format_source_name(&app_id);
                        let mut title = String::new();
                        let mut artist = String::new();
                        let mut is_playing = false;

                        if let Ok(info) = s.GetPlaybackInfo() {
                            if let Ok(status) = info.PlaybackStatus() {
                                is_playing = status == GlobalSystemMediaTransportControlsSessionPlaybackStatus::Playing;
                            }
                        }

                        if let Ok(media_op) = s.TryGetMediaPropertiesAsync() {
                            if let Ok(media) = media_op.get() {
                                title = media.Title().unwrap_or_default().to_string();
                                artist = media.Artist().unwrap_or_default().to_string();
                            }
                        }

                        let is_active = app_id == current_id;

                        items.push(SessionItem {
                            id: app_id,
                            title,
                            artist,
                            source_name,
                            is_playing,
                            is_active,
                        });
                    }
                }
            }
        }

        items
    }

    fn get_best_session(
        &self,
        manager: &GlobalSystemMediaTransportControlsSessionManager,
    ) -> Option<GlobalSystemMediaTransportControlsSession> {
        // First check current session
        if let Ok(session) = manager.GetCurrentSession() {
            if let Ok(info) = session.GetPlaybackInfo() {
                if let Ok(status) = info.PlaybackStatus() {
                    if status == GlobalSystemMediaTransportControlsSessionPlaybackStatus::Playing {
                        return Some(session);
                    }
                }
            }
        }

        // If current session is not playing, check all sessions for any playing session
        if let Ok(sessions) = manager.GetSessions() {
            if let Ok(count) = sessions.Size() {
                for i in 0..count {
                    if let Ok(s) = sessions.GetAt(i) {
                        if let Ok(info) = s.GetPlaybackInfo() {
                            if let Ok(status) = info.PlaybackStatus() {
                                if status == GlobalSystemMediaTransportControlsSessionPlaybackStatus::Playing {
                                    return Some(s);
                                }
                            }
                        }
                    }
                }
            }
        }

        // Otherwise fallback to whatever session manager deems current, or first session
        if let Ok(session) = manager.GetCurrentSession() {
            return Some(session);
        }

        if let Ok(sessions) = manager.GetSessions() {
            if let Ok(count) = sessions.Size() {
                if count > 0 {
                    return sessions.GetAt(0).ok();
                }
            }
        }

        None
    }

    fn extract_session_state(
        &self,
        session: &GlobalSystemMediaTransportControlsSession,
    ) -> Option<MediaState> {
        let app_id = session.SourceAppUserModelId().map(|h| h.to_string()).unwrap_or_default();
        let source_name = format_source_name(&app_id);

        let mut status = PlaybackStatus::Stopped;
        let mut can_play = false;
        let mut can_pause = false;
        let mut can_skip_next = false;
        let mut can_skip_prev = false;

        if let Ok(info) = session.GetPlaybackInfo() {
            if let Ok(s) = info.PlaybackStatus() {
                status = match s {
                    GlobalSystemMediaTransportControlsSessionPlaybackStatus::Playing => PlaybackStatus::Playing,
                    GlobalSystemMediaTransportControlsSessionPlaybackStatus::Paused => PlaybackStatus::Paused,
                    _ => PlaybackStatus::Stopped,
                };
            }

            if let Ok(controls) = info.Controls() {
                can_play = controls.IsPlayEnabled().unwrap_or(false);
                can_pause = controls.IsPauseEnabled().unwrap_or(false);
                can_skip_next = controls.IsNextEnabled().unwrap_or(false);
                can_skip_prev = controls.IsPreviousEnabled().unwrap_or(false);
            }
        }

        let mut title = String::new();
        let mut artist = String::new();
        let mut album = String::new();
        let mut artwork = None;

        if let Ok(media_op) = session.TryGetMediaPropertiesAsync() {
            if let Ok(media) = media_op.get() {
                title = media.Title().unwrap_or_default().to_string();
                artist = media.Artist().unwrap_or_default().to_string();
                album = media.AlbumTitle().unwrap_or_default().to_string();

                if let Ok(thumb_ref) = media.Thumbnail() {
                    if let Ok(stream_op) = thumb_ref.OpenReadAsync() {
                        if let Ok(stream) = stream_op.get() {
                            if let Ok(size) = stream.Size() {
                                if size > 0 && size < 10_000_000 {
                                    if let Ok(reader) = DataReader::CreateDataReader(&stream) {
                                        if let Ok(load_op) = reader.LoadAsync(size as u32) {
                                            if load_op.get().is_ok() {
                                                let mut bytes = vec![0u8; size as usize];
                                                if reader.ReadBytes(&mut bytes).is_ok() {
                                                    let b64 = BASE64_STANDARD.encode(&bytes);
                                                    artwork = Some(format!("data:image/jpeg;base64,{}", b64));
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        let mut position_ms = 0;
        let mut duration_ms = 0;
        let mut can_seek = false;

        if let Ok(timeline) = session.GetTimelineProperties() {
            if let Ok(pos) = timeline.Position() {
                position_ms = (pos.Duration / 10_000).max(0) as u64;
            }
            if let Ok(end) = timeline.EndTime() {
                duration_ms = (end.Duration / 10_000).max(0) as u64;
            }
            can_seek = duration_ms > 0;
        }

        let now_ms = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis() as u64;

        Some(MediaState {
            title,
            artist,
            album,
            artwork,
            status,
            position_ms,
            duration_ms,
            can_play,
            can_pause,
            can_skip_next,
            can_skip_prev,
            can_seek,
            source_id: app_id,
            source_name,
            is_browser_source: false,
            updated_at_ms: now_ms,
        })
    }

    pub fn play(&self) -> bool {
        if let Some(session) = self.manager.as_ref().and_then(|m| self.get_best_session(m)) {
            session.TryPlayAsync().map(|op| op.get().unwrap_or(false)).unwrap_or(false)
        } else {
            false
        }
    }

    pub fn pause(&self) -> bool {
        if let Some(session) = self.manager.as_ref().and_then(|m| self.get_best_session(m)) {
            session.TryPauseAsync().map(|op| op.get().unwrap_or(false)).unwrap_or(false)
        } else {
            false
        }
    }

    pub fn toggle_play_pause(&self) -> bool {
        if let Some(session) = self.manager.as_ref().and_then(|m| self.get_best_session(m)) {
            session.TryTogglePlayPauseAsync().map(|op| op.get().unwrap_or(false)).unwrap_or(false)
        } else {
            false
        }
    }

    pub fn skip_next(&self) -> bool {
        if let Some(session) = self.manager.as_ref().and_then(|m| self.get_best_session(m)) {
            session.TrySkipNextAsync().map(|op| op.get().unwrap_or(false)).unwrap_or(false)
        } else {
            false
        }
    }

    pub fn skip_previous(&self) -> bool {
        if let Some(session) = self.manager.as_ref().and_then(|m| self.get_best_session(m)) {
            session.TrySkipPreviousAsync().map(|op| op.get().unwrap_or(false)).unwrap_or(false)
        } else {
            false
        }
    }

    pub fn seek_to(&self, position_ms: u64) -> bool {
        if let Some(session) = self.manager.as_ref().and_then(|m| self.get_best_session(m)) {
            let position_100ns = (position_ms as i64) * 10_000;
            session.TryChangePlaybackPositionAsync(position_100ns).map(|op| op.get().unwrap_or(false)).unwrap_or(false)
        } else {
            false
        }
    }
}

fn format_source_name(app_id: &str) -> String {
    let lower = app_id.to_lowercase();
    if lower.contains("spotify") {
        "Spotify".to_string()
    } else if lower.contains("brave") {
        "Brave".to_string()
    } else if lower.contains("chrome") {
        "Chrome".to_string()
    } else if lower.contains("msedge") || lower.contains("edge") {
        "Microsoft Edge".to_string()
    } else if lower.contains("firefox") {
        "Firefox".to_string()
    } else if lower.contains("vlc") {
        "VLC Media Player".to_string()
    } else if lower.contains("itunes") {
        "Apple Music / iTunes".to_string()
    } else if lower.contains("musicbee") {
        "MusicBee".to_string()
    } else if lower.contains("foobar") {
        "foobar2000".to_string()
    } else {
        // Strip file extensions or package hashes
        let name = app_id.split('\\').last().unwrap_or(app_id);
        let name = name.split('.').next().unwrap_or(name);
        if name.is_empty() {
            "Media Player".to_string()
        } else {
            name.to_string()
        }
    }
}
