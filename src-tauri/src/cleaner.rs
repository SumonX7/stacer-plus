use crate::models::{CleanCategoryScan, CleanFileItem, CleanResult};
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use walkdir::WalkDir;

pub struct SystemCleaner;

impl SystemCleaner {
    fn calculate_dir_size(path: &Path) -> (usize, u64) {
        if !path.exists() {
            return (0, 0);
        }

        let mut count = 0;
        let mut total_bytes = 0;

        for entry in WalkDir::new(path)
            .follow_links(false)
            .into_iter()
            .filter_map(|e| e.ok())
        {
            if let Ok(metadata) = entry.metadata() {
                if metadata.is_file() {
                    count += 1;
                    total_bytes += metadata.len();
                }
            }
        }

        (count, total_bytes)
    }

    pub fn scan_categories() -> Vec<CleanCategoryScan> {
        let mut categories = Vec::new();

        // 1. User Application Cache (~/.cache)
        if let Some(cache_dir) = dirs::cache_dir() {
            let mut items = Vec::new();
            let mut total_bytes = 0;
            let mut file_count = 0;

            if let Ok(entries) = fs::read_dir(&cache_dir) {
                for entry in entries.filter_map(|e| e.ok()) {
                    let path = entry.path();
                    let (count, bytes) = Self::calculate_dir_size(&path);
                    if bytes > 0 {
                        file_count += count;
                        total_bytes += bytes;
                        items.push(CleanFileItem {
                            path: path.to_string_lossy().to_string(),
                            name: entry.file_name().to_string_lossy().to_string(),
                            size_bytes: bytes,
                            is_directory: path.is_dir(),
                        });
                    }
                }
            }

            // sort descending by size
            items.sort_by(|a, b| b.size_bytes.cmp(&a.size_bytes));

            categories.push(CleanCategoryScan {
                id: "user_cache".to_string(),
                name: "Application Caches".to_string(),
                description: "Temporary data and cached assets from installed applications (~/.cache)".to_string(),
                file_count,
                total_bytes,
                items,
                is_dangerous: false,
            });
        }

        // 2. Trash Bin (~/.local/share/Trash)
        if let Some(home) = dirs::home_dir() {
            let trash_files = home.join(".local/share/Trash/files");
            let mut items = Vec::new();
            let mut total_bytes = 0;
            let mut file_count = 0;

            if trash_files.exists() {
                if let Ok(entries) = fs::read_dir(&trash_files) {
                    for entry in entries.filter_map(|e| e.ok()) {
                        let path = entry.path();
                        let (count, bytes) = if path.is_dir() {
                            Self::calculate_dir_size(&path)
                        } else {
                            (1, entry.metadata().map(|m| m.len()).unwrap_or(0))
                        };

                        file_count += count;
                        total_bytes += bytes;
                        items.push(CleanFileItem {
                            path: path.to_string_lossy().to_string(),
                            name: entry.file_name().to_string_lossy().to_string(),
                            size_bytes: bytes,
                            is_directory: path.is_dir(),
                        });
                    }
                }
            }

            items.sort_by(|a, b| b.size_bytes.cmp(&a.size_bytes));

            categories.push(CleanCategoryScan {
                id: "trash".to_string(),
                name: "Trash Bin".to_string(),
                description: "Files and folders moved to user trash".to_string(),
                file_count,
                total_bytes,
                items,
                is_dangerous: false,
            });
        }

        // 3. Developer Caches (Cargo, NPM, Pip)
        if let Some(home) = dirs::home_dir() {
            let dev_paths = vec![
                ("Cargo Cache", home.join(".cargo/registry/cache")),
                ("NPM Cache", home.join(".npm/_cacache")),
                ("Pip Cache", home.join(".cache/pip")),
            ];

            let mut items = Vec::new();
            let mut total_bytes = 0;
            let mut file_count = 0;

            for (name, path) in dev_paths {
                if path.exists() {
                    let (count, bytes) = Self::calculate_dir_size(&path);
                    if bytes > 0 {
                        file_count += count;
                        total_bytes += bytes;
                        items.push(CleanFileItem {
                            path: path.to_string_lossy().to_string(),
                            name: name.to_string(),
                            size_bytes: bytes,
                            is_directory: true,
                        });
                    }
                }
            }

            categories.push(CleanCategoryScan {
                id: "dev_cache".to_string(),
                name: "Developer Build Caches".to_string(),
                description: "Cargo, npm, and pip package download and compile caches".to_string(),
                file_count,
                total_bytes,
                items,
                is_dangerous: false,
            });
        }

        // 4. System Crash Reports (/var/crash)
        let crash_dir = PathBuf::from("/var/crash");
        if crash_dir.exists() {
            let (count, bytes) = Self::calculate_dir_size(&crash_dir);
            let mut items = Vec::new();
            if let Ok(entries) = fs::read_dir(&crash_dir) {
                for entry in entries.filter_map(|e| e.ok()) {
                    let path = entry.path();
                    let size = entry.metadata().map(|m| m.len()).unwrap_or(0);
                    items.push(CleanFileItem {
                        path: path.to_string_lossy().to_string(),
                        name: entry.file_name().to_string_lossy().to_string(),
                        size_bytes: size,
                        is_directory: path.is_dir(),
                    });
                }
            }

            categories.push(CleanCategoryScan {
                id: "crash_reports".to_string(),
                name: "System Crash Dumps".to_string(),
                description: "Core crash logs and kernel error dumps (/var/crash)".to_string(),
                file_count: count,
                total_bytes: bytes,
                items,
                is_dangerous: false,
            });
        }

        // 5. Systemd Journal Logs
        let journal_output = Command::new("journalctl")
            .arg("--disk-usage")
            .output();

        let mut journal_bytes: u64 = 0;
        let mut journal_desc = "Systemd binary journal log archives".to_string();

        if let Ok(output) = journal_output {
            if output.status.success() {
                let stdout = String::from_utf8_lossy(&output.stdout);
                journal_desc = stdout.trim().to_string();
                // Estimate bytes from output like "Archived and active journals take up 120.0M in the file system."
                if let Some(pos) = stdout.find("take up ") {
                    let sub = &stdout[pos + 8..];
                    if let Some(end) = sub.find(' ') {
                        let size_str = &sub[..end];
                        if size_str.ends_with('M') || size_str.ends_with('m') {
                            if let Ok(num) = size_str[..size_str.len() - 1].parse::<f64>() {
                                journal_bytes = (num * 1024.0 * 1024.0) as u64;
                            }
                        } else if size_str.ends_with('G') || size_str.ends_with('g') {
                            if let Ok(num) = size_str[..size_str.len() - 1].parse::<f64>() {
                                journal_bytes = (num * 1024.0 * 1024.0 * 1024.0) as u64;
                            }
                        } else if size_str.ends_with('K') || size_str.ends_with('k') {
                            if let Ok(num) = size_str[..size_str.len() - 1].parse::<f64>() {
                                journal_bytes = (num * 1024.0) as u64;
                            }
                        }
                    }
                }
            }
        }

        if journal_bytes > 0 {
            categories.push(CleanCategoryScan {
                id: "journal_logs".to_string(),
                name: "Systemd Journal Logs".to_string(),
                description: journal_desc,
                file_count: 1,
                total_bytes: journal_bytes,
                items: vec![CleanFileItem {
                    path: "journalctl".to_string(),
                    name: "Archived Journal Logs (Vacuum to 50M)".to_string(),
                    size_bytes: journal_bytes.saturating_sub(50 * 1024 * 1024),
                    is_directory: false,
                }],
                is_dangerous: false,
            });
        }

        categories
    }

    pub fn clean_items(paths: Vec<String>, category_ids: Vec<String>) -> Vec<CleanResult> {
        let mut results = Vec::new();

        // Handle journal vacuum if requested
        if category_ids.contains(&"journal_logs".to_string()) {
            let output = Command::new("journalctl")
                .args(["--vacuum-size=50M"])
                .output();

            let success = output.map(|o| o.status.success()).unwrap_or(false);
            results.push(CleanResult {
                category_id: "journal_logs".to_string(),
                success_count: if success { 1 } else { 0 },
                failed_count: if success { 0 } else { 1 },
                freed_bytes: 0,
            });
        }

        // Clean user files/directories
        let mut freed_bytes: u64 = 0;
        let mut success_count = 0;
        let mut failed_count = 0;

        for path_str in paths {
            let p = Path::new(&path_str);
            if !p.exists() {
                continue;
            }

            // Safety guard: NEVER allow deletion of root, home itself, or critical system paths
            if path_str == "/"
                || path_str == "/etc"
                || path_str == "/usr"
                || path_str == "/bin"
                || path_str == "/sbin"
                || path_str == "/home"
                || dirs::home_dir().map(|h| h == p).unwrap_or(false)
            {
                failed_count += 1;
                continue;
            }

            let (_, size) = if p.is_dir() {
                Self::calculate_dir_size(p)
            } else {
                (1, p.metadata().map(|m| m.len()).unwrap_or(0))
            };

            let res = if p.is_dir() {
                fs::remove_dir_all(p)
            } else {
                fs::remove_file(p)
            };

            match res {
                Ok(_) => {
                    success_count += 1;
                    freed_bytes += size;
                }
                Err(_) => {
                    failed_count += 1;
                }
            }
        }

        results.push(CleanResult {
            category_id: "files".to_string(),
            success_count,
            failed_count,
            freed_bytes,
        });

        results
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;

    #[test]
    fn test_calculate_dir_size() {
        let temp_dir = std::env::temp_dir().join("puku_clean_test");
        let _ = fs::create_dir_all(&temp_dir);

        let test_file = temp_dir.join("test.txt");
        let mut f = fs::File::create(&test_file).unwrap();
        f.write_all(b"1234567890").unwrap();

        let (count, bytes) = SystemCleaner::calculate_dir_size(&temp_dir);
        assert_eq!(count, 1);
        assert_eq!(bytes, 10);

        let _ = fs::remove_dir_all(&temp_dir);
    }

    #[test]
    fn test_safety_guard_blocks_root() {
        let res = SystemCleaner::clean_items(vec!["/".to_string(), "/etc".to_string()], vec![]);
        assert_eq!(res.len(), 1);
        assert_eq!(res[0].failed_count, 2);
        assert_eq!(res[0].success_count, 0);
    }
}
