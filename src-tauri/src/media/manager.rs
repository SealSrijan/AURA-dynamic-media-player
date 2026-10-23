use crate::media::browser_server::BrowserServer;
use crate::media::gsmtc::GsmtcEngine;
use crate::types::{MediaState, PlaybackStatus, SessionItem};
use std::sync::Arc;
use tokio::sync::RwLock;

pub struct MediaManager {
    gsmtc: GsmtcEngine,
    browser: BrowserServer,
    preferred_source: Arc<RwLock<Option<String>>>,
}

impl MediaManager {
    pub fn new() -> Self {
        Self {
            gsmtc: GsmtcEngine::new(),
            browser: BrowserServer::new(),
            preferred_source: Arc::new(RwLock::new(None)),
        }
    }

    pub fn start(&self) {
        self.browser.start();
    }

    pub async fn get_state(&self) -> MediaState {
        let gsmtc_state = self.gsmtc.get_current_state();
        let browser_state = self.browser.get_state().await;
        let preferred = self.preferred_source.read().await.clone();

        // 1. If user set a preferred source, honor it if available
        if let Some(pref) = &preferred {
            if let Some(ref b) = browser_state {
                if b.source_id.contains(pref) || b.source_name.contains(pref) {
                    return b.clone();
                }
            }
            if let Some(ref g) = gsmtc_state {
                if g.source_id.contains(pref) || g.source_name.contains(pref) {
                    return g.clone();
                }
            }
        }

        // 2. Prioritize whichever source is actively PLAYING
        let browser_playing = browser_state.as_ref().map(|s| s.status == PlaybackStatus::Playing).unwrap_or(false);
        let gsmtc_playing = gsmtc_state.as_ref().map(|s| s.status == PlaybackStatus::Playing).unwrap_or(false);

        if browser_playing && !gsmtc_playing {
            return browser_state.unwrap();
        }

        if gsmtc_playing && !browser_playing {
            let mut g = gsmtc_state.unwrap();
            // If browser extension has richer artwork for the same playing source, blend it
            if g.artwork.is_none() {
                if let Some(ref b) = browser_state {
                    if is_same_track(&g.title, &b.title) {
                        g.artwork = b.artwork.clone();
                    }
                }
            }
            return g;
        }

        // 3. If both are playing (or neither is playing), prefer GSMTC with fallback to browser
        if let Some(mut g) = gsmtc_state {
            if g.artwork.is_none() {
                if let Some(ref b) = browser_state {
                    if is_same_track(&g.title, &b.title) {
                        g.artwork = b.artwork.clone();
                    }
                }
            }
            return g;
        }

        if let Some(b) = browser_state {
            return b;
        }

        // Fallback default empty state
        MediaState::default()
    }

    pub fn get_sessions(&self) -> Vec<SessionItem> {
        let mut list = self.gsmtc.get_sessions();

        if self.browser.is_extension_connected() {
            list.push(SessionItem {
                id: "browser:companion".to_string(),
                title: "Browser Media".to_string(),
                artist: "Web Player / Tabs".to_string(),
                source_name: "Web Browser (Extension)".to_string(),
                is_playing: false,
                is_active: false,
            });
        }

        list
    }

    pub async fn set_preferred_source(&self, source_id: Option<String>) {
        *self.preferred_source.write().await = source_id;
    }

    pub async fn play(&self) -> bool {
        let state = self.get_state().await;
        if state.is_browser_source {
            self.browser.send_command("play", None)
        } else {
            self.gsmtc.play()
        }
    }

    pub async fn pause(&self) -> bool {
        let state = self.get_state().await;
        if state.is_browser_source {
            self.browser.send_command("pause", None)
        } else {
            self.gsmtc.pause()
        }
    }

    pub async fn toggle_play_pause(&self) -> bool {
        let state = self.get_state().await;
        if state.is_browser_source {
            self.browser.send_command("toggle", None)
        } else {
            self.gsmtc.toggle_play_pause()
        }
    }

    pub async fn skip_next(&self) -> bool {
        let state = self.get_state().await;
        if state.is_browser_source {
            self.browser.send_command("next", None)
        } else {
            self.gsmtc.skip_next()
        }
    }

    pub async fn skip_previous(&self) -> bool {
        let state = self.get_state().await;
        if state.is_browser_source {
            self.browser.send_command("previous", None)
        } else {
            self.gsmtc.skip_previous()
        }
    }

    pub async fn seek_to(&self, position_ms: u64) -> bool {
        let state = self.get_state().await;
        if state.is_browser_source {
            self.browser.send_command("seek", Some(position_ms / 1000))
        } else {
            self.gsmtc.seek_to(position_ms)
        }
    }

    pub fn is_extension_connected(&self) -> bool {
        self.browser.is_extension_connected()
    }
}

fn is_same_track(a: &str, b: &str) -> bool {
    if a.is_empty() || b.is_empty() {
        return false;
    }
    let a_clean = a.to_lowercase().replace(' ', "");
    let b_clean = b.to_lowercase().replace(' ', "");
    a_clean.contains(&b_clean) || b_clean.contains(&a_clean)
}
