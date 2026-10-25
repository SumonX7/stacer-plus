import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { SystemMetrics } from "./types";
import { Dashboard } from "./components/Dashboard";
import { Cleaner } from "./components/Cleaner";
import { Processes } from "./components/Processes";
import { Services } from "./components/Services";
import { StartupApps } from "./components/StartupApps";
import { Resources } from "./components/Resources";
import "./App.css";

type NavTab = "dashboard" | "startup" | "cleaner" | "services" | "processes" | "resources";

function App() {
  const [activeTab, setActiveTab] = useState<NavTab>("dashboard");
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);

  // Light / Dark Theme State with localStorage persistence
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const saved = localStorage.getItem("stacer_theme");
    return saved === "light" ? "light" : "dark";
  });

  const toggleTheme = (newTheme: "dark" | "light") => {
    setTheme(newTheme);
    localStorage.setItem("stacer_theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const fetchMetrics = async () => {
    try {
      const data = await invoke<SystemMetrics>("get_system_metrics");
      setMetrics(data);
    } catch (err) {
      console.error("Failed to fetch system metrics:", err);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 2000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "/stacer-assets/sidebar-icons/dash.png" },
    { id: "startup", label: "Startup Apps", icon: "/stacer-assets/sidebar-icons/startup-apps.png" },
    { id: "cleaner", label: "System Cleaner", icon: "/stacer-assets/sidebar-icons/cleaner.png" },
    { id: "services", label: "Services", icon: "/stacer-assets/sidebar-icons/services.png" },
    { id: "processes", label: "Processes", icon: "/stacer-assets/sidebar-icons/process.png" },
    { id: "resources", label: "Resources", icon: "/stacer-assets/sidebar-icons/resources.png" },
  ] as const;

  return (
    <div
      data-theme={theme}
      className="flex h-screen w-screen bg-theme-app text-theme-main font-sans overflow-hidden select-none transition-colors duration-200"
    >
      {/* Stacer Signature Left Sidebar */}
      <aside className="w-[58px] flex-shrink-0 bg-theme-sidebar border-r border-theme-sidebar flex flex-col justify-between py-2 z-20">
        <div className="flex flex-col items-center space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-[48px] h-[48px] flex items-center justify-center rounded transition relative group ${
                  isActive
                    ? "bg-[#075ffe] text-white shadow-md shadow-blue-500/20"
                    : "hover:bg-theme-sidebar-hover text-theme-muted"
                }`}
                title={item.label}
              >
                <img
                  src={item.icon}
                  alt={item.label}
                  className="w-5 h-5 object-contain filter brightness-110"
                />

                {/* Tooltip on hover */}
                <div className="absolute left-[62px] bg-theme-card text-theme-title text-[11px] font-medium px-2.5 py-1 rounded shadow-lg border border-theme opacity-0 pointer-events-none group-hover:opacity-100 transition whitespace-nowrap z-50">
                  {item.label}
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom Logo / Version - Enlarged & Crisp for GNOME 50 / WhiteSur */}
        <div className="flex flex-col items-center py-2 text-[9px] text-theme-dim font-mono tracking-tighter gap-1">
          <img
            src="/stacer-assets/logo.png"
            alt="Stacer Plus"
            className="w-9 h-9 object-contain rounded-lg drop-shadow transition-transform hover:scale-105"
          />
          <span className="font-semibold tracking-wider">v1.2.1</span>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-theme-app p-4">
        <div className="flex-1 overflow-y-auto pr-1">
          {activeTab === "dashboard" && (
            <Dashboard
              metrics={metrics}
              onRefresh={fetchMetrics}
              theme={theme}
              onToggleTheme={toggleTheme}
            />
          )}
          {activeTab === "startup" && <StartupApps />}
          {activeTab === "cleaner" && <Cleaner />}
          {activeTab === "services" && <Services />}
          {activeTab === "processes" && <Processes />}
          {activeTab === "resources" && <Resources metrics={metrics} />}
        </div>

        {/* Bottom Status Bar (Stacer Style) */}
        <footer className="h-6 border-t border-theme-subtle bg-theme-footer -mx-4 -mb-4 px-4 flex items-center justify-between text-[11px] text-theme-dim">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-theme-title">Stacer Plus</span>
            <span>•</span>
            <span>Kernel: {metrics ? metrics.kernel_version : "Linux"}</span>
          </div>
          <div className="flex items-center gap-4">
            <span>
              CPU:{" "}
              <strong className="text-theme-title font-mono">
                {metrics ? `${Math.round(metrics.cpu_overall_usage)}%` : "0%"}
              </strong>
            </span>
            <span>
              RAM:{" "}
              <strong className="text-theme-title font-mono">
                {metrics && metrics.total_memory > 0
                  ? `${Math.round((metrics.used_memory / metrics.total_memory) * 100)}%`
                  : "0%"}
              </strong>
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default App;
