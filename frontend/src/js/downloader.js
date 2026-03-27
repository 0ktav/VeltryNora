import { EventsOn } from "../../wailsjs/runtime";
import { CancelDownload } from "../../wailsjs/go/main/App.js";

// Map<downloadId, { elEntry, elBar, elPct, elSize }>
const active = new Map();
let totalStarted = 0;
let nextId = 0;
let collapsed = false;

let card = null;
let cardTitle = null;
let cardBody = null;

export function initDownloader() {
  card = document.getElementById("dl-float-card");
  cardTitle = document.getElementById("dl-float-title");
  cardBody = document.getElementById("dl-float-body");

  const toggle = document.getElementById("dl-float-toggle");
  toggle?.addEventListener("click", () => {
    collapsed = !collapsed;
    cardBody.style.display = collapsed ? "none" : "";
    toggle.textContent = collapsed ? "+" : "−";
  });
}

function updateHeader() {
  if (!cardTitle) return;
  cardTitle.textContent = `↓ Downloading ${active.size} / ${totalStarted}`;
}

function hideCardIfDone() {
  if (active.size === 0) {
    setTimeout(() => {
      if (active.size === 0 && card) {
        card.style.display = "none";
        totalStarted = 0;
        collapsed = false;
        if (cardBody) cardBody.style.display = "";
        const toggle = document.getElementById("dl-float-toggle");
        if (toggle) toggle.textContent = "−";
      }
    }, 1500);
  }
}

/**
 * Register a new active download and show it in the floating card.
 * @param {string} eventName - Wails event name (e.g. "nginx:download-progress")
 * @param {string} label     - Human label shown in the card (e.g. "Nginx 1.27.4")
 * @returns {string} downloadId - unique ID to pass to finishDownload / errorDownload
 */
export function startDownload(eventName, label) {
  if (!card) return "";

  const downloadId = `${eventName}|${nextId++}`;
  totalStarted++;

  card.style.display = "block";

  const entry = document.createElement("div");
  entry.className = "dl-entry";
  entry.innerHTML = `
    <div class="dl-header">
      <span class="dl-name">${label}</span>
      <button class="dl-cancel-btn" title="Cancel">✕</button>
    </div>
    <div class="progress-wrap dl-bar-wrap">
      <div class="progress-bar dl-bar" style="width:0%"></div>
    </div>
    <div class="dl-info">
      <span class="dl-pct">0%</span>
      <span class="dl-size"></span>
    </div>
  `;

  const cancelBtn = entry.querySelector(".dl-cancel-btn");
  cancelBtn.addEventListener("click", () => {
    cancelBtn.disabled = true;
    CancelDownload(eventName);
  });

  cardBody.appendChild(entry);

  const dl = {
    elEntry: entry,
    elBar: entry.querySelector(".dl-bar"),
    elPct: entry.querySelector(".dl-pct"),
    elSize: entry.querySelector(".dl-size"),
  };

  active.set(downloadId, dl);
  updateHeader();

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
 * Mark a download as finished successfully and remove its entry from the card.
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
    updateHeader();
    hideCardIfDone();
  }, 1500);
}

/**
 * Mark a download as failed, show error in the card entry, then remove it.
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
    updateHeader();
    hideCardIfDone();
  }, 4000);
}
