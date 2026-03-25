import {
  DeleteRedisVersion,
  DownloadRedis,
  ExecRedisCommand,
  GetRedisActiveVersion,
  GetRedisAvailableVersions,
  GetRedisInstalledVersions,
  IsRedisRunning,
  RestartRedis,
  SetRedisActiveVersion,
  StartRedis,
  StopRedis,
  GetLogs,
  ClearLog,
} from "../../wailsjs/go/main/App";
import { alert, confirm } from "./modal.js";
import { addListener, pollUntilStopped } from "./utils.js";
import { runInstall, openInstallModal } from "./installer.js";
import { t } from "./i18n.js";
import { createIcons, icons } from "lucide";

let isActivating = false;
let isDeleting = false;
const installingVersions = new Set();
let redisLogInterval = null;

async function loadRedisPage() {
  const installed = await GetRedisInstalledVersions();
  const active = await GetRedisActiveVersion();

  if (installed.length === 0) {
    document.getElementById("redis-not-installed").style.display = "block";
    document.getElementById("redis-installed").style.display = "none";
    await loadAvailableVersions("redis-available-versions");
  } else {
    document.getElementById("redis-not-installed").style.display = "none";
    document.getElementById("redis-installed").style.display = "flex";
    renderInstalledVersions(installed, active);
    await updateRedisStatus();
  }

  addListener("redis-install-btn", onInstall);

  addListener("redis-add-btn", () =>
    openInstallModal({
      title: `◉ ${t("common.install_new")}`,
      serviceName: "Redis",
      accentColor: "var(--redis)",
      loadVersionsFn: async () => {
        const [available, installed] = await Promise.all([
          GetRedisAvailableVersions(),
          GetRedisInstalledVersions(),
        ]);
        return available.filter((v) => !installed.includes(v) && !installingVersions.has(v));
      },
      installFn: async (version) => {
        installingVersions.add(version);
        const result = await DownloadRedis(version);
        if (!result) installingVersions.delete(version);
        return result;
      },
      eventName: (version) => `redis:download-progress:${version}`,
      onInstalled: async (version) => {
        installingVersions.delete(version);
        const [installed, active] = await Promise.all([
          GetRedisInstalledVersions(),
          GetRedisActiveVersion(),
        ]);
        renderInstalledVersions(installed, active);
      },
    }),
  );

  addListener("redis-start-btn", async () => {
    const btn = document.getElementById("redis-start-btn");
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span> ${t("common.starting")}`;
    await StartRedis();
    await updateRedisStatus();
  });

  addListener("redis-stop-btn", async () => {
    const btn = document.getElementById("redis-stop-btn");
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span> ${t("common.stopping")}`;
    await StopRedis();
    await pollUntilStopped(IsRedisRunning);
    await updateRedisStatus();
  });

  addListener("redis-restart-btn", async () => {
    const btn = document.getElementById("redis-restart-btn");
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span> ${t("common.restarting")}`;
    await RestartRedis();
    await updateRedisStatus();
  });
}

async function loadAvailableVersions(selectId) {
  const select = document.getElementById(selectId);
  select.innerHTML = `<option>${t("common.loading")}</option>`;

  const [available, installed] = await Promise.all([
    GetRedisAvailableVersions(),
    GetRedisInstalledVersions(),
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
  const list = document.getElementById("redis-versions-list");
  list.innerHTML = "";

  document.getElementById("redis-active-version").textContent =
    active || t("common.not_configured");

  const sorted = [...installed].sort((a, b) => {
    if (a === active) return -1;
    if (b === active) return 1;
    return b.localeCompare(a, undefined, { numeric: true });
  });

  list.innerHTML = sorted
    .map((v) => {
      const isActive = v === active;
      return `
            <div class="version-item">
                <div class="version-row">
                    <span class="version-badge" style="color:var(--redis);border-color:rgba(220,56,44,0.25)">${v}</span>
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
    })
    .join("");

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

async function updateRedisStatus() {
  const running = await IsRedisRunning();
  const dot = document.getElementById("redis-status-dot");
  const startBtn = document.getElementById("redis-start-btn");
  const stopBtn = document.getElementById("redis-stop-btn");
  const restartBtn = document.getElementById("redis-restart-btn");

  if (dot) dot.style.background = running ? "var(--good)" : "var(--danger)";
  if (startBtn) {
    startBtn.style.display = running ? "none" : "inline-flex";
    startBtn.disabled = false;
    startBtn.textContent = "▷ Start";
  }
  if (stopBtn) {
    stopBtn.style.display = running ? "inline-flex" : "none";
    stopBtn.disabled = false;
    stopBtn.textContent = "◼ Stop";
  }
  if (restartBtn) {
    restartBtn.style.display = running ? "inline-flex" : "none";
    restartBtn.disabled = false;
    restartBtn.textContent = "↺ Restart";
  }
}

async function onInstall() {
  const result = await runInstall({
    selectId: "redis-available-versions",
    progressId: "redis-progress-first",
    barId: "redis-progress-bar-first",
    labelId: "redis-progress-label-first",
    sizeId: "redis-progress-size-first",
    btnId: "redis-install-btn",
    eventName: "redis:download-progress",
    downloadFn: DownloadRedis,
    serviceName: "Redis",
  });
  if (result) {
    await SetRedisActiveVersion(result.version);
    await loadRedisPage();
  }
}

async function activateRedisVersion(version, btn) {
  if (isActivating) return;
  isActivating = true;
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span>`;

  try {
    const running = await IsRedisRunning();
    if (running) {
      const ok = await confirm(
        t("redis.change_version"),
        t("redis.change_confirm", { version }),
      );
      if (!ok) return;
      await StopRedis();
      await pollUntilStopped(IsRedisRunning);
    }

    await SetRedisActiveVersion(version);
    const installed = await GetRedisInstalledVersions();
    renderInstalledVersions(installed, version);
    await updateRedisStatus();
  } finally {
    isActivating = false;
    if (document.contains(btn)) {
      btn.disabled = false;
      btn.textContent = t("common.activate");
    }
  }
}

async function deleteRedisVersion(version, btn) {
  if (isDeleting) return;
  isDeleting = true;
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span>`;

  try {
    const ok = await confirm(
      t("redis.delete_title"),
      t("redis.delete_confirm", { version }),
    );
    if (!ok) return;

    const active = await GetRedisActiveVersion();
    const result = await DeleteRedisVersion(version);
    if (result) {
      const installed = await GetRedisInstalledVersions();
      renderInstalledVersions(installed, active);
    }
  } finally {
    isDeleting = false;
    if (document.contains(btn)) {
      btn.disabled = false;
      btn.textContent = t("common.delete");
    }
  }
}

function initCommandsPanel() {
  const toggle = document.getElementById("redis-cmd-toggle");
  const body = document.getElementById("redis-cmd-body");
  const chevron = document.getElementById("redis-cmd-chevron");

  toggle?.addEventListener("click", () => {
    const open = body.style.display === "none";
    body.style.display = open ? "block" : "none";
    if (chevron) chevron.style.transform = open ? "rotate(180deg)" : "";
  });

  // Quick action buttons
  body?.querySelectorAll("button[data-cmd]").forEach((btn) => {
    btn.addEventListener("click", () => runRedisCmd(btn.dataset.cmd));
  });

  // FLUSHDB with confirmation
  document.getElementById("redis-quick-flush")?.addEventListener("click", async () => {
    const ok = await confirm(t("redis.flush_title"), t("redis.flush_confirm"), "danger");
    if (!ok) return;
    runRedisCmd("FLUSHDB");
  });

  // Custom command input
  const input = document.getElementById("redis-cmd-input");
  const runBtn = document.getElementById("redis-cmd-run");
  input?.setAttribute("placeholder", t("redis.cmd_placeholder"));

  runBtn?.addEventListener("click", () => {
    const cmd = input?.value.trim();
    if (cmd) runRedisCmd(cmd);
  });

  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const cmd = input.value.trim();
      if (cmd) runRedisCmd(cmd);
    }
  });
}

async function runRedisCmd(cmd) {
  const output = document.getElementById("redis-cmd-output");
  if (!output) return;
  output.textContent = "...";
  const result = await ExecRedisCommand(cmd);
  output.textContent = result || t("redis.output_empty");
}

export function init() {
  const list = document.getElementById("redis-versions-list");
  if (list) {
    list.addEventListener("click", async (e) => {
      const btn = e.target.closest("button[data-action]");
      if (!btn) return;
      const { action, version } = btn.dataset;
      if (action === "activate") await activateRedisVersion(version, btn);
      else if (action === "delete") await deleteRedisVersion(version, btn);
    });
  }

  loadRedisPage();
  initCommandsPanel();

  let redisLogLoaded = false;

  document
    .getElementById("redis-log-toggle")
    ?.addEventListener("click", (e) => {
      if (
        e.target.closest("button") ||
        e.target.closest("input") ||
        e.target.closest(".log-auto-label")
      )
        return;
      const body = document.getElementById("redis-log-body");
      const chevron = document.getElementById("redis-log-chevron");
      const autoLabel = document.getElementById("redis-log-auto-label");
      const autoCheck = document.getElementById("redis-log-auto-check");
      const refreshBtn = document.getElementById("redis-log-refresh-btn");
      const clearBtn = document.getElementById("redis-log-clear-btn");
      const open = body.style.display === "none";
      body.style.display = open ? "block" : "none";
      chevron.style.transform = open ? "rotate(180deg)" : "";
      autoLabel.style.display = open ? "flex" : "none";
      refreshBtn.style.display = open ? "inline-flex" : "none";
      clearBtn.style.display = open ? "inline-flex" : "none";
      if (!open) {
        // Stop auto-refresh when panel closes
        autoCheck.checked = false;
        clearInterval(redisLogInterval);
        redisLogInterval = null;
      }
      if (open && !redisLogLoaded) {
        redisLogLoaded = true;
        loadRedisLog();
      }
    });

  document
    .getElementById("redis-log-auto-check")
    ?.addEventListener("change", (e) => {
      if (e.target.checked) {
        redisLogInterval = setInterval(loadRedisLog, 2000);
      } else {
        clearInterval(redisLogInterval);
        redisLogInterval = null;
      }
    });

  addListener("redis-log-refresh-btn", loadRedisLog);

  addListener("redis-log-clear-btn", async () => {
    const ok = await confirm(
      t("logs.clear_title"),
      t("logs.clear_confirm"),
      "warn",
    );
    if (!ok) return;
    const active = await GetRedisActiveVersion();
    if (active) await ClearLog(`redis:${active}`);
    await loadRedisLog();
  });

  createIcons({ icons });
}

async function loadRedisLog() {
  const el = document.getElementById("redis-log-content");
  if (!el) return;
  const active = await GetRedisActiveVersion();
  if (!active) {
    el.innerHTML = `<span style="color:var(--text3)">${t("logs.empty")}</span>`;
    return;
  }
  const lines = await GetLogs(`redis:${active}`, 200);
  if (!lines || lines.length === 0) {
    el.innerHTML = `<span style="color:var(--text3)">${t("logs.empty")}</span>`;
    return;
  }
  el.textContent = lines.join("\n");
  el.scrollTop = el.scrollHeight;
}
