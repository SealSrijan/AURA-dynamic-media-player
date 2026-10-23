use crate::types::{MediaState, PlaybackStatus};
use futures_util::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};
use tokio::net::TcpListener;
use tokio::sync::{broadcast, RwLock};
use tokio_tungstenite::tungstenite::Message;

#[derive(Debug, Clone, Deserialize)]
pub struct BrowserPayload {
    pub title: Option<String>,
    pub artist: Option<String>,
    pub album: Option<String>,
    pub artwork: Option<String>,
    pub playing: Option<bool>,
    #[serde(rename = "currentTime")]
    pub current_time: Option<u64>,
    pub duration: Option<u64>,
    pub source: Option<String>,
    pub url: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct BrowserMessage {
    pub r#type: String,
    pub data: Option<BrowserPayload>,
}

#[derive(Debug, Clone, Serialize)]
pub struct BrowserCommand {
    pub r#type: String,
    pub action: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub value: Option<u64>,
}

pub struct BrowserServer {
    current_state: Arc<RwLock<Option<MediaState>>>,
    command_tx: broadcast::Sender<BrowserCommand>,
    is_connected: Arc<AtomicBool>,
}

impl BrowserServer {
    pub fn new() -> Self {
        let (command_tx, _) = broadcast::channel(32);
        let current_state = Arc::new(RwLock::new(None));
        let is_connected = Arc::new(AtomicBool::new(false));

        Self {
            current_state,
            command_tx,
            is_connected,
        }
    }

    pub fn start(&self) {
        let state_clone = Arc::clone(&self.current_state);
        let command_tx_clone = self.command_tx.clone();
        let connected_clone = Arc::clone(&self.is_connected);

        tauri::async_runtime::spawn(async move {
            run_server(state_clone, command_tx_clone, connected_clone).await;
        });
    }

    pub async fn get_state(&self) -> Option<MediaState> {
        self.current_state.read().await.clone()
    }

    pub fn is_extension_connected(&self) -> bool {
        self.is_connected.load(Ordering::Relaxed)
    }

    pub fn send_command(&self, action: &str, value: Option<u64>) -> bool {
        if !self.is_extension_connected() {
            return false;
        }
        let cmd = BrowserCommand {
            r#type: "command".to_string(),
            action: action.to_string(),
            value,
        };
        self.command_tx.send(cmd).is_ok()
    }
}

async fn run_server(
    state: Arc<RwLock<Option<MediaState>>>,
    command_tx: broadcast::Sender<BrowserCommand>,
    connected: Arc<AtomicBool>,
) {
    let addr: SocketAddr = "127.0.0.1:48123".parse().unwrap();
    let listener = match TcpListener::bind(&addr).await {
        Ok(l) => {
            log::info!("AURA Browser Server listening on ws://{}", addr);
            l
        }
        Err(e) => {
            log::warn!("Could not bind Browser Server on {}: {:?}", addr, e);
            return;
        }
    };

    while let Ok((stream, _)) = listener.accept().await {
        let state_ref = Arc::clone(&state);
        let mut command_rx = command_tx.subscribe();
        let connected_ref = Arc::clone(&connected);

        tokio::spawn(async move {
            if let Ok(ws_stream) = tokio_tungstenite::accept_async(stream).await {
                connected_ref.store(true, Ordering::Relaxed);
                log::info!("Browser Companion Extension connected to AURA!");

                let (mut ws_sender, mut ws_receiver) = ws_stream.split();

                loop {
                    tokio::select! {
                        Some(msg_res) = ws_receiver.next() => {
                            match msg_res {
                                Ok(Message::Text(text)) => {
                                    if let Ok(msg) = serde_json::from_str::<BrowserMessage>(&text) {
                                        if msg.r#type == "browser_media_update" {
                                            if let Some(payload) = msg.data {
                                                let is_playing = payload.playing.unwrap_or(false);
                                                let raw_title = payload.title.unwrap_or_default();
                                                let title = raw_title.trim();
                                                let title = if title.len() > 256 { title[..256].to_string() } else { title.to_string() };

                                                let raw_artist = payload.artist.unwrap_or_default();
                                                let artist = raw_artist.trim();
                                                let artist = if artist.len() > 256 { artist[..256].to_string() } else { artist.to_string() };

                                                let raw_album = payload.album.unwrap_or_default();
                                                let album = raw_album.trim();
                                                let album = if album.len() > 256 { album[..256].to_string() } else { album.to_string() };

                                                let artwork = payload.artwork.filter(|a| !a.trim().is_empty());
                                                let raw_pos = payload.current_time.unwrap_or(0);
                                                let raw_dur = payload.duration.unwrap_or(0);
                                                let duration_ms = raw_dur.saturating_mul(1000);
                                                let position_ms = raw_pos.saturating_mul(1000).min(if duration_ms > 0 { duration_ms } else { u64::MAX });

                                                let raw_source = payload.source.unwrap_or_else(|| "Browser".to_string());
                                                let source = raw_source.trim().to_string();

                                                let now_ms = SystemTime::now()
                                                    .duration_since(UNIX_EPOCH)
                                                    .unwrap_or_default()
                                                    .as_millis() as u64;

                                                let media_state = MediaState {
                                                    title,
                                                    artist,
                                                    album,
                                                    artwork,
                                                    status: if is_playing { PlaybackStatus::Playing } else { PlaybackStatus::Paused },
                                                    position_ms,
                                                    duration_ms,
                                                    can_play: true,
                                                    can_pause: true,
                                                    can_skip_next: true,
                                                    can_skip_prev: true,
                                                    can_seek: duration_ms > 0,
                                                    source_id: format!("browser:{}", source),
                                                    source_name: source,
                                                    is_browser_source: true,
                                                    updated_at_ms: now_ms,
                                                };

                                                *state_ref.write().await = Some(media_state);
                                            }
                                        }
                                    }
                                }
                                Ok(Message::Close(_)) | Err(_) => {
                                    break;
                                }
                                _ => {}
                            }
                        }
                        Ok(cmd) = command_rx.recv() => {
                            if let Ok(json) = serde_json::to_string(&cmd) {
                                if ws_sender.send(Message::Text(json.into())).await.is_err() {
                                    break;
                                }
                            }
                        }
                    }
                }

                connected_ref.store(false, Ordering::Relaxed);
                // Clear state on disconnect so phantom/ghost tracks do not linger
                *state_ref.write().await = None;
                log::info!("Browser Companion Extension disconnected. Cleared media state.");
            }
        });
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_browser_message_deserialization() {
        let json = r#"{
            "type": "browser_media_update",
            "data": {
                "title": "Starboy",
                "artist": "The Weeknd",
                "album": "Starboy",
                "artwork": "https://example.com/art.jpg",
                "playing": true,
                "currentTime": 45,
                "duration": 230,
                "source": "youtube.com"
            }
        }"#;

        let msg: Result<BrowserMessage, _> = serde_json::from_str(json);
        assert!(msg.is_ok());
        let msg = msg.unwrap();
        assert_eq!(msg.r#type, "browser_media_update");
        assert!(msg.data.is_some());
        let data = msg.data.unwrap();
        assert_eq!(data.title.as_deref(), Some("Starboy"));
        assert_eq!(data.current_time, Some(45));
        assert_eq!(data.playing, Some(true));
    }
}
