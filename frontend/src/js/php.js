import {
  DeletePHPVersion,
  DownloadPHP,
  GetPHPAvailableVersions,
  GetPHPArchivedVersions,
  GetPHPInstalledVersions,
  IsPHPRunning,
  StartPHP,
  StopPHP,
  GetPHPConfig,
  SavePHPConfig,
  OpenPHPIni,
  GetPHPExtensions,
  SavePHPExtensions,
  GetLogs,
  ClearLog,
  GetBasePath,
  OpenFolder,
} from "../../wailsjs/go/main/App";
import { confirm } from "./modal.js";
import { addListener, escapeHtml, pollUntilStopped, pollUntilStarted } from "./utils.js";
import { runInstall, openInstallModal } from "./installer.js";
import { t } from "./i18n.js";
import { createIcons, icons } from "lucide";

let isStartingPHP = false;
let isStoppingPHP = false;
let isDeletingPHP = false;
const installingVersions = new Set();

async function loadPHPPage() {
  const installed = await GetPHPInstalledVersions();

  const notInstalled = document.getElementById("php-not-installed");
  const installedSection = document.getElementById("php-installed-section");

  if (!notInstalled || !installedSection) return;

  if (installed.length === 0) {
    notInstalled.style.display = "block";
    installedSection.style.display = "none";
    await loadAvailableVersions("php-available-versions");
  } else {
    notInstalled.style.display = "none";
    installedSection.style.display = "flex";
    await renderInstalledVersions(installed);
  }

  addListener("php-install-btn", onInstall);

  document
    .getElementById("php-archived-toggle")
    ?.addEventListener("change", (e) => {
      loadAvailableVersions("php-available-versions", e.target.checked);
    });

  addListener("php-add-btn", () =>
    openInstallModal({
      title: `⬡ ${t("common.install_new")}`,
      serviceName: "PHP",
      accentColor: "var(--php)",
      withArchivedToggle: true,
      loadVersionsFn: async (archived) => {
        if (archived) return await GetPHPArchivedVersions();
        const [available, inst] = await Promise.all([
          GetPHPAvailableVersions(),
          GetPHPInstalledVersions(),
        ]);
        const installedMinors = new Set(
          inst.map((v) => v.split(".").slice(0, 2).join(".")),
        );
        const installingMinors = new Set(
          [...installingVersions].map((v) => v.split(".").slice(0, 2).join(".")),
        );
        return available.filter((v) => {
          const minor = v.split(".").slice(0, 2).join(".");
          return !installedMinors.has(minor) && !installingMinors.has(minor);
        });
      },
      installFn: async (version) => {
        installingVersions.add(version);
        const result = await DownloadPHP(version);
        const ok = typeof result === "string" ? result === "" : result;
        if (!ok) installingVersions.delete(version);
        return result;
      },
      eventName: (version) => `php:download-progress:${version}`,
      onInstalled: async (version) => {
        installingVersions.delete(version);
        const inst = await GetPHPInstalledVersions();
        await renderInstalledVersions(inst);
      },
    }),
  );
}

async function loadAvailableVersions(selectId, archived = false) {
  const select = document.getElementById(selectId);
  select.innerHTML = `<option>${t("common.loading")}</option>`;

  const versions = archived
    ? await GetPHPArchivedVersions()
    : await (async () => {
        const [available, installed] = await Promise.all([
          GetPHPAvailableVersions(),
          GetPHPInstalledVersions(),
        ]);
        const installedMinors = new Set(
          installed.map((v) => v.split(".").slice(0, 2).join(".")),
        );
        return available.filter((v) => {
          const minor = v.split(".").slice(0, 2).join(".");
          return !installedMinors.has(minor);
        });
      })();

  if (versions.length === 0) {
    select.innerHTML = `<option>${t("common.all_installed")}</option>`;
    return;
  }

  versions.sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
  select.innerHTML = versions
    .map((v) => `<option value="${v}">${v}</option>`)
    .join("");
}

async function renderInstalledVersions(installed) {
  const list = document.getElementById("php-versions-list");
  list.innerHTML = "";

  const sorted = [...installed].sort((a, b) =>
    b.localeCompare(a, undefined, { numeric: true }),
  );

  const parts = [];
  for (const v of sorted) {
    const running = await IsPHPRunning(v);
    const port = versionToPort(v);
    const statusDot = running
      ? '<span class="dot-pulse"></span>'
      : '<span class="dot-inactive"></span>';

    parts.push(`
            <div class="version-item-wrap" data-version="${v}">
              <div class="version-item">
                <div class="version-row">
                    <span class="version-badge" style="color:var(--php);border-color:rgba(136,146,191,0.25)">${v}</span>
                    <span class="site-meta" style="color:var(--text3)">:${port}</span>
                </div>
                <div class="version-actions">
                    ${statusDot}
                    ${
                      running
                        ? `<button class="btn btn-warning btn-icon" data-action="stop" data-version="${v}" title="${t("common.stopping")}"><i data-lucide="square"></i></button>`
                        : `<button class="btn btn-secondary btn-icon" data-action="start" data-version="${v}" title="${t("common.starting")}"><i data-lucide="play"></i></button>`
                    }
                    <button class="btn btn-secondary btn-icon" data-action="config" data-version="${v}" title="${t("php.config")}"><i data-lucide="settings"></i></button>
                    <button class="btn btn-secondary btn-icon" data-action="ini" data-version="${v}" title="php.ini"><i data-lucide="file-code"></i></button>
                    <button class="btn btn-secondary btn-icon" data-action="log" data-version="${v}" title="${t("nav.logs")}"><i data-lucide="scroll-text"></i></button>
                    ${
                      !running
                        ? `<button class="btn btn-danger btn-icon" data-action="delete" data-version="${v}" title="${t("common.delete")}"><i data-lucide="trash-2"></i></button>`
                        : ""
                    }
                </div>
              </div>
              <div class="php-config-panel" id="php-config-${v}" style="display:none"></div>
              <div class="php-config-panel" id="php-ini-${v}" style="display:none"></div>
              <div class="php-config-panel" id="php-log-${v}" style="display:none"></div>
            </div>
        `);
  }
  list.innerHTML = parts.join("");
  setTimeout(() => createIcons({ icons }), 0);
}

function versionToPort(version) {
  const parts = version.split(".");
  if (parts.length >= 2) {
    return 9000 + parseInt(parts[0]) * 10 + parseInt(parts[1]);
  }
  return 9000;
}

async function onInstall() {
  const result = await runInstall({
    selectId: "php-available-versions",
    progressId: "php-progress-first",
    barId: "php-progress-bar-first",
    labelId: "php-progress-label-first",
    sizeId: "php-progress-size-first",
    btnId: "php-install-btn",
    eventName: "php:download-progress",
    downloadFn: DownloadPHP,
    serviceName: "PHP",
  });
  if (result) await loadPHPPage();
}

async function startPHP(btn, version) {
  if (isStartingPHP) return;
  isStartingPHP = true;
  try {
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span>`;
    await StartPHP(version);
    await pollUntilStarted(() => IsPHPRunning(version));
    const installed = await GetPHPInstalledVersions();
    await renderInstalledVersions(installed);
  } finally {
    isStartingPHP = false;
  }
}

async function stopPHP(btn, version) {
  if (isStoppingPHP) return;
  isStoppingPHP = true;
  try {
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span>`;
    await StopPHP(version);
    await pollUntilStopped(() => IsPHPRunning(version));
    const installed = await GetPHPInstalledVersions();
    await renderInstalledVersions(installed);
  } finally {
    isStoppingPHP = false;
  }
}

async function deletePHP(version, btn) {
  if (isDeletingPHP) return;
  isDeletingPHP = true;
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span>`;

  try {
    const ok = await confirm(
      t("php.delete_title"),
      t("php.delete_confirm", { version }),
    );
    if (!ok) return;

    const result = await DeletePHPVersion(version);
    if (result) {
      const installed = await GetPHPInstalledVersions();
      await renderInstalledVersions(installed);
    }
  } finally {
    isDeletingPHP = false;
    if (document.contains(btn)) {
      btn.disabled = false;
      btn.innerHTML = `<i data-lucide="trash-2"></i>`;
      createIcons({ icons });
    }
  }
}

async function openConfigPanel(version) {
  const panel = document.getElementById(`php-config-${version}`);
  if (!panel) return;

  if (panel.style.display !== "none") {
    panel.style.display = "none";
    return;
  }

  panel.innerHTML = `<div style="padding:12px;color:var(--text3);font-size:12px">${t("common.loading")}</div>`;
  panel.style.display = "block";

  const cfg = await GetPHPConfig(version);

  const memOpts = ["64M", "128M", "256M", "512M", "1G"]
    .map(
      (v) =>
        `<option value="${v}" ${cfg.memory_limit === v ? "selected" : ""}>${v}</option>`,
    )
    .join("");
  const postOpts = ["8M", "16M", "32M", "64M", "128M", "256M"]
    .map(
      (v) =>
        `<option value="${v}" ${cfg.post_max_size === v ? "selected" : ""}>${v}</option>`,
    )
    .join("");
  const uploadOpts = ["2M", "8M", "16M", "32M", "64M", "128M", "256M"]
    .map(
      (v) =>
        `<option value="${v}" ${cfg.upload_max_filesize === v ? "selected" : ""}>${v}</option>`,
    )
    .join("");

  panel.innerHTML = `
    <div class="php-config-body">
      <div class="php-config-grid">
        <div class="php-config-field">
          <label class="form-label" data-i18n="php.memory_limit">${t("php.memory_limit")}</label>
          <select class="select php-cfg-input" data-key="memory_limit">${memOpts}</select>
        </div>
        <div class="php-config-field">
          <label class="form-label" data-i18n="php.post_max_size">${t("php.post_max_size")}</label>
          <select class="select php-cfg-input" data-key="post_max_size">${postOpts}</select>
        </div>
        <div class="php-config-field">
          <label class="form-label" data-i18n="php.upload_max">${t("php.upload_max")}</label>
          <select class="select php-cfg-input" data-key="upload_max_filesize">${uploadOpts}</select>
        </div>
        <div class="php-config-field">
          <label class="form-label" data-i18n="php.max_exec_time">${t("php.max_exec_time")}</label>
          <input type="number" class="input php-cfg-input" data-key="max_execution_time" value="${cfg.max_execution_time}" min="0" max="600" style="width:80px;text-align:center" />
        </div>
      </div>
      <div class="settings-row" style="padding:8px 0 0 0;border-top:none">
        <div class="settings-label">
          <div class="settings-label-title" style="font-size:12px" data-i18n="php.display_errors">${t("php.display_errors")}</div>
        </div>
        <div class="settings-control">
          <label class="toggle">
            <input type="checkbox" class="php-cfg-checkbox" data-key="display_errors" ${cfg.display_errors ? "checked" : ""} />
            <span class="toggle-track"></span>
            <span class="toggle-thumb"></span>
          </label>
        </div>
      </div>
      <div style="display:flex;justify-content:flex-end;margin-top:12px">
        <button class="btn btn-primary" id="php-cfg-save-${version}" data-version="${version}">${t("php.save_restart")}</button>
      </div>
    </div>
  `;

  document
    .getElementById(`php-cfg-save-${version}`)
    ?.addEventListener("click", async () => {
      const newCfg = {
        memory_limit: panel.querySelector('[data-key="memory_limit"]').value,
        post_max_size: panel.querySelector('[data-key="post_max_size"]').value,
        upload_max_filesize: panel.querySelector(
          '[data-key="upload_max_filesize"]',
        ).value,
        max_execution_time: panel.querySelector(
          '[data-key="max_execution_time"]',
        ).value,
        display_errors: panel.querySelector('[data-key="display_errors"]')
          .checked,
      };
      const ok = await SavePHPConfig(version, newCfg);
      if (ok) {
        await StopPHP(version);
        await pollUntilStopped(() => IsPHPRunning(version));
        await StartPHP(version);
        panel.style.display = "none";
        const installed = await GetPHPInstalledVersions();
        await renderInstalledVersions(installed);
      }
    });
}

async function openLogPanel(version) {
  const panel = document.getElementById(`php-log-${version}`);
  if (!panel) return;

  if (panel.style.display !== "none") {
    panel.style.display = "none";
    return;
  }

  panel.style.display = "block";
  await refreshLogPanel(panel, version);
}

async function refreshLogPanel(panel, version) {
  panel.innerHTML = `<div style="padding:12px;color:var(--text3);font-size:12px">${t("common.loading")}</div>`;

  const port = versionToPort(version);
  const [phpLines, nginxErrors] = await Promise.all([
    GetLogs(`php:${version}`, 200),
    GetLogs("error", 500),
  ]);

  const fastcgiLines = (nginxErrors || []).filter(
    (line) => line.includes("FastCGI") && line.includes(`:${port}`),
  );

  panel.innerHTML = `
    <div class="php-config-body">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span style="font-size:12px;color:var(--text3)">php.log</span>
        <div style="display:flex;gap:6px">
          <button class="btn btn-secondary btn-icon php-log-refresh" data-version="${version}"><i data-lucide="refresh-cw"></i></button>
          <button class="btn btn-danger btn-icon php-log-clear" data-version="${version}"><i data-lucide="trash-2"></i></button>
        </div>
      </div>
      <pre class="log-viewer">${phpLines && phpLines.length > 0 ? escapeHtml(phpLines.join("\n")) : `<span style="color:var(--text3)">${t("logs.empty")}</span>`}</pre>
      <div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--border)">
        <span style="font-size:12px;color:var(--text3)">${t("php.fastcgi_errors")}</span>
        <pre class="log-viewer" style="margin-top:6px">${fastcgiLines.length > 0 ? escapeHtml(fastcgiLines.join("\n")) : `<span style="color:var(--text3)">${t("php.fastcgi_no_errors")}</span>`}</pre>
      </div>
    </div>
  `;
  setTimeout(() => createIcons({ icons }), 0);

  panel
    .querySelector(".php-log-refresh")
    ?.addEventListener("click", () => refreshLogPanel(panel, version));
  panel.querySelector(".php-log-clear")?.addEventListener("click", async () => {
    const ok = await confirm(
      t("logs.clear_title"),
      t("logs.clear_confirm"),
      "warn",
    );
    if (!ok) return;
    await ClearLog(`php:${version}`);
    await refreshLogPanel(panel, version);
  });
}

async function openIniPanel(version) {
  const panel = document.getElementById(`php-ini-${version}`);
  if (!panel) return;

  if (panel.style.display !== "none") {
    panel.style.display = "none";
    return;
  }

  panel.innerHTML = `<div style="padding:12px;color:var(--text3);font-size:12px">${t("common.loading")}</div>`;
  panel.style.display = "block";

  const [extensions, basePath] = await Promise.all([
    GetPHPExtensions(version),
    GetBasePath(),
  ]);

  const cells = extensions
    .map(
      (ext) => `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;padding:5px 8px;background:var(--bg2);border-radius:6px;border:1px solid var(--border)">
      <span style="font-family:var(--font-mono);font-size:11px;color:var(--text2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0">${ext.name}</span>
      <label class="toggle" style="flex-shrink:0">
        <input type="checkbox" class="php-ext-toggle" data-ext="${ext.name}" ${ext.enabled ? "checked" : ""}/>
        <span class="toggle-track"></span>
        <span class="toggle-thumb"></span>
      </label>
    </div>
  `,
    )
    .join("");

  const extFolderPath = basePath + "\\php\\" + version + "\\ext";

  panel.innerHTML = `
    <div class="php-config-body">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <span style="font-size:13px;font-weight:600;color:var(--text)">${t("php.ini_extensions")}</span>
        <div style="display:flex;gap:6px">
          <button id="php-ext-folder-${version}" class="btn btn-secondary" style="font-size:12px;padding:0 10px;height:28px;display:flex;align-items:center;gap:5px"><i data-lucide="folder-open" style="width:13px;height:13px"></i>${t("php.ext_open_folder")}</button>
          <button id="php-ini-notepad-${version}" class="btn btn-secondary" style="font-size:12px;padding:0 10px;height:28px">${t("php.ini_open_notepad")}</button>
        </div>
      </div>
      <div style="font-size:11px;color:var(--text3);margin-bottom:10px">${t("php.ext_folder_hint")}</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px">${cells}</div>
      <div style="display:flex;justify-content:flex-end;margin-top:12px">
        <button class="btn btn-primary" id="php-ext-save-${version}">${t("common.save")}</button>
      </div>
    </div>
  `;

  setTimeout(() => createIcons({ icons }), 0);

  document
    .getElementById(`php-ext-folder-${version}`)
    .addEventListener("click", () => {
      OpenFolder(extFolderPath);
    });

  document
    .getElementById(`php-ini-notepad-${version}`)
    .addEventListener("click", () => {
      OpenPHPIni(version);
    });

  document
    .getElementById(`php-ext-save-${version}`)
    .addEventListener("click", async () => {
      const btn = document.getElementById(`php-ext-save-${version}`);
      btn.disabled = true;
      const enabled = [
        ...panel.querySelectorAll(".php-ext-toggle:checked"),
      ].map((cb) => cb.dataset.ext);
      const ok = await SavePHPExtensions(version, enabled);
      if (ok) {
        btn.textContent = t("common.saved");
        btn.classList.replace("btn-primary", "btn-secondary");
        setTimeout(() => {
          panel.style.display = "none";
        }, 800);
      } else {
        btn.disabled = false;
      }
    });
}

export function init() {
  const list = document.getElementById("php-versions-list");
  if (list) {
    list.addEventListener("click", async (e) => {
      const btn = e.target.closest("button[data-action]");
      if (!btn) return;
      const { action, version } = btn.dataset;
      if (action === "start") await startPHP(btn, version);
      else if (action === "stop") await stopPHP(btn, version);
      else if (action === "config") await openConfigPanel(version);
      else if (action === "ini") await openIniPanel(version);
      else if (action === "log") await openLogPanel(version);
      else if (action === "delete") await deletePHP(version, btn);
    });
  }

  loadPHPPage();
}
