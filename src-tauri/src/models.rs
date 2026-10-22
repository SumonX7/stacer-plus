use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CpuCoreInfo {
    pub name: String,
    pub usage: f32,
    pub frequency: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiskInfo {
    pub name: String,
    pub mount_point: String,
    pub total_space: u64,
    pub available_space: u64,
    pub file_system: String,
    pub is_removable: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkStats {
    pub interface_name: String,
    pub rx_bytes: u64,
    pub tx_bytes: u64,
    pub rx_packets: u64,
    pub tx_packets: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemMetrics {
    pub os_name: String,
    pub kernel_version: String,
    pub os_version: String,
    pub hostname: String,
    pub uptime_secs: u64,
    pub cpu_model: String,
    pub cpu_brand: String,
    pub cpu_count: usize,
    pub cpu_physical_cores: usize,
    pub cpu_threads: usize,
    pub cpu_overall_usage: f32,
    pub cpu_cores: Vec<CpuCoreInfo>,
    pub total_memory: u64,
    pub used_memory: u64,
    pub free_memory: u64,
    pub total_swap: u64,
    pub used_swap: u64,
    pub free_swap: u64,
    pub current_download_speed: u64,
    pub current_upload_speed: u64,
    pub total_received_bytes: u64,
    pub total_transmitted_bytes: u64,
    pub disks: Vec<DiskInfo>,
    pub networks: Vec<NetworkStats>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessItem {
    pub pid: u32,
    pub name: String,
    pub cpu_usage: f32,
    pub memory_bytes: u64,
    pub virtual_memory_bytes: u64,
    pub user: String,
    pub status: String,
    pub run_time_secs: u64,
    pub cmd: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CleanCategoryScan {
    pub id: String,
    pub name: String,
    pub description: String,
    pub file_count: usize,
    pub total_bytes: u64,
    pub items: Vec<CleanFileItem>,
    pub is_dangerous: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CleanFileItem {
    pub path: String,
    pub name: String,
    pub size_bytes: u64,
    pub is_directory: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CleanResult {
    pub category_id: String,
    pub success_count: usize,
    pub failed_count: usize,
    pub freed_bytes: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServiceItem {
    pub unit: String,
    pub load: String,
    pub active: String,
    pub sub: String,
    pub description: String,
    pub is_enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StartupAppItem {
    pub file_path: String,
    pub name: String,
    pub comment: String,
    pub exec: String,
    pub enabled: bool,
    pub is_system_wide: bool,
}
