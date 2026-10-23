use crate::types::AuraConfig;
use std::fs;
use std::path::PathBuf;

pub struct ConfigManager {
    file_path: PathBuf,
}

impl ConfigManager {
    pub fn new() -> Self {
        let app_dir = dirs_or_fallback();
        if !app_dir.exists() {
            let _ = fs::create_dir_all(&app_dir);
        }
        let file_path = app_dir.join("config.json");
        Self { file_path }
    }

    pub fn load(&self) -> AuraConfig {
        if self.file_path.exists() {
            if let Ok(data) = fs::read_to_string(&self.file_path) {
                if let Ok(config) = serde_json::from_str::<AuraConfig>(&data) {
                    return config;
                }
            }
        }
        let default_config = AuraConfig::default();
        let _ = self.save(&default_config);
        default_config
    }

    pub fn save(&self, config: &AuraConfig) -> Result<(), String> {
        let json = serde_json::to_string_pretty(config)
            .map_err(|e| format!("Failed to serialize config: {}", e))?;
        fs::write(&self.file_path, json)
            .map_err(|e| format!("Failed to write config file: {}", e))?;
        Ok(())
    }
}

fn dirs_or_fallback() -> PathBuf {
    if let Ok(app_data) = std::env::var("APPDATA") {
        PathBuf::from(app_data).join("AURA")
    } else {
        std::env::temp_dir().join("AURA")
    }
}
