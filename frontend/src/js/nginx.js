import {
  DeleteNginxVersion,
  DownloadNginx,
  GetNginxActiveVersion,
  GetNginxAvailableVersions,
  GetNginxInstalledVersions,
  IsNginxRunning,
  RestartNginx,
  SetNginxActiveVersion,
  StartNginx,
  StopNginx,
  GetLogs,
  ClearLog,
} from "../../wailsjs/go/main/App";
import { alert, confirm } from "./modal.js";
import { addListener } from "./utils.js";
import { runInstall, openInstallModal } from "./installer.js";
import { t } from "./i18n.js";
import { createIcons, icons } from "lucide";

let currentNginxLogType = "error";

let isActivating = false;
let isDeleting = false;

async function loadNginxPage() {
  const installed = await GetNginxInstalledVersions();
  const active = await GetNginxActiveVersion();

  if (installed.length === 0) {
    document.getElementById("nginx-not-installed").style.display = "block";
    document.getElementById("nginx-installed").style.display = "none";
    await loadAvailableVersions("nginx-available-versions");
  } else {
    document.getElementById("nginx-not-installed").style.display = "none";
    document.getElementById("nginx-installed").style.display = "flex";
    renderInstalledVersions(installed, active);
    await updateNginxStatus();
  }

  addListener("nginx-install-btn", onInstall);

  addListener("nginx-add-btn", () =>
    openInstallModal({
      title: `◎ ${t("common.install_new")}`,
      accentColor: "var(--nginx)",
      loadVersionsFn: async () => {
        const [available, installed] = await Promise.all([
          GetNginxAvailableVersions(),
          GetNginxInstalledVersions(),
        ]);
        return available.filter((v) => !installed.includes(v));
      },
      installFn: DownloadNginx,
      eventName: "nginx:download-progress",
      onInstalled: async () => {
        const [installed, active] = await Promise.all([
          GetNginxInstalledVersions(),
          GetNginxActiveVersion(),
        ]);
        renderInstalledVersions(installed, active);
      },
    }),
  );

  addListener("nginx-start-btn", async () => {
    const btn = document.getElementById("nginx-start-btn");
    setButtonLoading(btn, t("common.starting"));
    const errMsg = await StartNginx();
    resetButton(btn);
    if (!errMsg) await updateNginxStatus();
    else await alert(t("common.error"), errMsg, "danger");
  });

  addListener("nginx-stop-btn", async () => {
    const btn = document.getElementById("nginx-stop-btn");
    setButtonLoading(btn, t("common.stopping"));
    const ok = await StopNginx();
    resetButton(btn);
    if (ok) await updateNginxStatus();
    else await alert(t("common.error"), t("nginx.stop_error"), "danger");
  });

  addListener("nginx-restart-btn", async () => {
    const btn = document.getElementById("nginx-restart-btn");
    setButtonLoading(btn, t("common.restarting"));
    const errMsg = await RestartNginx();
    resetButton(btn);
    if (!errMsg) await updateNginxStatus();
    else await alert(t("common.error"), errMsg, "danger");
  });
}

async function loadAvailableVersions(selectId) {
  const select = document.getElementById(selectId);
  select.innerHTML = `<option>${t("common.loading")}</option>`;

  const [available, installed] = await Promise.all([
    GetNginxAvailableVersions(),
    GetNginxInstalledVersions(),
  ]);

  const filtered = available.filter((v) => !installed.includes(v));

  if (filtered.length === 0) {
    select.innerHTML = `<option>${t("common.all_installed")}</option>`;
    return;
  }

  select.innerHTML = filtered
    .map((v) => `<option value="${v}">${v}</option>`)
    .join("");
}

function renderInstalledVersions(installed, active) {
  const list = document.getElementById("nginx-versions-list");
  list.innerHTML = "";

  document.getElementById("nginx-active-version").textContent =
    active || t("common.not_configured");

  const sorted = [...installed].sort((a, b) => {
    if (a === active) return -1;
    if (b === active) return 1;
    return b.localeCompare(a, undefined, { numeric: true });
  });

  const parts = sorted.map((v) => {
    const isActive = v === active;
    return `
            <div class="version-item">
                <div class="version-row">
                    <span class="version-badge">${v}</span>
                </div>
                <div class="version-actions">
                    ${
                      isActive
                        ? '<span class="tag tag-default">ACTIV</span>'
                        : `<button class="btn btn-secondary" data-action="activate" data-version="${v}">${t("common.activate")}</button>`
                    }
                    ${
                      !isActive
                        ? `<button class="btn btn-danger" data-action="delete" data-version="${v}">${t("common.delete")}</button>`
                        : ""
                    }
                </div>
            </div>
        `;
  });
  list.innerHTML = parts.join("");

  setTimeout(() => {
    const items = document.querySelectorAll(".version-item");
    items.forEach((item) => {
      const badge = item.querySelector(".version-badge");
      if (badge && badge.textContent === active) {
        item.classList.add("highlight");
      }
    });
  }, 50);
}

async function updateNginxStatus() {
  const [running, active] = await Promise.all([
    IsNginxRunning(),
    GetNginxActiveVersion(),
  ]);
  const canStart = !!(active && active.trim());

  const dot = document.getElementById("nginx-status-dot");
  const startBtn = document.getElementById("nginx-start-btn");
  const stopBtn = document.getElementById("nginx-stop-btn");
  const restartBtn = document.getElementById("nginx-restart-btn");

  if (dot) dot.style.background = running ? "var(--good)" : "var(--danger)";
  if (startBtn)
    startBtn.style.display = !running && canStart ? "inline-flex" : "none";
  if (stopBtn) stopBtn.style.display = running ? "inline-flex" : "none";
  if (restartBtn) restartBtn.style.display = running ? "inline-flex" : "none";
}

function setButtonLoading(btn, loadingText) {
  btn.disabled = true;
  btn.dataset.original = btn.textContent;
  btn.innerHTML = `<span class="spinner"></span> ${loadingText}`;
}

function resetButton(btn) {
  btn.disabled = false;
  btn.textContent = btn.dataset.original;
}

async function onInstall() {
  const result = await runInstall({
    selectId: "nginx-available-versions",
    progressId: "nginx-progress-first",
    barId: "nginx-progress-bar-first",
    labelId: "nginx-progress-label-first",
    btnId: "nginx-install-btn",
    eventName: "nginx:download-progress",
    downloadFn: DownloadNginx,
  });
  if (result) setTimeout(() => loadNginxPage(), 1000);
}

async function activateNginxVersion(version) {
  if (isActivating) return;
  isActivating = true;

  try {
    const running = await IsNginxRunning();

    if (running) {
      const ok = await confirm(
        t("nginx.change_version"),
        t("nginx.change_confirm", { version }),
      );
      if (!ok) return;
      await StopNginx();
    }

    await SetNginxActiveVersion(version);
    const installed = await GetNginxInstalledVersions();
    renderInstalledVersions(installed, version);
    await updateNginxStatus();
  } finally {
    isActivating = false;
  }
}

async function deleteNginxVersion(version) {
  if (isDeleting) return;
  isDeleting = true;

  try {
    const active = await GetNginxActiveVersion();

    const ok = await confirm(
      t("nginx.delete_title"),
      t("nginx.delete_confirm", { version }),
    );
    if (!ok) return;

    const result = await DeleteNginxVersion(version);
    if (result) {
      const installed = await GetNginxInstalledVersions();
      renderInstalledVersions(installed, active);
    }
  } finally {
    isDeleting = false;
  }
}

async function loadNginxLog() {
  const el = document.getElementById("nginx-log-content");
  if (!el) return;
  const lines = await GetLogs(currentNginxLogType, 200);
  if (!lines || lines.length === 0) {
    el.innerHTML = `<span style="color:var(--text3)">${t("logs.empty")}</span>`;
    return;
  }
  el.textContent = lines.join("\n");
  el.scrollTop = el.scrollHeight;
}

export function init() {
  const list = document.getElementById("nginx-versions-list");
  if (list) {
    list.addEventListener("click", async (e) => {
      const btn = e.target.closest("button[data-action]");
      if (!btn) return;
      const { action, version } = btn.dataset;
      if (action === "activate") await activateNginxVersion(version);
      else if (action === "delete") await deleteNginxVersion(version);
    });
  }

  loadNginxPage();

  let nginxLogLoaded = false;

  document
    .getElementById("nginx-log-toggle")
    ?.addEventListener("click", (e) => {
      if (e.target.closest("button")) return;
      const body = document.getElementById("nginx-log-body");
      const chevron = document.getElementById("nginx-log-chevron");
      const tabSelector = document.getElementById("nginx-log-tab-selector");
      const refreshBtn = document.getElementById("nginx-log-refresh-btn");
      const clearBtn = document.getElementById("nginx-log-clear-btn");
      const open = body.style.display === "none";
      body.style.display = open ? "block" : "none";
      chevron.style.transform = open ? "rotate(180deg)" : "";
      tabSelector.style.display = open ? "flex" : "none";
      refreshBtn.style.display = open ? "inline-flex" : "none";
      clearBtn.style.display = open ? "inline-flex" : "none";
      if (open && !nginxLogLoaded) {
        nginxLogLoaded = true;
        loadNginxLog();
      }
    });

  document
    .getElementById("nginx-log-tab-selector")
    ?.addEventListener("click", (e) => {
      const btn = e.target.closest(".lang-btn[data-log]");
      if (!btn) return;
      currentNginxLogType = btn.dataset.log;
      document
        .querySelectorAll("#nginx-log-tab-selector .lang-btn")
        .forEach((b) => {
          b.classList.toggle("active", b.dataset.log === currentNginxLogType);
        });
      loadNginxLog();
    });

  addListener("nginx-log-refresh-btn", loadNginxLog);

  addListener("nginx-log-clear-btn", async () => {
    const ok = await confirm(
      t("logs.clear_title"),
      t("logs.clear_confirm"),
      "warn",
    );
    if (!ok) return;
    await ClearLog(currentNginxLogType);
    await loadNginxLog();
  });

  createIcons({ icons });
}
