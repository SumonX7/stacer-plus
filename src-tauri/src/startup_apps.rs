use crate::models::StartupAppItem;
use std::fs;
use std::path::{Path, PathBuf};

pub struct StartupAppManager;

impl StartupAppManager {
    fn parse_desktop_file(path: &Path, is_system_wide: bool) -> Option<StartupAppItem> {
        let content = fs::read_to_string(path).ok()?;
        let mut name = String::new();
        let mut comment = String::new();
        let mut exec = String::new();
        let mut hidden = false;
        let mut gnome_enabled = true;

        for line in content.lines() {
            let trimmed = line.trim();
            if trimmed.starts_with("Name=") && name.is_empty() {
                name = trimmed.trim_start_matches("Name=").to_string();
            } else if trimmed.starts_with("Comment=") && comment.is_empty() {
                comment = trimmed.trim_start_matches("Comment=").to_string();
            } else if trimmed.starts_with("Exec=") && exec.is_empty() {
                exec = trimmed.trim_start_matches("Exec=").to_string();
            } else if trimmed.starts_with("Hidden=") {
                hidden = trimmed.trim_start_matches("Hidden=").to_lowercase() == "true";
            } else if trimmed.starts_with("X-GNOME-Autostart-enabled=") {
                gnome_enabled = trimmed.trim_start_matches("X-GNOME-Autostart-enabled=").to_lowercase() != "false";
            }
        }

        if name.is_empty() {
            name = path
                .file_stem()
                .map(|s| s.to_string_lossy().to_string())
                .unwrap_or_else(|| "Unknown".to_string());
        }

        let enabled = !hidden && gnome_enabled;

        Some(StartupAppItem {
            file_path: path.to_string_lossy().to_string(),
            name,
            comment,
            exec,
            enabled,
            is_system_wide,
        })
    }

    pub fn list_apps() -> Vec<StartupAppItem> {
        let mut apps = Vec::new();

        // 1. User autostart (~/.config/autostart)
        if let Some(config_dir) = dirs::config_dir() {
            let user_autostart = config_dir.join("autostart");
            if user_autostart.exists() {
                if let Ok(entries) = fs::read_dir(&user_autostart) {
                    for entry in entries.filter_map(|e| e.ok()) {
                        let path = entry.path();
                        if path.extension().and_then(|ext| ext.to_str()) == Some("desktop") {
                            if let Some(item) = Self::parse_desktop_file(&path, false) {
                                apps.push(item);
                            }
                        }
                    }
                }
            }
        }

        // 2. System autostart (/etc/xdg/autostart)
        let system_autostart = PathBuf::from("/etc/xdg/autostart");
        if system_autostart.exists() {
            if let Ok(entries) = fs::read_dir(&system_autostart) {
                for entry in entries.filter_map(|e| e.ok()) {
                    let path = entry.path();
                    if path.extension().and_then(|ext| ext.to_str()) == Some("desktop") {
                        let file_name = entry.file_name();
                        // Only add if not overridden by user autostart
                        let user_override = dirs::config_dir()
                            .map(|d| d.join("autostart").join(&file_name))
                            .map(|p| p.exists())
                            .unwrap_or(false);

                        if !user_override {
                            if let Some(item) = Self::parse_desktop_file(&path, true) {
                                apps.push(item);
                            }
                        }
                    }
                }
            }
        }

        apps.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
        apps
    }

    pub fn toggle_app(file_path: &str, enable: bool) -> Result<(), String> {
        let path = Path::new(file_path);
        let user_autostart_dir = dirs::config_dir()
            .ok_or_else(|| "Could not determine config dir".to_string())?
            .join("autostart");

        if !user_autostart_dir.exists() {
            fs::create_dir_all(&user_autostart_dir).map_err(|e| e.to_string())?;
        }

        let target_file = if file_path.starts_with("/etc/xdg/autostart") {
            // Copy system desktop file to user autostart to override cleanly without root
            let file_name = path
                .file_name()
                .ok_or_else(|| "Invalid file path".to_string())?;
            user_autostart_dir.join(file_name)
        } else {
            path.to_path_buf()
        };

        let content = if target_file.exists() {
            fs::read_to_string(&target_file).map_err(|e| e.to_string())?
        } else {
            fs::read_to_string(path).map_err(|e| e.to_string())?
        };

        let mut new_lines = Vec::new();
        let mut found_hidden = false;
        let mut found_gnome = false;

        for line in content.lines() {
            if line.starts_with("Hidden=") {
                new_lines.push(format!("Hidden={}", if enable { "false" } else { "true" }));
                found_hidden = true;
            } else if line.starts_with("X-GNOME-Autostart-enabled=") {
                new_lines.push(format!("X-GNOME-Autostart-enabled={}", if enable { "true" } else { "false" }));
                found_gnome = true;
            } else {
                new_lines.push(line.to_string());
            }
        }

        if !found_hidden {
            new_lines.push(format!("Hidden={}", if enable { "false" } else { "true" }));
        }
        if !found_gnome {
            new_lines.push(format!("X-GNOME-Autostart-enabled={}", if enable { "true" } else { "false" }));
        }

        fs::write(&target_file, new_lines.join("\n") + "\n").map_err(|e| e.to_string())?;

        Ok(())
    }

    pub fn add_app(name: &str, exec: &str, comment: &str) -> Result<(), String> {
        let user_autostart_dir = dirs::config_dir()
            .ok_or_else(|| "Could not determine config dir".to_string())?
            .join("autostart");

        if !user_autostart_dir.exists() {
            fs::create_dir_all(&user_autostart_dir).map_err(|e| e.to_string())?;
        }

        let sanitized_name: String = name
            .chars()
            .filter(|c| c.is_alphanumeric() || *c == '-' || *c == '_')
            .collect();

        let filename = format!("{}.desktop", sanitized_name.to_lowercase());
        let target_path = user_autostart_dir.join(filename);

        let content = format!(
            "[Desktop Entry]\nType=Application\nName={}\nExec={}\nComment={}\nHidden=false\nX-GNOME-Autostart-enabled=true\n",
            name, exec, comment
        );

        fs::write(&target_path, content).map_err(|e| e.to_string())?;

        Ok(())
    }

    pub fn delete_app(file_path: &str) -> Result<(), String> {
        let path = Path::new(file_path);
        if path.exists() && !file_path.starts_with("/etc/") {
            fs::remove_file(path).map_err(|e| e.to_string())?;
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;

    #[test]
    fn test_parse_desktop_file() {
        let temp_dir = std::env::temp_dir();
        let test_file = temp_dir.join("puku_test_app.desktop");

        let mut file = fs::File::create(&test_file).expect("create test file");
        writeln!(file, "[Desktop Entry]").unwrap();
        writeln!(file, "Type=Application").unwrap();
        writeln!(file, "Name=Puku Test").unwrap();
        writeln!(file, "Exec=/usr/bin/puku-test --opt").unwrap();
        writeln!(file, "Comment=Unit test desktop file").unwrap();
        writeln!(file, "Hidden=false").unwrap();
        writeln!(file, "X-GNOME-Autostart-enabled=true").unwrap();

        let item = StartupAppManager::parse_desktop_file(&test_file, false).expect("parse failed");
        assert_eq!(item.name, "Puku Test");
        assert_eq!(item.exec, "/usr/bin/puku-test --opt");
        assert_eq!(item.comment, "Unit test desktop file");
        assert!(item.enabled);

        let _ = fs::remove_file(&test_file);
    }
}
