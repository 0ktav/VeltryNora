import { EventsOn } from "../../wailsjs/runtime";
import { t } from "./i18n.js";

/**
 * Opens a reusable install modal with progress bar.
 * After each successful install, the modal resets and reloads available versions.
 * @param {{ title, accentColor, loadVersionsFn, installFn, eventName, onInstalled, withArchivedToggle }} config
 */
export function openInstallModal({
  title,
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
      <div id="imodal-progress" style="display:none;margin-top:12px">
        <div class="progress-wrap">
          <div class="progress-bar" id="imodal-bar" style="width:0%"></div>
        </div>
        <div class="progress-label" id="imodal-label">0%</div>
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
  const progress = modal.querySelector("#imodal-progress");
  const bar = modal.querySelector("#imodal-bar");
  const label = modal.querySelector("#imodal-label");
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

    progress.style.display = "block";
    installBtn.disabled = true;
    installBtn.textContent = t("common.installing");
    cancelBtn.disabled = true;
    bar.style.width = "0%";
    label.style.color = "";
    label.textContent = "0%";

    EventsOn(eventName, (percent) => {
      bar.style.width = percent + "%";
      label.textContent = percent + "%";
    });

    const result = await installFn(version);
    const ok = typeof result === "string" ? result === "" : result;
    const errMsg = typeof result === "string" && result !== "" ? result : null;

    if (!ok) {
      label.textContent = errMsg || t("common.install_error");
      label.style.color = "var(--danger)";
      installBtn.disabled = false;
      installBtn.textContent = t("common.install");
      cancelBtn.disabled = false;
      return;
    }

    label.textContent = t("common.install_success");
    label.style.color = "var(--good)";

    if (onInstalled) await onInstalled(version);

    // Close modal after a short delay so the user sees the success message
    setTimeout(close, 1200);
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
  btnId,
  eventName,
  downloadFn,
}) {
  const select = document.getElementById(selectId);
  const version = select?.value;
  if (!version || !select.options[select.selectedIndex]?.value) return null;

  const progress = document.getElementById(progressId);
  const bar = document.getElementById(barId);
  const label = document.getElementById(labelId);
  const btn = document.getElementById(btnId);
  if (!progress || !bar || !label || !btn) return null;

  progress.style.display = "block";
  btn.disabled = true;
  btn.textContent = t("common.installing");

  EventsOn(eventName, (percent) => {
    bar.style.width = percent + "%";
    label.textContent = percent + "%";
  });

  const result = await downloadFn(version);

  // result is either bool (nginx/redis) or string (php: "" = ok, message = error)
  const ok = typeof result === "string" ? result === "" : result;
  const errMsg = typeof result === "string" && result !== "" ? result : null;

  if (!ok) {
    label.textContent = errMsg || t("common.install_error");
    label.title = errMsg || "";
    label.style.color = "var(--danger)";
    btn.disabled = false;
    btn.textContent = t("common.install");
    return null;
  }

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
