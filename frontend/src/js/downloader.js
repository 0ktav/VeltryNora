import { EventsOn } from "../../wailsjs/runtime";

// Map<downloadId, { elEntry, elBar, elPct, elSize }>
const active = new Map();
let nextId = 0;

let container = null;

export function initDownloader() {
  container = document.getElementById("sidebar-downloads");
}

/**
 * Register a new active download and show it in the sidebar.
 * @param {string} eventName - Wails event name (e.g. "nginx:download-progress")
 * @param {string} label     - Human label shown in the sidebar (e.g. "Nginx 1.27.4")
 * @returns {string} downloadId - unique ID to pass to finishDownload / errorDownload
 */
export function startDownload(eventName, label) {
  if (!container) return "";

  const downloadId = `${eventName}|${nextId++}`;

  const entry = document.createElement("div");
  entry.className = "dl-entry";
  entry.innerHTML = `
    <div class="dl-header">
      <span class="dl-icon">↓</span>
      <span class="dl-name">${label}</span>
    </div>
    <div class="progress-wrap dl-bar-wrap">
      <div class="progress-bar dl-bar" style="width:0%"></div>
    </div>
    <div class="dl-info">
      <span class="dl-pct">0%</span>
      <span class="dl-size"></span>
    </div>
  `;

  container.appendChild(entry);
  container.style.display = "flex";

  const dl = {
    elEntry: entry,
    elBar: entry.querySelector(".dl-bar"),
    elPct: entry.querySelector(".dl-pct"),
    elSize: entry.querySelector(".dl-size"),
  };

  active.set(downloadId, dl);

  EventsOn(eventName, ({ percent, totalMB }) => {
    const d = active.get(downloadId);
    if (!d) return;

    if (percent >= 0) {
      d.elBar.style.width = percent + "%";
      d.elBar.style.opacity = "";
      d.elPct.textContent = percent + "%";
      if (totalMB > 0) {
        const doneMB = ((percent / 100) * totalMB).toFixed(1);
        d.elSize.textContent = `${doneMB} / ${totalMB.toFixed(1)} MB`;
      }
    } else {
      d.elBar.style.width = "100%";
      d.elBar.style.opacity = "0.4";
      d.elPct.textContent = totalMB > 0 ? `${totalMB.toFixed(1)} MB` : "…";
      d.elSize.textContent = "";
    }
  });

  return downloadId;
}

/**
 * Mark a download as finished successfully and remove its entry from the sidebar.
 * @param {string} downloadId - ID returned by startDownload
 */
export function finishDownload(downloadId) {
  const dl = active.get(downloadId);
  if (!dl) return;

  dl.elBar.style.width = "100%";
  dl.elBar.style.opacity = "";
  dl.elPct.textContent = "✓";
  dl.elPct.style.color = "var(--good)";
  dl.elSize.textContent = "";

  setTimeout(() => {
    dl.elEntry.remove();
    active.delete(downloadId);
    if (active.size === 0 && container) {
      container.style.display = "none";
    }
  }, 1500);
}

/**
 * Mark a download as failed, show error in the sidebar entry, then remove it.
 * @param {string} downloadId - ID returned by startDownload
 * @param {string} message
 */
export function errorDownload(downloadId, message) {
  const dl = active.get(downloadId);
  if (!dl) return;

  dl.elBar.style.width = "100%";
  dl.elBar.style.opacity = "0.3";
  dl.elBar.style.background = "var(--danger)";
  dl.elPct.textContent = message;
  dl.elPct.style.color = "var(--danger)";
  dl.elSize.textContent = "";

  setTimeout(() => {
    dl.elEntry.remove();
    active.delete(downloadId);
    if (active.size === 0 && container) {
      container.style.display = "none";
    }
  }, 4000);
}
