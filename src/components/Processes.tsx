import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ProcessItem } from "../types";
import { formatBytes } from "../utils";
import { Search } from "lucide-react";

export const Processes: React.FC = () => {
  const [processes, setProcesses] = useState<ProcessItem[]>([]);
  const [selectedPid, setSelectedPid] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(2); // Seconds

  const fetchProcesses = async () => {
    try {
      const data = await invoke<ProcessItem[]>("get_processes");
      setProcesses(data);
    } catch (err) {
      console.error("Failed to fetch processes:", err);
    }
  };

  useEffect(() => {
    fetchProcesses();
    const interval = setInterval(fetchProcesses, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const handleEndProcess = async () => {
    if (!selectedPid) return;
    try {
      await invoke("terminate_process", { pid: selectedPid });
      setSelectedPid(null);
      fetchProcesses();
    } catch (err) {
      console.error("Failed to terminate process:", err);
    }
  };

  const filtered = processes.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.cmd.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.user.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-4 px-3 flex flex-col h-[calc(100vh-80px)] transition-colors duration-200">
      {/* Title with Divider */}
      <div className="relative text-center my-1">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-theme-subtle" />
        </div>
        <div className="relative inline-block bg-theme-app px-6 text-sm font-semibold text-theme-title tracking-wider uppercase">
          Processes
        </div>
      </div>

      {/* Subheader & Search */}
      <div className="flex justify-between items-center text-xs">
        <div className="flex items-center gap-4 text-theme-title font-medium">
          <span>Processes ({filtered.length})</span>
          <label className="flex items-center gap-1.5 cursor-pointer text-theme-muted">
            <input
              type="checkbox"
              checked={showAll}
              onChange={(e) => setShowAll(e.target.checked)}
              className="rounded border-theme bg-theme-card text-blue-600"
            />
            <span>All Processes</span>
          </label>
        </div>

        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search..."
            className="w-56 rounded border border-theme bg-theme-card px-3 py-1.5 pr-8 text-xs text-theme-title placeholder-theme-dim focus:border-blue-500 focus:outline-none shadow-sm"
          />
          <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-theme-dim" />
        </div>
      </div>

      {/* Stacer Processes Table */}
      <div className="flex-1 rounded-md border border-theme bg-theme-card overflow-hidden flex flex-col shadow-sm">
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-theme-header border-b border-theme text-theme-accent font-semibold z-10">
              <tr>
                <th className="py-2.5 px-4">PID</th>
                <th className="py-2.5 px-4">Resident Memory</th>
                <th className="py-2.5 px-4">%Memory</th>
                <th className="py-2.5 px-4">User</th>
                <th className="py-2.5 px-4">%CPU</th>
                <th className="py-2.5 px-4">Process</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme text-theme-main font-sans">
              {filtered.map((p) => {
                const isSelected = selectedPid === p.pid;
                return (
                  <tr
                    key={p.pid}
                    onClick={() => setSelectedPid(isSelected ? null : p.pid)}
                    className={`cursor-pointer transition ${
                      isSelected
                        ? "bg-[#075ffe] text-white"
                        : "hover:bg-theme-card-hover"
                    }`}
                  >
                    <td className="py-2 px-4 font-mono font-medium">{p.pid}</td>
                    <td className="py-2 px-4">{formatBytes(p.memory_bytes)}</td>
                    <td className="py-2 px-4">
                      {((p.memory_bytes / (16 * 1024 * 1024 * 1024)) * 100).toFixed(1)}%
                    </td>
                    <td className="py-2 px-4">{p.user}</td>
                    <td className="py-2 px-4">{p.cpu_usage.toFixed(1)}</td>
                    <td className="py-2 px-4 font-mono text-[11px] truncate max-w-md" title={p.cmd}>
                      {p.cmd}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Bottom Bar: Slider on left, End Process button on right */}
        <div className="bg-theme-inner border-t border-theme px-4 py-2 flex justify-between items-center">
          <div className="flex items-center gap-3 text-xs text-theme-muted">
            <span>Refresh ({refreshInterval}s)</span>
            <input
              type="range"
              min="1"
              max="10"
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="w-28 accent-[#075ffe] cursor-pointer"
            />
          </div>

          <button
            onClick={handleEndProcess}
            disabled={!selectedPid}
            className="px-6 py-1.5 bg-[#075ffe] hover:bg-[#0066ff] active:bg-[#004ecc] text-white font-semibold text-xs rounded transition shadow disabled:opacity-40 cursor-pointer"
          >
            End Process
          </button>
        </div>
      </div>
    </div>
  );
};
