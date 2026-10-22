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
    <div className="flex h-screen w-screen bg-[#1b252f] text-[#dddddd] font-sans overflow-hidden select-none">
      {/* Stacer Signature Left Sidebar */}
      <aside className="w-[58px] flex-shrink-0 bg-[#15191c] border-r border-[#1e252d] flex flex-col justify-between py-2 z-20">
        <div className="flex flex-col items-center space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-[48px] h-[48px] flex items-center justify-center rounded transition relative group ${
                  isActive
                    ? "bg-[#075ffe]"
                    : "hover:bg-[#202731] active:bg-[#25303e]"
                }`}
                title={item.label}
              >
                <img
                  src={item.icon}
                  alt={item.label}
                  className="w-5 h-5 object-contain filter brightness-110"
                />

                {/* Tooltip on hover */}
                <div className="absolute left-[62px] bg-[#212f3c] text-white text-[11px] font-medium px-2.5 py-1 rounded shadow-lg border border-[#283846] opacity-0 pointer-events-none group-hover:opacity-100 transition whitespace-nowrap z-50">
                  {item.label}
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom Logo / Version */}
        <div className="flex flex-col items-center py-2 text-[9px] text-[#7d8ea0] font-mono tracking-tighter">
          <span>PLUS</span>
          <span>v1.2</span>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#1b252f] p-4">
        <div className="flex-1 overflow-y-auto pr-1">
          {activeTab === "dashboard" && <Dashboard metrics={metrics} onRefresh={fetchMetrics} />}
          {activeTab === "startup" && <StartupApps />}
          {activeTab === "cleaner" && <Cleaner />}
          {activeTab === "services" && <Services />}
          {activeTab === "processes" && <Processes />}
          {activeTab === "resources" && <Resources metrics={metrics} />}
        </div>

        {/* Bottom Status Bar (Stacer Style) */}
        <footer className="h-6 border-t border-[#263848] bg-[#15191c] -mx-4 -mb-4 px-4 flex items-center justify-between text-[11px] text-[#7d8ea0]">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-300">Stacer Plus</span>
            <span>•</span>
            <span>Kernel: {metrics ? metrics.kernel_version : "Linux"}</span>
          </div>
          <div className="flex items-center gap-4">
            <span>CPU: <strong className="text-white font-mono">{metrics ? `${Math.round(metrics.cpu_overall_usage)}%` : "0%"}</strong></span>
            <span>RAM: <strong className="text-white font-mono">{metrics && metrics.total_memory > 0 ? `${Math.round((metrics.used_memory / metrics.total_memory) * 100)}%` : "0%"}</strong></span>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default App;
