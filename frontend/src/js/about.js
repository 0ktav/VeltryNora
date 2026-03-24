import { GetAppInfo, CheckForUpdates, OpenURL } from "../../wailsjs/go/main/App";
import { EventsOn } from "../../wailsjs/runtime";
import { t } from "./i18n.js";
import { getPendingUpdate, downloadAndInstall, installUpdate, hideUpdateBadge } from "./updater.js";

export async function init() {
  const info = await GetAppInfo();

  const nameEl = document.getElementById("about-app-name");
  const badgeEl = document.getElementById("about-version-badge");
  const authorEl = document.getElementById("about-author");
  const repoBtn = document.getElementById("about-repo-btn");

  if (nameEl) nameEl.textContent = info.name;
  if (badgeEl) badgeEl.textContent = "v" + info.version;
  if (authorEl) authorEl.textContent = info.author;

  if (repoBtn) {
    const repoURL = "https://github.com/" + info.repository;
    repoBtn.textContent = "github.com/" + info.repository;
    repoBtn.addEventListener("click", () => OpenURL(repoURL));
  }

  document.getElementById("about-check-updates-btn")?.addEventListener("click", checkUpdates);

  // If update was already detected on startup, show it immediately; otherwise auto-check
  const pending = getPendingUpdate();
  if (pending) {
    showUpdateAvailable(pending);
  } else {
    checkUpdates();
  }
}

async function checkUpdates() {
  const btn = document.getElementById("about-check-updates-btn");
  const status = document.getElementById("about-update-status");
  if (!btn || !status) return;

  btn.disabled = true;
  status.style.color = "var(--text3)";
  status.textContent = t("about.checking");

  const result = await CheckForUpdates();

  btn.disabled = false;
  status.innerHTML = "";

  if (result.error) {
    status.style.color = "var(--danger)";
    status.textContent = t("about.check_error");
    return;
  }

  if (result.isUpToDate) {
    status.style.color = "var(--good)";
    status.textContent = "✓ " + t("about.up_to_date");
    return;
  }

  showUpdateAvailable(result);
}

function showUpdateAvailable(result) {
  const status = document.getElementById("about-update-status");
  const actions = document.getElementById("about-update-actions");
  const downloadBtn = document.getElementById("about-download-btn");

  if (status) {
    status.style.color = "var(--warn)";
    status.textContent = t("about.update_available", { version: result.latestVersion });
  }

  if (!result.downloadURL) {
    // No direct download URL — fallback to release page link
    if (status && result.releaseURL) {
      const link = document.createElement("button");
      link.className = "btn btn-secondary";
      link.style.cssText = "font-size:11px;margin-left:8px";
      link.textContent = t("about.download");
      link.addEventListener("click", () => OpenURL(result.releaseURL));
      status.appendChild(link);
    }
    return;
  }

  if (actions) actions.style.display = "block";

  downloadBtn?.addEventListener("click", async () => {
    downloadBtn.disabled = true;
    downloadBtn.innerHTML = `<span class="spinner"></span> ${t("common.loading")}`;

    const progressWrap = document.getElementById("about-update-download");
    const bar = document.getElementById("about-update-bar");
    const pct = document.getElementById("about-update-pct");
    const size = document.getElementById("about-update-size");

    if (progressWrap) progressWrap.style.display = "block";

    // Mirror progress in the about page
    EventsOn("update:download-progress", ({ percent, totalMB }) => {
      if (percent >= 0) {
        if (bar) bar.style.width = percent + "%";
        if (pct) pct.textContent = percent + "%";
        if (size && totalMB > 0) {
          const done = ((percent / 100) * totalMB).toFixed(1);
          size.textContent = `${done} / ${totalMB.toFixed(1)} MB`;
        }
      } else {
        if (bar) { bar.style.width = "100%"; bar.style.opacity = "0.4"; }
        if (pct) pct.textContent = totalMB > 0 ? `${totalMB.toFixed(1)} MB` : "…";
      }
    });

    await downloadAndInstall(result.downloadURL, result.latestVersion, {
      onDownloaded: () => {
        if (progressWrap) progressWrap.style.display = "none";
        downloadBtn.style.display = "none";
        const installBtn = document.getElementById("about-install-btn");
        if (installBtn) {
          installBtn.style.display = "inline-flex";
          installBtn.addEventListener("click", async () => {
            installBtn.disabled = true;
            installBtn.innerHTML = `<span class="spinner"></span>`;
            await installUpdate((err) => {
              installBtn.disabled = false;
              installBtn.textContent = t("about.install_restart");
              if (status) { status.style.color = "var(--danger)"; status.textContent = err; }
            });
          });
        }
        hideUpdateBadge();
        if (status) { status.style.color = "var(--good)"; status.textContent = t("about.ready_to_install"); }
      },
      onError: (err) => {
        downloadBtn.disabled = false;
        downloadBtn.textContent = t("about.download_install");
        if (progressWrap) progressWrap.style.display = "none";
        if (status) { status.style.color = "var(--danger)"; status.textContent = err; }
      },
    });
  });
}
