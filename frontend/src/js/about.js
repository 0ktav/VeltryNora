import { GetAppInfo, CheckForUpdates, OpenURL } from "../../wailsjs/go/main/App";
import { t } from "./i18n.js";

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
  } else {
    status.style.color = "var(--warn)";
    status.textContent = t("about.update_available", { version: result.latestVersion });

    if (result.releaseURL) {
      const link = document.createElement("button");
      link.className = "btn btn-secondary";
      link.style.cssText = "font-size:11px;margin-left:8px";
      link.textContent = t("about.download");
      link.addEventListener("click", () => OpenURL(result.releaseURL));
      status.appendChild(link);
    }
  }
}
