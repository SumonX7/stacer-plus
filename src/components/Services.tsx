import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ServiceItem } from "../types";
import { Search, Play, Square, RotateCw } from "lucide-react";

export const Services: React.FC = () => {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterState, setFilterState] = useState<"all" | "active" | "inactive">("all");

  const fetchServices = async () => {
    try {
      const data = await invoke<ServiceItem[]>("get_services");
      setServices(data);
    } catch (err) {
      console.error("Failed to fetch services:", err);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleAction = async (unit: string, action: "start" | "stop" | "restart") => {
    try {
      await invoke("manage_service", { unit, action });
      fetchServices();
    } catch (err) {
      console.error(`Failed to ${action} service:`, err);
    }
  };

  const filtered = services.filter((s) => {
    const matchesSearch =
      s.unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.description.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (filterState === "active") return s.active === "active";
    if (filterState === "inactive") return s.active !== "active";
    return true;
  });

  return (
    <div className="space-y-4 px-3 flex flex-col h-[calc(100vh-80px)] transition-colors duration-200">
      {/* Title with Divider */}
      <div className="relative text-center my-1">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-theme-subtle" />
        </div>
        <div className="relative inline-block bg-theme-app px-6 text-sm font-semibold text-theme-title tracking-wider uppercase">
          Services
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex justify-between items-center text-xs">
        <div className="flex items-center gap-2">
          <span className="text-theme-title font-medium">Services ({filtered.length})</span>
          <div className="flex bg-theme-card border border-theme rounded p-0.5 ml-4 shadow-sm">
            {(["all", "active", "inactive"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterState(tab)}
                className={`px-3 py-1 rounded text-xs capitalize transition cursor-pointer ${
                  filterState === tab
                    ? "bg-[#075ffe] text-white font-medium shadow-sm"
                    : "text-theme-muted hover:text-theme-title"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
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

      {/* Services Table */}
      <div className="flex-1 rounded-md border border-theme bg-theme-card overflow-hidden flex flex-col shadow-sm">
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-theme-header border-b border-theme text-theme-accent font-semibold z-10">
              <tr>
                <th className="py-2.5 px-4">Service</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Description</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme text-theme-main font-sans">
              {filtered.map((s, idx) => {
                const isActive = s.active === "active";
                return (
                  <tr key={idx} className="hover:bg-theme-card-hover transition">
                    <td className="py-2.5 px-4 font-mono font-medium text-theme-title">{s.unit}</td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          isActive
                            ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                            : "bg-theme-inner text-theme-dim"
                        }`}
                      >
                        {s.active}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-theme-muted max-w-md truncate" title={s.description}>
                      {s.description || "—"}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        {isActive ? (
                          <button
                            onClick={() => handleAction(s.unit, "stop")}
                            className="p-1 rounded bg-theme-inner hover:bg-theme-card border border-theme-subtle text-amber-500 shadow-sm cursor-pointer"
                            title="Stop"
                          >
                            <Square className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAction(s.unit, "start")}
                            className="p-1 rounded bg-theme-inner hover:bg-theme-card border border-theme-subtle text-emerald-500 shadow-sm cursor-pointer"
                            title="Start"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleAction(s.unit, "restart")}
                          className="p-1 rounded bg-theme-inner hover:bg-theme-card border border-theme-subtle text-[#075ffe] shadow-sm cursor-pointer"
                          title="Restart"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
