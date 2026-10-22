use crate::models::ServiceItem;
use std::process::Command;

pub struct ServiceManager;

impl ServiceManager {
    pub fn list_services() -> Vec<ServiceItem> {
        let output = Command::new("systemctl")
            .args(["list-units", "--type=service", "--all", "--no-pager", "--no-legend"])
            .output();

        let mut services = Vec::new();

        if let Ok(out) = output {
            let text = String::from_utf8_lossy(&out.stdout);
            for line in text.lines() {
                let trimmed = line.trim();
                if trimmed.is_empty() {
                    continue;
                }

                // Strip leading status bullet (e.g., "● ")
                let clean_line = if trimmed.starts_with('●') {
                    trimmed.trim_start_matches('●').trim()
                } else {
                    trimmed
                };

                let parts: Vec<&str> = clean_line.split_whitespace().collect();
                if parts.len() >= 4 {
                    let unit = parts[0].to_string();
                    let load = parts[1].to_string();
                    let active = parts[2].to_string();
                    let sub = parts[3].to_string();
                    let description = if parts.len() > 4 {
                        parts[4..].join(" ")
                    } else {
                        "".to_string()
                    };

                    let is_active = active == "active";

                    services.push(ServiceItem {
                        unit,
                        load,
                        active,
                        sub,
                        description,
                        is_enabled: is_active,
                    });
                }
            }
        }

        services
    }

    pub fn toggle_service(unit_name: &str, action: &str) -> Result<String, String> {
        // Actions allowed: "start", "stop", "restart", "enable", "disable"
        let valid_actions = ["start", "stop", "restart", "enable", "disable"];
        if !valid_actions.contains(&action) {
            return Err("Invalid systemctl action".to_string());
        }

        let output = Command::new("systemctl")
            .args([action, unit_name])
            .output()
            .map_err(|e| e.to_string())?;

        if output.status.success() {
            Ok(format!("Successfully performed {} on {}", action, unit_name))
        } else {
            let stderr = String::from_utf8_lossy(&output.stderr);
            Err(if stderr.is_empty() {
                format!("Failed to {} {}", action, unit_name)
            } else {
                stderr.to_string()
            })
        }
    }
}
