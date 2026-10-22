export interface CpuCoreInfo {
  name: String;
  usage: number;
  frequency: number;
}

export interface DiskInfo {
  name: string;
  mount_point: string;
  total_space: number;
  available_space: number;
  file_system: string;
  is_removable: boolean;
}

export interface NetworkStats {
  interface_name: string;
  rx_bytes: number;
  tx_bytes: number;
  rx_packets: number;
  tx_packets: number;
}

export interface SystemMetrics {
  os_name: string;
  kernel_version: string;
  os_version: string;
  hostname: string;
  uptime_secs: number;
  cpu_model: string;
  cpu_brand: string;
  cpu_count: number;
  cpu_physical_cores: number;
  cpu_threads: number;
  cpu_overall_usage: number;
  cpu_cores: CpuCoreInfo[];
  total_memory: number;
  used_memory: number;
  free_memory: number;
  total_swap: number;
  used_swap: number;
  free_swap: number;
  current_download_speed: number;
  current_upload_speed: number;
  total_received_bytes: number;
  total_transmitted_bytes: number;
  disks: DiskInfo[];
  networks: NetworkStats[];
}

export interface ProcessItem {
  pid: number;
  name: string;
  cpu_usage: number;
  memory_bytes: number;
  virtual_memory_bytes: number;
  user: string;
  status: string;
  run_time_secs: number;
  cmd: string;
}

export interface CleanFileItem {
  path: string;
  name: string;
  size_bytes: number;
  is_directory: boolean;
}

export interface CleanCategoryScan {
  id: string;
  name: string;
  description: string;
  file_count: number;
  total_bytes: number;
  items: CleanFileItem[];
  is_dangerous: boolean;
}

export interface CleanResult {
  category_id: string;
  success_count: number;
  failed_count: number;
  freed_bytes: number;
}

export interface ServiceItem {
  unit: string;
  load: string;
  active: string;
  sub: string;
  description: string;
  is_enabled: boolean;
}

export interface StartupAppItem {
  file_path: string;
  name: string;
  comment: string;
  exec: string;
  enabled: boolean;
  is_system_wide: boolean;
}
