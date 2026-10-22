pub mod cleaner;
pub mod models;
pub mod processes;
pub mod services;
pub mod startup_apps;
pub mod system_info;

use cleaner::SystemCleaner;
use models::{CleanCategoryScan, CleanResult, ProcessItem, ServiceItem, StartupAppItem, SystemMetrics};
use processes::ProcessManager;
use services::ServiceManager;
use startup_apps::StartupAppManager;
use system_info::{SystemState, SystemTracker};
use std::sync::Mutex;

#[tauri::command]
fn get_system_metrics(state: tauri::State<SystemState>) -> Result<SystemMetrics, String> {
    let mut tracker = state.lock().map_err(|e| e.to_string())?;
    Ok(tracker.collect_metrics())
}

#[tauri::command]
fn scan_cleaner() -> Result<Vec<CleanCategoryScan>, String> {
    Ok(SystemCleaner::scan_categories())
}

#[tauri::command]
fn clean_selected(paths: Vec<String>, category_ids: Vec<String>) -> Result<Vec<CleanResult>, String> {
    Ok(SystemCleaner::clean_items(paths, category_ids))
}

#[tauri::command]
fn get_processes() -> Result<Vec<ProcessItem>, String> {
    Ok(ProcessManager::list_processes())
}

#[tauri::command]
fn kill_process(pid: u32, force: bool) -> Result<(), String> {
    ProcessManager::terminate_process(pid, force)
}

#[tauri::command]
fn get_services() -> Result<Vec<ServiceItem>, String> {
    Ok(ServiceManager::list_services())
}

#[tauri::command]
fn toggle_service(unit: String, action: String) -> Result<String, String> {
    ServiceManager::toggle_service(&unit, &action)
}

#[tauri::command]
fn get_startup_apps() -> Result<Vec<StartupAppItem>, String> {
    Ok(StartupAppManager::list_apps())
}

#[tauri::command]
fn toggle_startup_app(file_path: String, enable: bool) -> Result<(), String> {
    StartupAppManager::toggle_app(&file_path, enable)
}

#[tauri::command]
fn add_startup_app(name: String, exec: String, comment: String) -> Result<(), String> {
    StartupAppManager::add_app(&name, &exec, &comment)
}

#[tauri::command]
fn delete_startup_app(file_path: String) -> Result<(), String> {
    StartupAppManager::delete_app(&file_path)
}

#[tauri::command]
fn clean_ram() -> Result<String, String> {
    system_info::clean_ram_caches()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let system_tracker = SystemTracker::new();
    let state: SystemState = Mutex::new(system_tracker);

    tauri::Builder::default()
        .manage(state)
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_system_metrics,
            clean_ram,
            scan_cleaner,
            clean_selected,
            get_processes,
            kill_process,
            get_services,
            toggle_service,
            get_startup_apps,
            toggle_startup_app,
            add_startup_app,
            delete_startup_app,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
