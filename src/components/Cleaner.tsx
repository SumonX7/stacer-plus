import React, { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { CleanCategoryScan, CleanResult } from "../types";
import { formatBytes } from "../utils";
import { CheckCircle2, ChevronRight, ChevronDown, ArrowLeft } from "lucide-react";

export const Cleaner: React.FC = () => {
  const [viewState, setViewState] = useState<"categories" | "results">("categories");
  const [scanning, setScanning] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [categories, setCategories] = useState<CleanCategoryScan[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set(["package_cache", "crash_reports", "system_logs", "user_cache", "trash", "dev_cache", "journal_logs"])
  );
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [cleanedMessage, setCleanedMessage] = useState<string | null>(null);

  const categoryCards = [
    { id: "package_cache", title: "Package Caches", icon: "/stacer-assets/c_package.png" },
    { id: "crash_reports", title: "Crash Reports", icon: "/stacer-assets/c_crash.png" },
    { id: "system_logs", title: "Application Logs", icon: "/stacer-assets/c_logs.png" },
    { id: "user_cache", title: "Application Caches", icon: "/stacer-assets/c_cache.png" },
    { id: "trash", title: "Trash", icon: "/stacer-assets/c_trash.png" },
    { id: "dev_cache", title: "Developer Caches", icon: "/stacer-assets/c_package.png" },
    { id: "journal_logs", title: "Journal Logs", icon: "/stacer-assets/c_logs.png" },
  ];

  const toggleCategorySelection = (catId: string) => {
    const next = new Set(selectedCategories);
    if (next.has(catId)) next.delete(catId);
    else next.add(catId);
    setSelectedCategories(next);
  };

  const handleStartScan = async () => {
    setScanning(true);
    setCleanedMessage(null);
    try {
      const res = await invoke<CleanCategoryScan[]>("scan_cleaner");
      // Filter only selected categories
      const filtered = res.filter((c) => selectedCategories.has(c.id));
      setCategories(filtered);

      const paths = new Set<string>();
      filtered.forEach((c) => c.items.forEach((item) => paths.add(item.path)));
      setSelectedPaths(paths);

      setViewState("results");
    } catch (err) {
      console.error("Scan error:", err);
    } finally {
      setScanning(false);
    }
  };

  const toggleItemPath = (path: string) => {
    const next = new Set(selectedPaths);
    if (next.has(path)) next.delete(path);
    else next.add(path);
    setSelectedPaths(next);
  };

  const toggleExpandCat = (catId: string) => {
    const next = new Set(expandedCats);
    if (next.has(catId)) next.delete(catId);
    else next.add(catId);
    setExpandedCats(next);
  };

  const handleExecuteClean = async () => {
    if (selectedPaths.size === 0) return;
    setCleaning(true);
    try {
      const results = await invoke<CleanResult[]>("clean_selected", {
        paths: Array.from(selectedPaths),
        categoryIds: Array.from(selectedCategories),
      });

      const totalFreed = results.reduce((acc, curr) => acc + curr.freed_bytes, 0);
      setCleanedMessage(`${formatBytes(totalFreed)} size files cleaned.`);

      // Re-scan
      const res = await invoke<CleanCategoryScan[]>("scan_cleaner");
      setCategories(res.filter((c) => selectedCategories.has(c.id)));
    } catch (err) {
      console.error("Clean error:", err);
    } finally {
      setCleaning(false);
    }
  };

  return (
    <div className="space-y-6 px-3">
      {/* Title with Divider */}
      <div className="relative text-center my-1">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#263848]" />
        </div>
        <div className="relative inline-block bg-[#1b252f] px-6 text-sm font-semibold text-[#dddddd] tracking-wider uppercase">
          System Cleaner
        </div>
      </div>

      {viewState === "categories" ? (
        /* Stacer Categories View (5 gradient icons + scan circle button) */
        <div className="flex flex-col items-center justify-between min-h-[460px] pt-8">
          <div className="flex flex-wrap justify-center items-center gap-10 max-w-4xl">
            {categoryCards.map((cat) => {
              const isChecked = selectedCategories.has(cat.id);
              return (
                <div
                  key={cat.id}
                  onClick={() => toggleCategorySelection(cat.id)}
                  className="flex flex-col items-center cursor-pointer group select-none w-28 text-center"
                >
                  <div className="w-20 h-20 mb-3 flex items-center justify-center transition-transform group-hover:scale-105">
                    <img
                      src={cat.icon}
                      alt={cat.title}
                      className="max-w-full max-h-full object-contain filter drop-shadow"
                    />
                  </div>
                  <span className="text-xs font-medium text-slate-300 group-hover:text-white mb-2 h-8 leading-tight">
                    {cat.title}
                  </span>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition ${
                      isChecked
                        ? "bg-[#00eb55] border-[#00eb55] text-black"
                        : "border-[#7d8ea0] bg-transparent"
                    }`}
                  >
                    {isChecked && <CheckCircle2 className="w-4 h-4 fill-black text-[#00eb55]" />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stacer's Big Circular Scan Button */}
          <div className="mt-12 flex flex-col items-center">
            <button
              onClick={handleStartScan}
              disabled={scanning || selectedCategories.size === 0}
              className="w-20 h-20 rounded-full bg-[#075ffe] hover:bg-[#0066ff] active:bg-[#004ecc] shadow-lg shadow-blue-600/30 flex items-center justify-center transition-transform hover:scale-105 disabled:opacity-50"
            >
              <img
                src="/stacer-assets/scan.png"
                alt="Scan"
                className={`w-9 h-9 object-contain ${scanning ? 'animate-spin' : ''}`}
              />
            </button>
            <span className="text-xs text-slate-400 mt-2">
              {scanning ? "Scanning system..." : "Click to Scan"}
            </span>
          </div>
        </div>
      ) : (
        /* Stacer Results Tree View */
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-2">
            <button
              onClick={() => setViewState("categories")}
              className="flex items-center gap-1.5 text-xs text-[#075ffe] hover:text-blue-400 font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            {cleanedMessage && (
              <span className="text-xs text-[#00eb55] font-semibold">
                {cleanedMessage}
              </span>
            )}
          </div>

          <div className="bg-[#212f3c] border border-[#283846] rounded-md divide-y divide-[#283846] max-h-[380px] overflow-y-auto">
            {categories.map((cat) => {
              const isExpanded = expandedCats.has(cat.id);
              return (
                <div key={cat.id} className="text-xs">
                  <div
                    onClick={() => toggleExpandCat(cat.id)}
                    className="flex justify-between items-center p-3 cursor-pointer hover:bg-[#263848] transition select-none"
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-[#7d8ea0]" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-[#7d8ea0]" />
                      )}
                      <span className="font-semibold text-white">
                        {cat.name} ({cat.items.length})
                      </span>
                    </div>
                    <span className="font-semibold text-[#dddddd]">
                      {formatBytes(cat.total_bytes)}
                    </span>
                  </div>

                  {isExpanded && (
                    <div className="bg-[#1b252f] px-6 py-2 space-y-1.5 border-t border-[#283846]">
                      {cat.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center text-[11px] text-slate-300 py-1"
                        >
                          <label className="flex items-center gap-2 cursor-pointer truncate mr-4">
                            <input
                              type="checkbox"
                              checked={selectedPaths.has(item.path)}
                              onChange={() => toggleItemPath(item.path)}
                              className="rounded border-[#283846] bg-[#212f3c] text-blue-600"
                            />
                            <span className="truncate text-slate-400 font-mono" title={item.path}>
                              {item.name}
                            </span>
                          </label>
                          <span className="text-slate-500 whitespace-nowrap">
                            {formatBytes(item.size_bytes)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Stacer Big Circular Clean Button */}
          <div className="flex flex-col items-center pt-2">
            <button
              onClick={handleExecuteClean}
              disabled={cleaning || selectedPaths.size === 0}
              className="w-20 h-20 rounded-full bg-[#075ffe] hover:bg-[#0066ff] active:bg-[#004ecc] shadow-lg shadow-blue-600/30 flex items-center justify-center transition-transform hover:scale-105 disabled:opacity-50"
            >
              <img
                src="/stacer-assets/clean.png"
                alt="Clean"
                className={`w-9 h-9 object-contain ${cleaning ? 'animate-pulse' : ''}`}
              />
            </button>
            <span className="text-xs text-slate-400 mt-2">
              {cleaning ? "Cleaning files..." : "Click to Clean Selected"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
