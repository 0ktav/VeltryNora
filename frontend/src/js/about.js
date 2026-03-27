import { GetAppInfo, CheckForUpdates, OpenURL, GetInstallLocation, GetChangelog } from "../../wailsjs/go/main/App";
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

  const checkBtn = document.getElementById("about-check-updates-btn");
  if (checkBtn) checkBtn.onclick = checkUpdates;

  GetChangelog().then(renderChangelog);

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

function renderChangelog(md) {
  const el = document.getElementById("about-changelog");
  if (!el || !md) return;

  const sectionColors = { added: "var(--good)", changed: "var(--accent2)", fixed: "var(--warn)", removed: "var(--danger)" };

  // Parse into version blocks: [{ title, body }]
  const blocks = [];
  let current = null;
  let inList = false;
  let bodyHtml = "";

  const flushList = () => { if (inList) { bodyHtml += "</ul>"; inList = false; } };

  for (const raw of md.split("\n")) {
    const line = raw.trim();
    if (line.startsWith("## ")) {
      flushList();
      if (current) { current.body = bodyHtml; blocks.push(current); }
      current = { title: line.slice(3) };
      bodyHtml = "";
    } else if (!current) {
      continue;
    } else if (line.startsWith("### ")) {
      flushList();
      const label = line.slice(4).toLowerCase();
      const color = sectionColors[label] || "var(--text3)";
      bodyHtml += `<div class="cl-section" style="color:${color}">${line.slice(4)}</div><ul class="cl-list">`;
      inList = true;
    } else if (line.startsWith("- ")) {
      if (!inList) { bodyHtml += "<ul class=\"cl-list\">"; inList = true; }
      const content = line.slice(2).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      bodyHtml += `<li>${content}</li>`;
    } else if (line === "---") {
      flushList();
    }
  }
  flushList();
  if (current) { current.body = bodyHtml; blocks.push(current); }

  // Build accordion HTML — first block open by default
  let html = "";
  blocks.forEach((block, i) => {
    const open = i === 0;
    html += `
      <div class="cl-accordion${open ? " cl-open" : ""}">
        <button class="cl-acc-header" type="button">
          <span class="cl-acc-title">${block.title}</span>
          <span class="cl-acc-arrow">▾</span>
        </button>
        <div class="cl-acc-body">${block.body}</div>
      </div>`;
  });
  el.innerHTML = html;

  // Toggle on click
  el.querySelectorAll(".cl-acc-header").forEach(btn => {
    btn.addEventListener("click", () => {
      btn.closest(".cl-accordion").classList.toggle("cl-open");
    });
  });
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

  if (downloadBtn) downloadBtn.onclick = async () => {
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
      onDownloaded: async () => {
        if (progressWrap) progressWrap.style.display = "none";
        downloadBtn.style.display = "none";

        const installLocation = await GetInstallLocation();
        const locationEl = document.getElementById("about-install-location");
        if (locationEl && installLocation) {
          locationEl.textContent = `→ ${installLocation}`;
          locationEl.style.display = "block";
        }

        const installBtn = document.getElementById("about-install-btn");
        if (installBtn) {
          installBtn.style.display = "inline-flex";
          installBtn.onclick = async () => {
            installBtn.disabled = true;
            installBtn.innerHTML = `<span class="spinner"></span>`;
            await installUpdate((err) => {
              installBtn.disabled = false;
              installBtn.textContent = t("about.install_restart");
              if (status) { status.style.color = "var(--danger)"; status.textContent = err; }
            });
          };
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
  };
}
