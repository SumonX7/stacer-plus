export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KiB", "MiB", "GiB", "TiB", "PiB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  if (i >= sizes.length) return (bytes / Math.pow(k, sizes.length - 1)).toFixed(dm) + " " + sizes[sizes.length - 1];
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export function formatSpeed(bytesPerSec: number): string {
  if (!bytesPerSec || bytesPerSec <= 0) return "0.0 KB/s (0.00 Mbps)";
  const mbps = ((bytesPerSec * 8) / 1_000_000).toFixed(2);
  if (bytesPerSec < 1024) {
    return `${bytesPerSec} B/s (${mbps} Mbps)`;
  }
  if (bytesPerSec < 1024 * 1024) {
    const kb = (bytesPerSec / 1024).toFixed(1);
    return `${kb} KB/s (${mbps} Mbps)`;
  }
  const mb = (bytesPerSec / (1024 * 1024)).toFixed(2);
  return `${mb} MB/s (${mbps} Mbps)`;
}

export function formatUptime(secs: number): string {
  const days = Math.floor(secs / (3600 * 24));
  const hours = Math.floor((secs % (3600 * 24)) / 3600);
  const minutes = Math.floor((secs % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
