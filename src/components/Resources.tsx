import React, { useState, useEffect } from "react";
import { SystemMetrics } from "../types";
import { formatBytes, formatSpeed } from "../utils";

interface Props {
  metrics: SystemMetrics | null;
}

export const Resources: React.FC<Props> = ({ metrics }) => {
  const [cpuHistory, setCpuHistory] = useState<number[]>(new Array(30).fill(0));
  const [memHistory, setMemHistory] = useState<number[]>(new Array(30).fill(0));
  const [rxHistory, setRxHistory] = useState<number[]>(new Array(30).fill(0));
  const [txHistory, setTxHistory] = useState<number[]>(new Array(30).fill(0));

  useEffect(() => {
    if (!metrics) return;
    setCpuHistory((prev) => [...prev.slice(1), Math.round(metrics.cpu_overall_usage)]);
    const memPct = metrics.total_memory > 0
      ? Math.round((metrics.used_memory / metrics.total_memory) * 100)
      : 0;
    setMemHistory((prev) => [...prev.slice(1), memPct]);

    // Network history (scaled to relative 0-100 based on active bandwidth)
    const rx = metrics.current_download_speed || 0;
    const tx = metrics.current_upload_speed || 0;
    const rxNorm = Math.min(100, (rx / (10 * 1024 * 1024)) * 100);
    const txNorm = Math.min(100, (tx / (10 * 1024 * 1024)) * 100);
    setRxHistory((prev) => [...prev.slice(1), rxNorm]);
    setTxHistory((prev) => [...prev.slice(1), txNorm]);
  }, [metrics]);

  const renderPolyline = (data: number[], height: number, width: number) => {
    const points = data
      .map((val, idx) => {
        const x = (idx / (data.length - 1)) * width;
        const y = height - (Math.max(0, Math.min(100, val)) / 100) * height;
        return `${x},${y}`;
      })
      .join(" ");
    return points;
  };

  return (
    <div className="space-y-4 px-3 flex flex-col pb-6 overflow-y-auto transition-colors duration-200">
      {/* Title with Divider */}
      <div className="relative text-center my-1">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-theme-subtle" />
        </div>
        <div className="relative inline-block bg-theme-app px-6 text-sm font-semibold text-theme-title tracking-wider uppercase">
          Resources
        </div>
      </div>

      {/* History of CPU Chart */}
      <div className="bg-theme-card border border-theme rounded-md p-4 shadow-sm transition-colors duration-200">
        <div className="flex justify-between items-center mb-3">
          <span className="text-theme-title font-bold text-xs uppercase tracking-wider">
            History of CPU
          </span>
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="flex items-center gap-1.5 text-emerald-500 font-semibold">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Total: {metrics ? Math.round(metrics.cpu_overall_usage) : 0}%
            </span>
            <span className="text-theme-dim font-mono text-[11px]">
              {metrics ? `${metrics.cpu_physical_cores || metrics.cpu_count} Cores / ${metrics.cpu_threads || metrics.cpu_count} Threads` : ""}
            </span>
          </div>
        </div>

        {/* Chart SVG */}
        <div className="h-32 w-full bg-theme-inner rounded border border-theme-subtle relative overflow-hidden flex items-end">
          <div className="absolute inset-0 flex flex-col justify-between p-2 pointer-events-none opacity-20">
            <div className="border-b border-theme" />
            <div className="border-b border-theme" />
            <div className="border-b border-theme" />
            <div className="border-b border-theme" />
          </div>

          <svg className="w-full h-full" viewBox="0 0 400 120" preserveAspectRatio="none">
            <polyline
              fill="none"
              stroke="#10b981"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={renderPolyline(cpuHistory, 120, 400)}
            />
          </svg>
        </div>
        <div className="flex justify-between text-[10px] text-theme-dim mt-1.5 font-mono">
          <span>60.0s</span>
          <span>45.0s</span>
          <span>30.0s</span>
          <span>15.0s</span>
          <span>0.0s</span>
        </div>
      </div>

      {/* History of Memory Chart */}
      <div className="bg-theme-card border border-theme rounded-md p-4 shadow-sm transition-colors duration-200">
        <div className="flex justify-between items-center mb-3">
          <span className="text-theme-title font-bold text-xs uppercase tracking-wider">
            History of Memory
          </span>
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="flex items-center gap-1.5 text-amber-500 font-semibold">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> RAM: {metrics ? `${formatBytes(metrics.used_memory)} / ${formatBytes(metrics.total_memory)}` : "0 B"}
            </span>
          </div>
        </div>

        {/* Chart SVG */}
        <div className="h-32 w-full bg-theme-inner rounded border border-theme-subtle relative overflow-hidden flex items-end">
          <div className="absolute inset-0 flex flex-col justify-between p-2 pointer-events-none opacity-20">
            <div className="border-b border-theme" />
            <div className="border-b border-theme" />
            <div className="border-b border-theme" />
            <div className="border-b border-theme" />
          </div>

          <svg className="w-full h-full" viewBox="0 0 400 120" preserveAspectRatio="none">
            <polyline
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={renderPolyline(memHistory, 120, 400)}
            />
          </svg>
        </div>
        <div className="flex justify-between text-[10px] text-theme-dim mt-1.5 font-mono">
          <span>60.0s</span>
          <span>45.0s</span>
          <span>30.0s</span>
          <span>15.0s</span>
          <span>0.0s</span>
        </div>
      </div>

      {/* History of Network Chart */}
      <div className="bg-theme-card border border-theme rounded-md p-4 shadow-sm transition-colors duration-200">
        <div className="flex justify-between items-center mb-3">
          <span className="text-theme-title font-bold text-xs uppercase tracking-wider">
            History of Network
          </span>
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="flex items-center gap-1.5 text-[#00d4ff] font-semibold">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#00d4ff]" /> DL: {metrics ? formatSpeed(metrics.current_download_speed) : "0 B/s"}
            </span>
            <span className="flex items-center gap-1.5 text-[#ed8f03] font-semibold">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#ed8f03]" /> UL: {metrics ? formatSpeed(metrics.current_upload_speed) : "0 B/s"}
            </span>
          </div>
        </div>

        {/* Chart SVG */}
        <div className="h-32 w-full bg-theme-inner rounded border border-theme-subtle relative overflow-hidden flex items-end">
          <div className="absolute inset-0 flex flex-col justify-between p-2 pointer-events-none opacity-20">
            <div className="border-b border-theme" />
            <div className="border-b border-theme" />
            <div className="border-b border-theme" />
            <div className="border-b border-theme" />
          </div>

          <svg className="w-full h-full" viewBox="0 0 400 120" preserveAspectRatio="none">
            <polyline
              fill="none"
              stroke="#00d4ff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={renderPolyline(rxHistory, 120, 400)}
            />
            <polyline
              fill="none"
              stroke="#ed8f03"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={renderPolyline(txHistory, 120, 400)}
            />
          </svg>
        </div>
        <div className="flex justify-between text-[10px] text-theme-dim mt-1.5 font-mono">
          <span>60.0s</span>
          <span>45.0s</span>
          <span>30.0s</span>
          <span>15.0s</span>
          <span>0.0s</span>
        </div>
      </div>
    </div>
  );
};
