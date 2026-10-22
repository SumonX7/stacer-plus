import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ProcessItem } from "../types";
import { formatBytes } from "../utils";
import { Search } from "lucide-react";

export const Processes: React.FC = () => {
  const [processes, setProcesses] = useState<ProcessItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAll, setShowAll] = useState(true);
  const [selectedPid, setSelectedPid] = useState<number | null>(null);
  const [refreshInterval, setRefreshInterval] = useState(2);

  const fetchProcesses = async () => {
    try {
      const list = await invoke<ProcessItem[]>("get_processes");
      setProcesses(list);
    } catch (err) {
      console.error("Failed to load processes:", err);
    }
  };

  useEffect(() => {
    fetchProcesses();
    const timer = setInterval(fetchProcesses, refreshInterval * 1000);
    return () => clearInterval(timer);
  }, [refreshInterval]);

  const handleEndProcess = async () => {
    if (!selectedPid) return;
    try {
      await invoke("kill_process", { pid: selectedPid, force: false });
      await fetchProcesses();
      setSelectedPid(null);
    } catch (err) {
      alert(`Could not end process: ${err}`);
    }
  };

  const filtered = processes.filter((p) => {
    const q = searchTerm.toLowerCase();
    const match =
      p.name.toLowerCase().includes(q) ||
      p.pid.toString().includes(q) ||
      p.user.toLowerCase().includes(q);

    if (!match) return false;
    if (!showAll && p.user !== "spark") return false;
    return true;
  });

  return (
    <div className="space-y-4 px-3 flex flex-col h-[calc(100vh-80px)]">
      {/* Title with Divider */}
      <div className="relative text-center my-1">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#263848]" />
        </div>
        <div className="relative inline-block bg-[#1b252f] px-6 text-sm font-semibold text-[#dddddd] tracking-wider uppercase">
          Processes
        </div>
      </div>

      {/* Subheader & Search */}
      <div className="flex justify-between items-center text-xs">
        <div className="flex items-center gap-4 text-white font-medium">
          <span>Processes ({filtered.length})</span>
          <label className="flex items-center gap-1.5 cursor-pointer text-[#aeb5bf]">
            <input
              type="checkbox"
              checked={showAll}
              onChange={(e) => setShowAll(e.target.checked)}
              className="rounded border-[#263848] bg-[#212f3c] text-blue-600"
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
            className="w-56 rounded border border-[#283846] bg-[#212f3c] px-3 py-1.5 pr-8 text-xs text-white placeholder-[#7d8ea0] focus:border-blue-500 focus:outline-none"
          />
          <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#7d8ea0]" />
        </div>
      </div>

      {/* Stacer Processes Table */}
      <div className="flex-1 rounded-md border border-[#283846] bg-[#212f3c] overflow-hidden flex flex-col">
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-[#212f3c] border-b border-[#283846] text-[#00d4ff] font-semibold">
              <tr>
                <th className="py-2.5 px-4">PID</th>
                <th className="py-2.5 px-4">Resident Memory</th>
                <th className="py-2.5 px-4">%Memory</th>
                <th className="py-2.5 px-4">User</th>
                <th className="py-2.5 px-4">%CPU</th>
                <th className="py-2.5 px-4">Process</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#283846]/60 text-[#dddddd] font-sans">
              {filtered.map((p) => {
                const isSelected = selectedPid === p.pid;
                return (
                  <tr
                    key={p.pid}
                    onClick={() => setSelectedPid(isSelected ? null : p.pid)}
                    className={`cursor-pointer transition ${
                      isSelected
                        ? "bg-[#075ffe] text-white"
                        : "hover:bg-[#283846]/50"
                    }`}
                  >
                    <td className="py-2 px-4 font-mono font-medium">{p.pid}</td>
                    <td className="py-2 px-4">{formatBytes(p.memory_bytes)}</td>
                    <td className="py-2 px-4">
                      {((p.memory_bytes / (16 * 1024 * 1024 * 1024)) * 100).toFixed(1)}
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
        <div className="bg-[#1b252f] border-t border-[#283846] px-4 py-2 flex justify-between items-center">
          <div className="flex items-center gap-3 text-xs text-[#aeb5bf]">
            <span>Refresh ({refreshInterval})</span>
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
            className="px-6 py-2 bg-[#075ffe] hover:bg-[#0066ff] active:bg-[#004ecc] text-white font-semibold text-xs rounded transition shadow disabled:opacity-40"
          >
            End Process
          </button>
        </div>
      </div>
    </div>
  );
};
