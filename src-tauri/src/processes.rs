use crate::models::ProcessItem;
use nix::sys::signal::{self, Signal};
use nix::unistd::Pid;
use sysinfo::{ProcessRefreshKind, System, UpdateKind};

pub struct ProcessManager;

impl ProcessManager {
    pub fn list_processes() -> Vec<ProcessItem> {
        let mut sys = System::new();
        sys.refresh_processes_specifics(
            sysinfo::ProcessesToUpdate::All,
            true,
            ProcessRefreshKind::nothing()
                .with_cpu()
                .with_memory()
                .with_user(UpdateKind::Always),
        );

        let mut list: Vec<ProcessItem> = sys
            .processes()
            .iter()
            .map(|(pid, proc)| {
                let user_str = proc
                    .user_id()
                    .map(|u| u.to_string())
                    .unwrap_or_else(|| "unknown".to_string());

                let cmd_str = proc
                    .cmd()
                    .iter()
                    .map(|s| s.to_string_lossy().into_owned())
                    .collect::<Vec<_>>()
                    .join(" ");

                ProcessItem {
                    pid: pid.as_u32(),
                    name: proc.name().to_string_lossy().to_string(),
                    cpu_usage: proc.cpu_usage(),
                    memory_bytes: proc.memory(),
                    virtual_memory_bytes: proc.virtual_memory(),
                    user: user_str,
                    status: format!("{:?}", proc.status()),
                    run_time_secs: proc.run_time(),
                    cmd: if cmd_str.is_empty() {
                        proc.name().to_string_lossy().to_string()
                    } else {
                        cmd_str
                    },
                }
            })
            .collect();

        // Sort descending by CPU usage by default
        list.sort_by(|a, b| {
            b.cpu_usage
                .partial_cmp(&a.cpu_usage)
                .unwrap_or(std::cmp::Ordering::Equal)
        });

        list
    }

    pub fn terminate_process(pid: u32, force: bool) -> Result<(), String> {
        let sig = if force {
            Signal::SIGKILL
        } else {
            Signal::SIGTERM
        };

        signal::kill(Pid::from_raw(pid as i32), sig)
            .map_err(|e| format!("Failed to send signal to PID {}: {}", pid, e))
    }
}
