import { EventsOn } from "../../wailsjs/runtime";
import { t } from "./i18n.js";
import { startDownload, finishDownload, errorDownload } from "./downloader.js";

/**
 * Opens a reusable install modal with progress bar.
 * After each successful install, the modal resets and reloads available versions.
 * @param {{ title, accentColor, loadVersionsFn, installFn, eventName, onInstalled, withArchivedToggle }} config
 */
export function openInstallModal({
  title,
  serviceName = "",
  accentColor,
  loadVersionsFn,
  installFn,
  eventName,
  onInstalled,
  withArchivedToggle = false,
}) {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";

  const modal = document.createElement("div");
  modal.className = "modal";
  modal.style.width = "420px";
  modal.style.maxWidth = "calc(100vw - 48px)";

  modal.innerHTML = `
    <div class="modal-title" style="color:${accentColor}">${title}</div>
    <div class="modal-body" style="margin-bottom:0">
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <select class="select" id="imodal-select" style="flex:1;min-width:0"></select>
        ${
          withArchivedToggle
            ? `
          <label class="toggle" title="${t("php.archived")}" style="flex-shrink:0">
            <input type="checkbox" id="imodal-archived" />
            <span class="toggle-track"></span>
            <span class="toggle-thumb"></span>
          </label>
          <span style="font-size:12px;color:var(--text2);white-space:nowrap">${t("php.archived")}</span>
        `
            : ""
        }
      </div>
    </div>
    <div class="modal-footer" style="margin-top:20px">
      <button class="btn btn-secondary" id="imodal-cancel">${t("common.cancel")}</button>
      <button class="btn btn-primary" id="imodal-btn">${t("common.install")}</button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const select = modal.querySelector("#imodal-select");
  const installBtn = modal.querySelector("#imodal-btn");
  const cancelBtn = modal.querySelector("#imodal-cancel");
  const archived = withArchivedToggle
    ? modal.querySelector("#imodal-archived")
    : null;

  const close = () => overlay.remove();

  async function loadVersions() {
    select.innerHTML = `<option>${t("common.loading")}</option>`;
    installBtn.disabled = true;
    const versions = await loadVersionsFn(archived?.checked || false);
    if (!versions || versions.length === 0) {
      select.innerHTML = `<option>${t("common.all_installed")}</option>`;
      return;
    }
    select.innerHTML = versions
      .map((v) => `<option value="${v}">${v}</option>`)
      .join("");
    installBtn.disabled = false;
  }

  async function doInstall() {
    const version = select.value;
    if (!version || !select.options[select.selectedIndex]?.value) return;

    // Close modal immediately — download continues in the sidebar widget
    close();

    startDownload(eventName, serviceName ? `${serviceName} ${version}` : version);

    const result = await installFn(version);
    const ok = typeof result === "string" ? result === "" : result;
    const errMsg = typeof result === "string" && result !== "" ? result : null;

    if (!ok) {
      errorDownload(eventName, errMsg || t("common.install_error"));
      return;
    }

    finishDownload(eventName);

    if (onInstalled) await onInstalled(version);
  }

  if (archived) archived.addEventListener("change", loadVersions);
  installBtn.addEventListener("click", doInstall);
  cancelBtn.addEventListener("click", close);

  const onKey = (e) => {
    if (e.key === "Escape") {
      close();
      document.removeEventListener("keydown", onKey);
    }
  };
  document.addEventListener("keydown", onKey);

  loadVersions();
}

/**
 * Runs a download/install flow and returns result if successful, null on failure.
 * @param {{ selectId, progressId, barId, labelId, btnId, eventName, downloadFn }} config
 * @returns {Promise<{version, bar, label, btn, progress} | null>}
 */
export async function runInstall({
  selectId,
  progressId,
  barId,
  labelId,
  sizeId,
  btnId,
  eventName,
  downloadFn,
  serviceName = "",
}) {
  const select = document.getElementById(selectId);
  const version = select?.value;
  if (!version || !select.options[select.selectedIndex]?.value) return null;

  const progress = document.getElementById(progressId);
  const bar = document.getElementById(barId);
  const label = document.getElementById(labelId);
  const sizeLabel = sizeId ? document.getElementById(sizeId) : null;
  const btn = document.getElementById(btnId);
  if (!progress || !bar || !label || !btn) return null;

  progress.style.display = "block";
  bar.style.width = "0%";
  bar.style.opacity = "";
  label.textContent = "0%";
  if (sizeLabel) sizeLabel.textContent = "";
  btn.disabled = true;
  btn.textContent = t("common.installing");

  startDownload(eventName, serviceName ? `${serviceName} ${version}` : version);

  EventsOn(eventName, ({ percent, totalMB }) => {
    if (percent >= 0) {
      bar.style.width = percent + "%";
      bar.style.opacity = "";
      label.textContent = percent + "%";
      if (sizeLabel && totalMB > 0) {
        const doneMB = (percent / 100 * totalMB).toFixed(1);
        sizeLabel.textContent = `${doneMB} / ${totalMB.toFixed(1)} MB`;
      }
    } else {
      bar.style.width = "100%";
      bar.style.opacity = "0.4";
      label.textContent = totalMB > 0 ? `${totalMB.toFixed(1)} MB` : "…";
      if (sizeLabel) sizeLabel.textContent = "";
    }
  });

  const result = await downloadFn(version);

  // result is either bool (nginx/redis) or string (php: "" = ok, message = error)
  const ok = typeof result === "string" ? result === "" : result;
  const errMsg = typeof result === "string" && result !== "" ? result : null;

  if (!ok) {
    errorDownload(eventName, errMsg || t("common.install_error"));
    label.textContent = errMsg || t("common.install_error");
    label.title = errMsg || "";
    label.style.color = "var(--danger)";
    btn.disabled = false;
    btn.textContent = t("common.install");
    return null;
  }

  finishDownload(eventName);

  label.style.color = "";
  label.title = "";
  label.textContent = t("common.install_success");
  return { version, bar, label, btn, progress };
}

export function resetInstallUI({ bar, label, btn, progress }) {
  bar.style.width = "0%";
  label.textContent = "0%";
  progress.style.display = "none";
  btn.disabled = false;
  btn.textContent = t("common.install");
}
