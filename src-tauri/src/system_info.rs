use crate::models::{CpuCoreInfo, DiskInfo, NetworkStats, SystemMetrics};
use std::sync::Mutex;
use std::time::Instant;
use sysinfo::{Disks, Networks, System};

pub struct SystemTracker {
    pub sys: System,
    pub disks: Disks,
    pub networks: Networks,
    pub last_rx_total: u64,
    pub last_tx_total: u64,
    pub last_net_time: Instant,
}

impl SystemTracker {
    pub fn new() -> Self {
        let mut sys = System::new_all();
        sys.refresh_all();
        let disks = Disks::new_with_refreshed_list();
        let networks = Networks::new_with_refreshed_list();

        let mut total_rx = 0;
        let mut total_tx = 0;
        for (_, net) in networks.iter() {
            total_rx += net.total_received();
            total_tx += net.total_transmitted();
        }

        Self {
            sys,
            disks,
            networks,
            last_rx_total: total_rx,
            last_tx_total: total_tx,
            last_net_time: Instant::now(),
        }
    }

    pub fn collect_metrics(&mut self) -> SystemMetrics {
        self.sys.refresh_cpu_usage();
        self.sys.refresh_memory();
        self.disks.refresh(true);
        self.networks.refresh(true);

        let os_name = System::name().unwrap_or_else(|| "Linux".to_string());
        let kernel_version = System::kernel_version().unwrap_or_else(|| "Unknown".to_string());
        let os_version = System::os_version().unwrap_or_else(|| "".to_string());
        let hostname = System::host_name().unwrap_or_else(|| "localhost".to_string());
        let uptime_secs = System::uptime();

        let cpus = self.sys.cpus();
        let cpu_overall_usage = self.sys.global_cpu_usage();
        let cpu_threads = cpus.len();
        let cpu_physical_cores = self.sys.physical_core_count().unwrap_or(cpu_threads);

        let cpu_model = if let Some(cpu) = cpus.first() {
            cpu.brand().to_string()
        } else {
            "Unknown CPU".to_string()
        };

        let cpu_cores: Vec<CpuCoreInfo> = cpus
            .iter()
            .enumerate()
            .map(|(i, cpu)| CpuCoreInfo {
                name: format!("Core {}", i),
                usage: cpu.cpu_usage(),
                frequency: cpu.frequency(),
            })
            .collect();

        let total_memory = self.sys.total_memory();
        let used_memory = self.sys.used_memory();
        let free_memory = self.sys.free_memory();

        let total_swap = self.sys.total_swap();
        let used_swap = self.sys.used_swap();
        let free_swap = self.sys.free_swap();

        let disks: Vec<DiskInfo> = self
            .disks
            .iter()
            .map(|disk| DiskInfo {
                name: disk.name().to_string_lossy().to_string(),
                mount_point: disk.mount_point().to_string_lossy().to_string(),
                total_space: disk.total_space(),
                available_space: disk.available_space(),
                file_system: disk.file_system().to_string_lossy().to_string(),
                is_removable: disk.is_removable(),
            })
            .collect();

        let now = Instant::now();
        let elapsed_secs = now.duration_since(self.last_net_time).as_secs_f64();

        let mut total_rx = 0;
        let mut total_tx = 0;
        let networks: Vec<NetworkStats> = self
            .networks
            .iter()
            .map(|(name, net)| {
                total_rx += net.total_received();
                total_tx += net.total_transmitted();
                NetworkStats {
                    interface_name: name.clone(),
                    rx_bytes: net.received(),
                    tx_bytes: net.transmitted(),
                    rx_packets: net.packets_received(),
                    tx_packets: net.packets_transmitted(),
                }
            })
            .collect();

        let download_speed = if self.last_rx_total > 0 && elapsed_secs > 0.05 {
            ((total_rx.saturating_sub(self.last_rx_total)) as f64 / elapsed_secs) as u64
        } else {
            0
        };

        let upload_speed = if self.last_tx_total > 0 && elapsed_secs > 0.05 {
            ((total_tx.saturating_sub(self.last_tx_total)) as f64 / elapsed_secs) as u64
        } else {
            0
        };

        self.last_rx_total = total_rx;
        self.last_tx_total = total_tx;
        self.last_net_time = now;

        SystemMetrics {
            os_name,
            kernel_version,
            os_version,
            hostname,
            uptime_secs,
            cpu_model: cpu_model.clone(),
            cpu_brand: cpu_model,
            cpu_count: cpu_threads,
            cpu_physical_cores,
            cpu_threads,
            cpu_overall_usage,
            cpu_cores,
            total_memory,
            used_memory,
            free_memory,
            total_swap,
            used_swap,
            free_swap,
            current_download_speed: download_speed,
            current_upload_speed: upload_speed,
            total_received_bytes: total_rx,
            total_transmitted_bytes: total_tx,
            disks,
            networks,
        }
    }
}

pub type SystemState = Mutex<SystemTracker>;

fn get_available_memory_bytes() -> u64 {
    if let Ok(content) = std::fs::read_to_string("/proc/meminfo") {
        for line in content.lines() {
            if line.starts_with("MemAvailable:") {
                let parts: Vec<&str> = line.split_whitespace().collect();
                if parts.len() >= 2 {
                    if let Ok(kb) = parts[1].parse::<u64>() {
                        return kb * 1024;
                    }
                }
            }
        }
    }
    0
}

fn format_bytes(bytes: u64) -> String {
    if bytes >= 1024 * 1024 * 1024 {
        format!("{:.2} GiB", bytes as f64 / (1024.0 * 1024.0 * 1024.0))
    } else if bytes >= 1024 * 1024 {
        format!("{:.1} MiB", bytes as f64 / (1024.0 * 1024.0))
    } else if bytes >= 1024 {
        format!("{:.1} KiB", bytes as f64 / 1024.0)
    } else {
        format!("{} B", bytes)
    }
}

pub fn clean_ram_caches() -> Result<String, String> {
    let avail_before = get_available_memory_bytes();
    let mut executed = false;

    // 1. Try directly if process or user has write access to /proc/sys/vm/drop_caches
    if let Ok(mut file) = std::fs::OpenOptions::new().write(true).open("/proc/sys/vm/drop_caches") {
        use std::io::Write;
        let _ = std::process::Command::new("sync").output();
        if file.write_all(b"3\n").is_ok() {
            executed = true;
        }
    }

    // 2. Try running dedicated helper directly (SUID binary: fast & passwordless)
    let helper_path = "/usr/bin/stacer-plus-clean-ram";
    if !executed && std::path::Path::new(helper_path).exists() {
        if let Ok(status) = std::process::Command::new(helper_path).status() {
            if status.success() {
                executed = true;
            }
        }
    }

    // 3. Try pkexec with helper (authorized passwordless by polkit rule)
    if !executed && std::path::Path::new(helper_path).exists() {
        if let Ok(status) = std::process::Command::new("pkexec")
            .arg(helper_path)
            .status()
        {
            if status.success() {
                executed = true;
            }
        }
    }

    // 4. Try sudo -n non-interactive
    if !executed && std::path::Path::new(helper_path).exists() {
        if let Ok(status) = std::process::Command::new("sudo")
            .args(["-n", helper_path])
            .status()
        {
            if status.success() {
                executed = true;
            }
        }
    }

    // 5. Fallback: pkexec if helper is not yet installed or lacks permissions
    if !executed {
        let output = std::process::Command::new("pkexec")
            .args(["sh", "-c", "sync && echo 3 > /proc/sys/vm/drop_caches"])
            .output();

        match output {
            Ok(out) if out.status.success() => {
                executed = true;
            }
            Ok(out) => {
                let err = String::from_utf8_lossy(&out.stderr);
                return Err(if err.trim().is_empty() {
                    "RAM clean was cancelled or permission denied".to_string()
                } else {
                    err.trim().to_string()
                });
            }
            Err(e) => return Err(format!("Failed to execute drop_caches: {}", e)),
        }
    }

    let _ = executed;
    std::thread::sleep(std::time::Duration::from_millis(150));
    let avail_after = get_available_memory_bytes();
    let freed = avail_after.saturating_sub(avail_before);

    if freed > 1024 * 1024 {
        Ok(format!("Successfully freed {} of RAM cache!", format_bytes(freed)))
    } else {
        Ok("RAM cache cleared! (System cache was already clean)".to_string())
    }
}
