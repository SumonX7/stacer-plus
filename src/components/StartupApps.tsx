import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { StartupAppItem } from "../types";
import { Edit3, X } from "lucide-react";

export const StartupApps: React.FC = () => {
  const [apps, setApps] = useState<StartupAppItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newExec, setNewExec] = useState("");
  const [newComment, setNewComment] = useState("");

  const fetchApps = async () => {
    try {
      const data = await invoke<StartupAppItem[]>("get_startup_apps");
      setApps(data);
    } catch (err) {
      console.error("Failed to fetch startup apps:", err);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const handleToggle = async (app: StartupAppItem) => {
    try {
      await invoke("toggle_startup_app", {
        filePath: app.file_path,
        enable: !app.enabled,
      });
      fetchApps();
    } catch (err) {
      console.error("Failed to toggle app:", err);
    }
  };

  const handleDelete = async (filePath: string) => {
    try {
      await invoke("delete_startup_app", { filePath });
      fetchApps();
    } catch (err) {
      console.error("Failed to delete app:", err);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newExec.trim()) return;

    try {
      await invoke("add_startup_app", {
        name: newName.trim(),
        exec: newExec.trim(),
        comment: newComment.trim(),
      });
      setIsModalOpen(false);
      setNewName("");
      setNewExec("");
      setNewComment("");
      await fetchApps();
    } catch (err) {
      alert(`Error adding app: ${err}`);
    }
  };

  return (
    <div className="space-y-4 px-3 flex flex-col h-[calc(100vh-80px)] transition-colors duration-200">
      {/* Title with Divider */}
      <div className="relative text-center my-1">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-theme-subtle" />
        </div>
        <div className="relative inline-block bg-theme-app px-6 text-sm font-semibold text-theme-title tracking-wider uppercase">
          Startup Apps
        </div>
      </div>

      <div className="text-xs text-theme-muted font-medium px-1">
        Startup Applications ({apps.length})
      </div>

      {/* App List */}
      <div className="flex-1 space-y-2.5 overflow-y-auto pr-1">
        {apps.map((app, idx) => (
          <div
            key={idx}
            className="bg-theme-card border border-theme rounded-md px-4 py-3 flex items-center justify-between shadow-sm hover:border-[#075ffe]/50 transition"
          >
            <div className="flex items-center gap-3 truncate pr-4">
              <div className="w-7 h-7 rounded bg-theme-inner border border-theme-subtle flex items-center justify-center text-slate-300 flex-shrink-0">
                <img
                  src="/stacer-assets/app.png"
                  alt="App"
                  className="w-4 h-4 object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </div>
              <div className="truncate">
                <div className="text-theme-title text-xs font-semibold truncate">{app.name}</div>
                <div className="text-[11px] text-theme-dim font-mono truncate">{app.exec}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                className="text-theme-dim hover:text-theme-title transition p-1 cursor-pointer"
                title="Edit"
              >
                <Edit3 className="w-4 h-4" />
              </button>

              {!app.is_system_wide && (
                <button
                  onClick={() => handleDelete(app.file_path)}
                  className="text-theme-dim hover:text-red-500 transition p-1 cursor-pointer"
                  title="Delete"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Stacer's Classic Green Capsule Toggle */}
              <button
                onClick={() => handleToggle(app)}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 ease-in-out border cursor-pointer ${
                  app.enabled
                    ? "bg-emerald-500/20 border-emerald-500"
                    : "bg-theme-inner border-theme"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full transition-transform duration-200 ease-in-out ${
                    app.enabled
                      ? "transform translate-x-5 bg-emerald-500"
                      : "bg-slate-400"
                  }`}
                />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Button */}
      <div className="flex justify-end pt-2 pb-1">
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-2 bg-[#075ffe] hover:bg-[#0066ff] active:bg-[#004ecc] text-white font-semibold text-xs rounded transition shadow cursor-pointer"
        >
          Add Startup App
        </button>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-theme-card border border-theme rounded-md p-6 shadow-2xl text-xs">
            <h3 className="text-sm font-bold text-theme-title mb-4">Add Startup Application</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-theme-muted mb-1 font-medium">Application Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. My Script"
                  className="w-full rounded border border-theme bg-theme-inner p-2 text-theme-title focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-theme-muted mb-1 font-medium">Command / Executable</label>
                <input
                  type="text"
                  required
                  value={newExec}
                  onChange={(e) => setNewExec(e.target.value)}
                  placeholder="e.g. /usr/bin/my-app"
                  className="w-full rounded border border-theme bg-theme-inner p-2 text-theme-title font-mono focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-theme-muted mb-1 font-medium">Comment</label>
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Optional description"
                  className="w-full rounded border border-theme bg-theme-inner p-2 text-theme-title focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-theme">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-theme bg-theme-inner text-theme-main hover:bg-theme-card rounded font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#075ffe] hover:bg-[#0066ff] text-white rounded font-semibold shadow cursor-pointer"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
