# ⚡ Stacer Plus

> A modern, ultra-fast, and memory-safe Linux System Optimizer and Telemetry Monitor.  
> Built with **Rust**, **Tauri v2**, **React 19**, **TypeScript**, and **Tailwind CSS**.

---

## 🌟 Acknowledgement & Credits

**Stacer Plus** is heavily inspired by and built upon the visual design and spirit of the classic open-source Linux optimizer [**Stacer**](https://github.com/oguzhaninan/Stacer), originally created by **[Oğuzhan İnan](https://github.com/oguzhaninan)**. We pay homage and deep respect to the original Stacer project and its contributors.

---

## 🚀 Why Stacer Plus?

The original Stacer was built with C++ and Qt5. While beloved by the Linux community, it suffered from several architectural limitations:
- **Zero Memory Leaks:** Stacer Plus replaces manual pointer management and raw buffer copies with Rust's RAII and borrow checker.
- **Asynchronous & Non-blocking:** Services listing is gathered in a single batch query rather than spawning 600+ sequential blocking child processes that froze the GUI.
- **Safe Drop Caches:** The RAM cleaner measures exact before-and-after cache deltas and informs the user of the exact MB/GB freed.
- **Symlink Traversal Guard:** The system cleaner prevents directory traversal attacks and verifies safe canonical paths before deletion.
- **Modern Tauri v2 Architecture:** Minimal memory footprint (~35MB RAM vs 150MB+ for Electron apps) and native system integration.

---

## ✨ Features

1. **Dashboard**
   - Signature Stacer arc gauges for CPU usage, Memory consumption, and Disk fill.
   - One-click **Clean RAM** button showing the exact amount of cache freed.
   - POSIX system telemetry: Hostname, Linux distribution, Kernel release, CPU Model, Physical Cores + Logical Threads count, and clock speeds.
   - Real-time Network bandwidth monitoring showing current Download & Upload speeds in `KB/s`, `MB/s`, and `Mbps`, alongside total lifetime transfer stats.

2. **System Cleaner**
   - Safely cleans Package Caches (APT, Pacman, DNF), Application Caches, Crash Reports, System Logs, Developer Caches (Cargo, npm, yarn, pip), and Trash bin.
   - Non-destructive trash emptying (preserves folder structures).
   - Journald vacuum integration (`journalctl --vacuum-time=3d`).

3. **Startup Applications**
   - Reads and manages FreeDesktop XDG autostart entries (`~/.config/autostart` and `/etc/xdg/autostart`).
   - Add custom startup apps or disable existing ones with a single toggle.

4. **Systemd Services**
   - High-speed batch listing of all systemd system units.
   - Search by unit name or description.
   - Start, stop, enable, or disable services safely via `systemctl`.

5. **Process Manager**
   - Real-time POSIX process tree with live CPU and Resident Memory (RSS) tracking.
   - Sort by PID, CPU%, Memory%, or process name.
   - Filter processes instantly.
   - Terminate (`SIGTERM`) or Force Kill (`SIGKILL`) with root safety warnings.

6. **Resources**
   - 60-second real-time historical polyline graphs for CPU usage, Memory usage, and Network Download/Upload rates.

---

## 🛠️ Development & Build

### Prerequisites

- **Linux** (Debian/Ubuntu, Fedora, Arch, openSUSE, etc.)
- **Node.js** (v18+) and **npm**
- **Rust** and **Cargo** (`curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`)
- **System packages** for Tauri v2 on Linux:
  ```bash
  # Debian / Ubuntu / Pop!_OS
  sudo apt update
  sudo apt install -y libwebkit2gtk-4.1-dev build-essential curl wget file libssl-dev libayatana-appindicator3-dev librsvg2-dev

  # Fedora / RHEL
  sudo dnf install -y webkit2gtk4.1-devel openssl-devel curl wget file libappindicator-gtk3-devel librsvg2-devel

  # Arch Linux
  sudo pacman -S --needed webkit2gtk-4.1 base-devel curl wget file openssl libayatana-appindicator librsvg
  ```

### Run Locally (Dev Mode)

```bash
# Clone the repository
git clone https://github.com/<your-username>/stacer-plus.git
cd stacer-plus

# Install frontend dependencies
npm install

# Run the app in development mode with hot-reloading
npm run tauri dev
```

### Build Production Binary & Packages (.deb, .AppImage)

```bash
npm run tauri build
```
Built binaries will be placed in:
`src-tauri/target/release/bundle/deb/` and `src-tauri/target/release/bundle/appimage/`.

---

## 📜 License

MIT License. See [LICENSE](LICENSE) for details.
