import React, { useState } from "react";
import { SystemMetrics } from "../types";
import { formatBytes, formatSpeed } from "../utils";
import { ArcGauge } from "./ArcGauge";
import { invoke } from "@tauri-apps/api/core";
import { Sparkles, Check, AlertCircle, Heart, ExternalLink, X } from "lucide-react";

interface Props {
  metrics: SystemMetrics | null;
  onRefresh?: () => void;
}

export const Dashboard: React.FC<Props> = ({ metrics, onRefresh }) => {
  const [cleaningRam, setCleaningRam] = useState(false);
  const [ramCleanMsg, setRamCleanMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleCleanRam = async () => {
    setCleaningRam(true);
    setRamCleanMsg(null);
    try {
      const res = await invoke<string>("clean_ram");
      setRamCleanMsg({ type: "success", text: res });
      if (onRefresh) onRefresh();
      setTimeout(() => setRamCleanMsg(null), 6000);
    } catch (err: any) {
      setRamCleanMsg({ type: "error", text: String(err) });
      setTimeout(() => setRamCleanMsg(null), 6000);
    } finally {
      setCleaningRam(false);
    }
  };

  if (!metrics) {
    return (
      <div className="flex h-full items-center justify-center text-slate-400">
        Loading system telemetry...
      </div>
    );
  }

  const memUsedPercent =
    metrics.total_memory > 0
      ? Math.round((metrics.used_memory / metrics.total_memory) * 100)
      : 0;

  const primaryDisk = metrics.disks.length > 0 ? metrics.disks[0] : null;
  const diskUsed = primaryDisk ? primaryDisk.total_space - primaryDisk.available_space : 0;
  const diskTotal = primaryDisk ? primaryDisk.total_space : 1;
  const diskPercent = diskTotal > 0 ? Math.round((diskUsed / diskTotal) * 100) : 0;

  // Aggregate network total fallback
  const totalRx = metrics.total_received_bytes > 0
    ? metrics.total_received_bytes
    : metrics.networks.reduce((acc, n) => acc + n.rx_bytes, 0);

  const totalTx = metrics.total_transmitted_bytes > 0
    ? metrics.total_transmitted_bytes
    : metrics.networks.reduce((acc, n) => acc + n.tx_bytes, 0);

  // Network speeds (bytes per second)
  const downloadSpeed = metrics.current_download_speed || 0;
  const uploadSpeed = metrics.current_upload_speed || 0;

  // Speed bar visual percentage (calibrated to 25 MB/s ceiling with log-style visual curve)
  const calcSpeedPercent = (speed: number) => {
    if (speed <= 0) return 0;
    // 0 to 10MB/s maps nicely from 5% to 100%
    const pct = Math.min(100, Math.max(5, (speed / (10 * 1024 * 1024)) * 100));
    return Math.round(pct);
  };

  const cpuCoresDisplay = metrics.cpu_physical_cores > 0
    ? `${metrics.cpu_physical_cores} Cores (${metrics.cpu_threads} Threads)`
    : `${metrics.cpu_count} Cores (${metrics.cpu_threads || metrics.cpu_count} Threads)`;

  return (
    <div className="space-y-5 px-3">
      {/* Page Title */}
      <div className="relative text-center my-1">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#263848]" />
        </div>
        <div className="relative inline-block bg-[#1b252f] px-6 text-sm font-semibold text-[#dddddd] tracking-wider uppercase">
          Dashboard
        </div>
      </div>

      {/* Top 3 Circle Bars (CPU, MEMORY, DISK) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <ArcGauge
          title="CPU"
          value={metrics.cpu_overall_usage}
          label={`${Math.round(metrics.cpu_overall_usage)}%`}
          startColor="#A8E063"
          endColor="#56AB2F"
        />

        <ArcGauge
          title="MEMORY"
          value={memUsedPercent}
          label={`${formatBytes(metrics.used_memory)} / ${formatBytes(metrics.total_memory)}`}
          startColor="#FFB75E"
          endColor="#ED8F03"
          actionButton={
            <button
              onClick={handleCleanRam}
              disabled={cleaningRam}
              className="flex items-center justify-center gap-1.5 px-3 py-1 bg-[#1a73e8] hover:bg-[#075ffe] active:bg-[#0052cc] text-white text-[11px] font-semibold rounded shadow transition disabled:opacity-50"
              title="Drop pagecache, dentries and inodes to free unused RAM"
            >
              <Sparkles className={`h-3 w-3 ${cleaningRam ? 'animate-spin' : ''}`} />
              <span>{cleaningRam ? "Cleaning RAM..." : "Clean RAM"}</span>
            </button>
          }
        />

        <ArcGauge
          title="DISK"
          value={diskPercent}
          label={`${formatBytes(diskUsed)} / ${formatBytes(diskTotal)}`}
          startColor="#DC2430"
          endColor="#7B4397"
        />
      </div>

      {/* RAM Clean notification banner */}
      {ramCleanMsg && (
        <div
          className={`px-4 py-3 rounded-md text-xs flex items-center justify-between border shadow-lg transition-all animate-fadeIn ${
            ramCleanMsg.type === "success"
              ? "bg-[#143224] text-emerald-200 border-emerald-600/60"
              : "bg-[#331c1c] text-red-200 border-red-600/60"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {ramCleanMsg.type === "success" ? (
              <span className="p-1 rounded bg-emerald-500/20 text-emerald-400">
                <Check className="h-4 w-4" />
              </span>
            ) : (
              <span className="p-1 rounded bg-red-500/20 text-red-400">
                <AlertCircle className="h-4 w-4" />
              </span>
            )}
            <span className="font-medium tracking-wide">{ramCleanMsg.text}</span>
          </div>
          <button
            onClick={() => setRamCleanMsg(null)}
            className="text-slate-400 hover:text-white transition p-1"
            title="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Bottom Section: System Info & Network Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* System Info Box */}
        <div className="bg-[#212f3c] border border-[#283846] rounded-md p-5 text-xs text-[#aeb5bf] flex flex-col justify-between shadow-sm min-h-[190px]">
          <h3 className="font-bold text-[#00d4ff] text-xs uppercase tracking-wider mb-3 flex items-center justify-between">
            <span>SYSTEM INFO</span>
            <span className="text-[10px] text-slate-400 font-mono font-normal">POSIX Telemetry</span>
          </h3>
          <div className="space-y-1.5 leading-relaxed font-sans">
            <div>
              <span className="text-white font-medium">Hostname:</span> {metrics.hostname}
            </div>
            <div>
              <span className="text-white font-medium">Platform:</span> linux x86_64
            </div>
            <div>
              <span className="text-white font-medium">Distribution:</span>{" "}
              {metrics.os_name} {metrics.os_version}
            </div>
            <div>
              <span className="text-white font-medium">Kernel Release:</span>{" "}
              {metrics.kernel_version}
            </div>
            <div>
              <span className="text-white font-medium">CPU Model:</span> {metrics.cpu_model}
            </div>
            <div>
              <span className="text-white font-medium">CPU Cores:</span>{" "}
              <span className="text-[#00eb55] font-semibold">{cpuCoresDisplay}</span>
            </div>
            <div>
              <span className="text-white font-medium">CPU Speed:</span>{" "}
              {metrics.cpu_cores.length > 0 ? `${(metrics.cpu_cores[0].frequency / 1000).toFixed(2)} GHz` : "N/A"}
            </div>
          </div>
        </div>

        {/* Network Download / Upload Box */}
        <div className="space-y-4">
          {/* Download Line Bar */}
          <div className="bg-[#212f3c] border border-[#283846] rounded-md p-4 shadow-sm">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                <span>DOWNLOAD</span>
                {downloadSpeed > 0 && (
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                )}
              </span>
              <span className="text-xs text-[#00d4ff] font-mono font-semibold">
                {formatSpeed(downloadSpeed)}
              </span>
            </div>
            {/* Progress line */}
            <div className="w-full bg-[#1b252f] rounded h-2 overflow-hidden mb-2 border border-[#1e2936]">
              <div
                className="bg-gradient-to-r from-[#075ffe] to-[#00d4ff] h-2 rounded transition-all duration-300"
                style={{ width: `${calcSpeedPercent(downloadSpeed)}%` }}
              />
            </div>
            <div className="text-[11px] text-[#7d8ea0] flex justify-between font-mono">
              <span>Total Received:</span>
              <span className="text-slate-300">{formatBytes(totalRx)}</span>
            </div>
          </div>

          {/* Upload Line Bar */}
          <div className="bg-[#212f3c] border border-[#283846] rounded-md p-4 shadow-sm">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                <span>UPLOAD</span>
                {uploadSpeed > 0 && (
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                )}
              </span>
              <span className="text-xs text-[#ffb75e] font-mono font-semibold">
                {formatSpeed(uploadSpeed)}
              </span>
            </div>
            {/* Progress line */}
            <div className="w-full bg-[#1b252f] rounded h-2 overflow-hidden mb-2 border border-[#1e2936]">
              <div
                className="bg-gradient-to-r from-[#ed8f03] to-[#ffb75e] h-2 rounded transition-all duration-300"
                style={{ width: `${calcSpeedPercent(uploadSpeed)}%` }}
              />
            </div>
            <div className="text-[11px] text-[#7d8ea0] flex justify-between font-mono">
              <span>Total Sent:</span>
              <span className="text-slate-300">{formatBytes(totalTx)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Original Stacer Credit & Attribution Footer */}
      <div className="bg-[#151c24] border border-[#212e3a] rounded-md p-3.5 flex flex-col sm:flex-row items-center justify-between text-xs text-[#8e9cae] gap-3">
        <div className="flex items-center gap-2">
          <Heart className="h-4 w-4 text-[#ff5252] fill-[#ff5252]/40 flex-shrink-0" />
          <span>
            Inspired by the classic open-source Linux optimizer{" "}
            <strong className="text-white font-semibold">Stacer</strong> created by{" "}
            <strong className="text-[#00d4ff]">Oğuzhan İnan</strong>. Re-engineered with modern{" "}
            <span className="text-emerald-400 font-medium">Rust + Tauri v2</span> for extreme performance & safety.
          </span>
        </div>
        <a
          href="https://github.com/oguzhaninan/Stacer"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 px-3 py-1 bg-[#212f3c] hover:bg-[#2c3e4e] text-slate-200 hover:text-white rounded border border-[#2e3f50] text-[11px] font-medium transition flex-shrink-0"
        >
          <span>Original Stacer</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
};
