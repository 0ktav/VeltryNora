import { EventsOn } from "../../wailsjs/runtime";
import { DownloadUpdate, InstallUpdate } from "../../wailsjs/go/main/App";
import { t } from "./i18n.js";
import { startDownload, finishDownload, errorDownload } from "./downloader.js";

let pendingUpdate = null;

export function initUpdater() {
  EventsOn("update:available", (info) => {
    pendingUpdate = info;
    showUpdateBadge(info.latestVersion);
  });
}

export function getPendingUpdate() {
  return pendingUpdate;
}

function showUpdateBadge(version) {
  const badge = document.getElementById("update-badge");
  const versionEl = document.getElementById("update-badge-version");
  if (!badge) return;
  if (versionEl) versionEl.textContent = `v${version}`;
  badge.style.display = "flex";
  badge.addEventListener("click", () => {
    document.querySelector('.nav-item[data-page="about"]')?.click();
  });
}

export function hideUpdateBadge() {
  const badge = document.getElementById("update-badge");
  if (badge) badge.style.display = "none";
}

/**
 * Download and install update.
 * @param {string} downloadURL
 * @param {{ onProgress, onSuccess, onError }} callbacks
 */
export async function downloadAndInstall(downloadURL, latestVersion, { onDownloaded, onError }) {
  startDownload("update:download-progress", `VeltryNora v${latestVersion}`);

  const errMsg = await DownloadUpdate(downloadURL);

  if (errMsg) {
    errorDownload("update:download-progress", errMsg);
    if (onError) onError(errMsg);
    return;
  }

  finishDownload("update:download-progress");
  if (onDownloaded) onDownloaded();
}

export async function installUpdate(onError) {
  const errMsg = await InstallUpdate();
  if (errMsg && onError) onError(errMsg);
}
