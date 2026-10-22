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
      const list = await invoke<StartupAppItem[]>("get_startup_apps");
      setApps(list);
    } catch (err) {
      console.error("Failed to load startup apps:", err);
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
      await fetchApps();
    } catch (err) {
      alert(`Error toggling app: ${err}`);
    }
  };

  const handleDelete = async (filePath: string) => {
    if (!confirm("Are you sure you want to delete this startup application?")) return;
    try {
      await invoke("delete_startup_app", { filePath });
      await fetchApps();
    } catch (err) {
      alert(`Error deleting app: ${err}`);
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
    <div className="space-y-5 px-3 flex flex-col h-[calc(100vh-80px)]">
      {/* Title with Divider */}
      <div className="relative text-center my-1">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#263848]" />
        </div>
        <div className="relative inline-block bg-[#1b252f] px-6 text-sm font-semibold text-[#dddddd] tracking-wider uppercase">
          Startup Apps
        </div>
      </div>

      <div className="text-xs text-[#aeb5bf] font-medium px-1">
        Startup Applications ({apps.length})
      </div>

      {/* App List */}
      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {apps.map((app, idx) => (
          <div
            key={idx}
            className="bg-[#212f3c] border border-[#283846] rounded-md px-4 py-3 flex items-center justify-between shadow-sm hover:border-[#314452] transition"
          >
            <div className="flex items-center gap-3 truncate pr-4">
              <div className="w-6 h-6 rounded bg-[#263848] flex items-center justify-center text-slate-300 flex-shrink-0">
                <img
                  src="/stacer-assets/app.png"
                  alt="App"
                  className="w-4 h-4 object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <div className="truncate">
                <div className="text-white text-xs font-semibold truncate">{app.name}</div>
                <div className="text-[11px] text-[#7d8ea0] font-mono truncate">{app.exec}</div>
              </div>
            </div>

            <div className="flex items-center gap-4 flex-shrink-0">
              <button
                className="text-[#aeb5bf] hover:text-white transition p-1"
                title="Edit"
              >
                <Edit3 className="w-4 h-4" />
              </button>

              {!app.is_system_wide && (
                <button
                  onClick={() => handleDelete(app.file_path)}
                  className="text-[#aeb5bf] hover:text-red-400 transition p-1"
                  title="Delete"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Stacer's Classic Green Capsule Toggle */}
              <button
                onClick={() => handleToggle(app)}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 ease-in-out border ${
                  app.enabled
                    ? "bg-[#00eb55]/20 border-[#00eb55]"
                    : "bg-[#1b252f] border-[#314452]"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full transition-transform duration-200 ease-in-out ${
                    app.enabled
                      ? "transform translate-x-5 bg-[#00eb55]"
                      : "bg-[#7d8ea0]"
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
          className="px-6 py-2.5 bg-[#075ffe] hover:bg-[#0066ff] active:bg-[#004ecc] text-white font-semibold text-xs rounded transition shadow"
        >
          Add Startup App
        </button>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#212f3c] border border-[#283846] rounded-md p-6 shadow-2xl text-xs">
            <h3 className="text-sm font-bold text-white mb-4">Add Startup Application</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-[#aeb5bf] mb-1 font-medium">Application Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. My Script"
                  className="w-full rounded border border-[#283846] bg-[#1b252f] p-2 text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#aeb5bf] mb-1 font-medium">Command / Executable</label>
                <input
                  type="text"
                  required
                  value={newExec}
                  onChange={(e) => setNewExec(e.target.value)}
                  placeholder="e.g. /usr/bin/my-app"
                  className="w-full rounded border border-[#283846] bg-[#1b252f] p-2 text-white font-mono focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#aeb5bf] mb-1 font-medium">Comment</label>
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Optional description"
                  className="w-full rounded border border-[#283846] bg-[#1b252f] p-2 text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#283846]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-[#283846] bg-[#1b252f] text-slate-300 hover:bg-[#283846] rounded font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#075ffe] hover:bg-[#0066ff] text-white rounded font-semibold shadow"
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
