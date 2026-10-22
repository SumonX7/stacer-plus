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
      const list = await invoke<ServiceItem[]>("get_services");
      setServices(list);
    } catch (err) {
      console.error("Failed to load services:", err);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleAction = async (unit: string, action: string) => {
    try {
      await invoke<string>("toggle_service", { unit, action });
      await fetchServices();
    } catch (err) {
      alert(`Error: ${err}`);
    }
  };

  const filtered = services.filter((s) => {
    const match =
      s.unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.description.toLowerCase().includes(searchTerm.toLowerCase());
    if (!match) return false;
    if (filterState === "active") return s.active === "active";
    if (filterState === "inactive") return s.active !== "active";
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
          Services
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex justify-between items-center text-xs">
        <div className="flex items-center gap-2">
          <span className="text-white font-medium">Services ({filtered.length})</span>
          <div className="flex bg-[#212f3c] border border-[#283846] rounded p-0.5 ml-4">
            {(["all", "active", "inactive"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterState(tab)}
                className={`px-3 py-1 rounded text-xs capitalize transition ${
                  filterState === tab
                    ? "bg-[#075ffe] text-white font-medium"
                    : "text-[#7d8ea0] hover:text-white"
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
            className="w-56 rounded border border-[#283846] bg-[#212f3c] px-3 py-1.5 pr-8 text-xs text-white placeholder-[#7d8ea0] focus:border-blue-500 focus:outline-none"
          />
          <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#7d8ea0]" />
        </div>
      </div>

      {/* Services Table */}
      <div className="flex-1 rounded-md border border-[#283846] bg-[#212f3c] overflow-hidden flex flex-col">
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-[#212f3c] border-b border-[#283846] text-[#00d4ff] font-semibold">
              <tr>
                <th className="py-2.5 px-4">Service</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Description</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#283846]/60 text-[#dddddd] font-sans">
              {filtered.map((s, idx) => {
                const isActive = s.active === "active";
                return (
                  <tr key={idx} className="hover:bg-[#283846]/40 transition">
                    <td className="py-2.5 px-4 font-mono font-medium text-white">{s.unit}</td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          isActive
                            ? "bg-[#00eb55]/20 text-[#00eb55] border border-[#00eb55]/40"
                            : "bg-[#1b252f] text-[#7d8ea0]"
                        }`}
                      >
                        {s.active}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-[#aeb5bf] max-w-md truncate" title={s.description}>
                      {s.description || "—"}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        {isActive ? (
                          <button
                            onClick={() => handleAction(s.unit, "stop")}
                            className="p-1 rounded bg-[#1b252f] hover:bg-[#283846] text-amber-400"
                            title="Stop"
                          >
                            <Square className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAction(s.unit, "start")}
                            className="p-1 rounded bg-[#1b252f] hover:bg-[#283846] text-[#00eb55]"
                            title="Start"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleAction(s.unit, "restart")}
                          className="p-1 rounded bg-[#1b252f] hover:bg-[#283846] text-[#075ffe]"
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
