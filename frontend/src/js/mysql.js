import {
  CreateMySQLDatabase,
  DeleteMySQLVersion,
  DropMySQLDatabase,
  GetMySQLActiveVersion,
  GetMySQLAvailableVersions,
  GetMySQLConnectionInfo,
  GetMySQLDatabases,
  GetMySQLInstalledVersions,
  InstallMySQL,
  IsMySQLRunning,
  RestartMySQL,
  SetMySQLActiveVersion,
  StartMySQL,
  StopMySQL,
  GetLogs,
  ClearLog,
  ExportMySQLDatabase,
  ImportMySQLDatabase,
  GetMySQLDatabasesInfo,
  GetMySQLUsers,
  CreateMySQLUser,
  DropMySQLUser,
  SetMySQLUserPassword,
  GetMySQLUserGrants,
  GrantMySQLDatabase,
  RevokeMySQLDatabase,
} from "../../wailsjs/go/main/App";
import { alert, confirm, promptPassword } from "./modal.js";
import { addListener, pollUntilStopped } from "./utils.js";
import { openInstallModal } from "./installer.js";
import { t } from "./i18n.js";
import { createIcons, icons } from "lucide";

let isActivating = false;
let isDeleting = false;
let mysqlLogInterval = null;
const installingVersions = new Set();

async function loadMySQLPage() {
  const installed = await GetMySQLInstalledVersions();
  const active = await GetMySQLActiveVersion();

  if (installed.length === 0) {
    document.getElementById("mysql-not-installed").style.display = "block";
    document.getElementById("mysql-installed").style.display = "none";
  } else {
    document.getElementById("mysql-not-installed").style.display = "none";
    document.getElementById("mysql-installed").style.display = "flex";
    renderInstalledVersions(installed, active);
    await updateMySQLStatus();
  }

  addListener("mysql-install-btn", openInstallFlow);
  addListener("mysql-add-btn", openInstallFlow);
}

function openInstallFlow() {
  openInstallModal({
    title: `⬡ ${t("common.install_new")}`,
    serviceName: "MySQL",
    accentColor: "var(--mysql)",
    loadVersionsFn: async () => {
      const [available, installed] = await Promise.all([
        GetMySQLAvailableVersions(),
        GetMySQLInstalledVersions(),
      ]);
      return available.filter((v) => !installed.includes(v) && !installingVersions.has(v));
    },
    installFn: async (version) => {
      installingVersions.add(version);
      const result = await InstallMySQL(version);
      const ok = typeof result === "string" ? result === "" : result;
      if (!ok) installingVersions.delete(version);
      return result;
    },
    eventName: (version) => `mysql:install-progress:${version}`,
    onInstalled: async (version) => {
      installingVersions.delete(version);
      const currentActive = await GetMySQLActiveVersion();
      if (!currentActive) await SetMySQLActiveVersion(version);
      await loadMySQLPage();
    },
  });
}

function renderInstalledVersions(installed, active) {
  const list = document.getElementById("mysql-versions-list");
  list.innerHTML = "";

  document.getElementById("mysql-active-version").textContent =
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
            <span class="version-badge" style="color:var(--mysql);border-color:rgba(26,122,191,0.25)">${v}</span>
          </div>
          <div class="version-actions">
            ${
              isActive
                ? '<span class="tag tag-default">ACTIV</span>'
                : `<button class="btn btn-secondary" data-action="activate" data-version="${v}">${t("common.activate")}</button>`
            }
            <button class="btn btn-danger" data-action="delete" data-version="${v}">${t("common.delete")}</button>
          </div>
        </div>
      `;
    })
    .join("");

  setTimeout(() => {
    document.querySelectorAll("#mysql-versions-list .version-item").forEach((item) => {
      const badge = item.querySelector(".version-badge");
      if (badge && badge.textContent === active) {
        item.classList.add("highlight");
      }
    });
  }, 50);
}


async function updateMySQLStatus() {
  const running = await IsMySQLRunning();
  const dot = document.getElementById("mysql-status-dot");
  const startBtn = document.getElementById("mysql-start-btn");
  const stopBtn = document.getElementById("mysql-stop-btn");
  const restartBtn = document.getElementById("mysql-restart-btn");

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

  const dbPanel = document.getElementById("mysql-db-panel");
  if (dbPanel) {
    if (running) {
      dbPanel.style.display = "block";
      loadConnectionInfo();
      loadDatabases();
    } else {
      dbPanel.style.display = "none";
    }
  }

  const usersPanel = document.getElementById("mysql-users-panel");
  if (usersPanel) {
    if (running) {
      usersPanel.style.display = "block";
      loadUsers();
    } else {
      usersPanel.style.display = "none";
    }
  }
}

async function loadConnectionInfo() {
  const info = await GetMySQLConnectionInfo();

  document.getElementById("mysql-conn-host").textContent = info.host;
  document.getElementById("mysql-conn-port").textContent = info.port;
  document.getElementById("mysql-conn-user").textContent = info.user;

  const passEl = document.getElementById("mysql-conn-pass");
  const toggleBtn = document.getElementById("mysql-conn-pass-toggle");

  if (!info.hasPassword) {
    passEl.textContent = "—";
    passEl.style.color = "var(--text3)";
    toggleBtn.style.display = "none";
  } else {
    let visible = false;
    passEl.textContent = "••••••••";
    passEl.style.color = "";
    toggleBtn.style.display = "inline-flex";
    toggleBtn.onclick = () => {
      visible = !visible;
      passEl.textContent = visible ? info.password : "••••••••";
      toggleBtn.querySelector("i").setAttribute("data-lucide", visible ? "eye-off" : "eye");
      createIcons({ icons });
    };
  }
}

async function loadDatabases() {
  const list = document.getElementById("mysql-db-list");
  if (!list) return;

  list.innerHTML = `<span style="color:var(--text3);font-size:12px">${t("common.loading")}</span>`;

  const [dbs, err] = await GetMySQLDatabasesInfo().then(r => [r, null]).catch(e => [null, e]);

  if (!dbs) {
    list.innerHTML = `<span style="color:var(--danger);font-size:12px">${err?.message || "Error"}</span>`;
    return;
  }

  const SYSTEM = ["information_schema", "mysql", "performance_schema", "sys"];

  list.innerHTML = dbs.map(({ name, charset, collation }) => {
    const isSystem = SYSTEM.includes(name.toLowerCase());
    return `
      <div class="version-item" style="padding:8px 0">
        <div class="version-row" style="align-items:center;gap:8px">
          <span style="display:inline-flex;min-width:64px;flex-shrink:0">
            ${isSystem
              ? `<span class="tag tag-default">${t("mysql.system_db")}</span>`
              : `<span class="tag tag-active">${t("mysql.user_db")}</span>`}
          </span>
          <span style="font-family:var(--font-mono);font-size:13px">${name}</span>
          <span style="font-size:11px;color:var(--text3);font-family:var(--font-mono)">${charset}/${collation}</span>
        </div>
        <div class="version-actions">
          ${!isSystem ? `
            <button class="btn btn-secondary btn-sm" data-action="export" data-db="${name}">${t("mysql.export")}</button>
            <button class="btn btn-secondary btn-sm" data-action="import" data-db="${name}">${t("mysql.import")}</button>
            <button class="btn btn-danger btn-sm" data-action="drop" data-db="${name}">${t("common.delete")}</button>
          ` : ""}
        </div>
      </div>
    `;
  }).join("");
}

async function createDatabase() {
  const input = document.getElementById("mysql-db-name");
  const name = input?.value.trim();
  if (!name) {
    input?.focus();
    return;
  }

  const btn = document.getElementById("mysql-db-create-btn");
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span>`;

  const err = await CreateMySQLDatabase(name);
  btn.disabled = false;
  btn.textContent = t("mysql.create_db");

  if (err) {
    await alert("MySQL", err);
    return;
  }

  input.value = "";
  await loadDatabases();
}

async function dropDatabase(name) {
  const ok = await confirm(t("mysql.drop_title"), t("mysql.drop_confirm", { name }));
  if (!ok) return;

  const err = await DropMySQLDatabase(name);
  if (err) {
    await alert("MySQL", err);
    return;
  }
  await loadDatabases();
}

async function activateMySQLVersion(version, btn) {
  if (isActivating) return;
  isActivating = true;
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span>`;

  try {
    const running = await IsMySQLRunning();
    if (running) {
      const ok = await confirm(
        t("mysql.change_version"),
        t("mysql.change_confirm", { version }),
      );
      if (!ok) return;
      await StopMySQL();
      await pollUntilStopped(IsMySQLRunning);
    }

    await SetMySQLActiveVersion(version);
    const installed = await GetMySQLInstalledVersions();
    renderInstalledVersions(installed, version);
    await updateMySQLStatus();
  } finally {
    isActivating = false;
    if (document.contains(btn)) {
      btn.disabled = false;
      btn.textContent = t("common.activate");
    }
  }
}

async function deleteMySQLVersion(version, btn) {
  if (isDeleting) return;
  isDeleting = true;
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span>`;

  try {
    const ok = await confirm(
      t("mysql.delete_title"),
      t("mysql.delete_confirm", { version }),
    );
    if (!ok) return;

    const running = await IsMySQLRunning();
    if (running) {
      await StopMySQL();
      await pollUntilStopped(IsMySQLRunning);
    }

    await DeleteMySQLVersion(version);
    loadMySQLPage();
  } finally {
    isDeleting = false;
    if (document.contains(btn)) {
      btn.disabled = false;
      btn.textContent = t("common.delete");
    }
  }
}

async function exportDatabase(btn, name) {
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span>`;
  const err = await ExportMySQLDatabase(name);
  btn.disabled = false;
  btn.textContent = t("mysql.export");
  if (err) await alert("MySQL", err);
}

async function importDatabase(btn, name) {
  const ok = await confirm(
    t("mysql.import_confirm_title"),
    t("mysql.import_confirm_body", { name })
  );
  if (!ok) return;

  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span>`;
  const err = await ImportMySQLDatabase(name);
  btn.disabled = false;
  btn.textContent = t("mysql.import");
  if (err) await alert("MySQL", err);
}

async function loadUsers() {
  const list = document.getElementById("mysql-users-list");
  if (!list) return;

  list.innerHTML = `<span style="color:var(--text3);font-size:12px">${t("common.loading")}</span>`;

  const [users, err] = await GetMySQLUsers().then((r) => [r, null]).catch((e) => [null, e]);

  if (!users) {
    list.innerHTML = `<span style="color:var(--danger);font-size:12px">${err?.message || "Error"}</span>`;
    return;
  }

  if (users.length === 0) {
    list.innerHTML = `<span style="color:var(--text3);font-size:12px">${t("mysql.no_users")}</span>`;
    return;
  }

  list.innerHTML = users.map((u) => {
    const isRoot = u.user === "root";
    return `
      <div class="version-item" data-user="${u.user}" data-host="${u.host}">
        <div class="version-row" style="align-items:center">
          <span style="font-family:var(--font-mono);font-size:13px">
            <strong>${u.user}</strong><span style="color:var(--text3)">@${u.host}</span>
          </span>
          ${isRoot ? `<span class="tag tag-default">root</span>` : ""}
          ${!u.hasPassword ? `<span class="tag tag-warn" style="background:rgba(255,180,0,0.12);color:var(--warn);border-color:rgba(255,180,0,0.3)">${t("mysql.no_password_tag")}</span>` : ""}
        </div>
        <div class="version-actions">
          <button class="btn btn-secondary btn-sm" data-action="set-password">${t("mysql.set_password")}</button>
          ${!isRoot ? `<button class="btn btn-secondary btn-sm" data-action="permissions">${t("mysql.permissions")}</button>` : ""}
          ${!isRoot ? `<button class="btn btn-danger btn-sm" data-action="delete">${t("common.delete")}</button>` : ""}
        </div>
        <div class="user-permissions-panel" style="display:none;margin-top:10px;padding-top:10px;border-top:1px solid var(--border)"></div>
      </div>
    `;
  }).join("");
}

async function createUser() {
  const nameInput = document.getElementById("mysql-user-name");
  const hostInput = document.getElementById("mysql-user-host");
  const passInput = document.getElementById("mysql-user-pass");

  const username = nameInput?.value.trim();
  const host = hostInput?.value.trim() || "localhost";
  const password = passInput?.value || "";

  if (!username) {
    nameInput?.focus();
    return;
  }

  const btn = document.getElementById("mysql-user-create-btn");
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span>`;

  const err = await CreateMySQLUser(username, host, password);
  btn.disabled = false;
  btn.textContent = t("mysql.create_user");

  if (err) {
    await alert("MySQL", err);
    return;
  }

  nameInput.value = "";
  passInput.value = "";
  await loadUsers();
}

async function deleteUser(username, host) {
  const ok = await confirm(
    t("mysql.user_delete_title"),
    t("mysql.user_delete_confirm", { user: username, host }),
  );
  if (!ok) return;

  const err = await DropMySQLUser(username, host);
  if (err) {
    await alert("MySQL", err);
    return;
  }
  await loadUsers();
}

async function setUserPassword(username, host) {
  const password = await promptPassword(
    t("mysql.password_title"),
    t("mysql.password_label", { user: username, host }),
  );
  if (password === null) return;

  const err = await SetMySQLUserPassword(username, host, password);
  if (err) {
    await alert("MySQL", err);
    return;
  }
  await loadUsers();
  // Refresh connection info if root password changed
  if (username === "root") {
    await loadConnectionInfo();
  }
}

async function togglePermissions(item, username, host) {
  const panel = item.querySelector(".user-permissions-panel");
  if (!panel) return;

  const isOpen = panel.style.display !== "none";
  if (isOpen) {
    panel.style.display = "none";
    return;
  }

  panel.style.display = "block";
  panel.innerHTML = `<span style="color:var(--text3);font-size:12px">${t("common.loading")}</span>`;

  const [[dbs], [grants]] = await Promise.all([
    GetMySQLDatabases().then((r) => [r]).catch(() => [[]]),
    GetMySQLUserGrants(username, host).then((r) => [r]).catch(() => [[]]),
  ]);

  const SYSTEM = ["information_schema", "mysql", "performance_schema", "sys"];
  const userDbs = (dbs || []).filter((d) => !SYSTEM.includes(d.toLowerCase()));

  if (userDbs.length === 0) {
    panel.innerHTML = `<span style="color:var(--text3);font-size:12px">${t("mysql.no_user_dbs")}</span>`;
    return;
  }

  const grantSet = new Set((grants || []).map((g) => g.toLowerCase()));

  // Grant/revoke buttons use data-grant-action; clicks are delegated from mysql-users-list in init().
  panel.innerHTML = userDbs.map((db) => {
    const hasGrant = grantSet.has(db.toLowerCase());
    return `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0">
        <span style="font-family:var(--font-mono);font-size:12px">${db}</span>
        <button class="btn btn-sm ${hasGrant ? "btn-warning" : "btn-secondary"}"
          data-grant-action="${hasGrant ? "revoke" : "grant"}" data-db="${db}">
          ${hasGrant ? t("mysql.revoke") : t("mysql.grant")}
        </button>
      </div>
    `;
  }).join("");
}

export function init() {
  const list = document.getElementById("mysql-versions-list");
  if (list) {
    list.addEventListener("click", async (e) => {
      const btn = e.target.closest("button[data-action]");
      if (!btn) return;
      const { action, version } = btn.dataset;
      if (action === "activate") await activateMySQLVersion(version, btn);
      else if (action === "delete") await deleteMySQLVersion(version, btn);
    });
  }

  document.getElementById("mysql-db-list")?.addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const { action, db } = btn.dataset;
    if (action === "drop") await dropDatabase(db);
    else if (action === "export") await exportDatabase(btn, db);
    else if (action === "import") await importDatabase(btn, db);
  });

  addListener("mysql-db-create-btn", createDatabase);

  document.getElementById("mysql-db-name")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") createDatabase();
  });

  document.getElementById("mysql-users-list")?.addEventListener("click", async (e) => {
    const item = e.target.closest(".version-item[data-user]");
    if (!item) return;
    const { user, host } = item.dataset;

    const actionBtn = e.target.closest("button[data-action]");
    if (actionBtn) {
      const { action } = actionBtn.dataset;
      if (action === "delete") await deleteUser(user, host);
      else if (action === "set-password") await setUserPassword(user, host);
      else if (action === "permissions") await togglePermissions(item, user, host);
      return;
    }

    const grantBtn = e.target.closest("button[data-grant-action]");
    if (grantBtn) {
      const { grantAction, db } = grantBtn.dataset;
      grantBtn.disabled = true;
      const err = grantAction === "grant"
        ? await GrantMySQLDatabase(user, host, db)
        : await RevokeMySQLDatabase(user, host, db);
      if (err) {
        await alert("MySQL", err);
        grantBtn.disabled = false;
        return;
      }
      const panel = item.querySelector(".user-permissions-panel");
      if (panel) {
        panel.style.display = "none";
        await togglePermissions(item, user, host);
      }
    }
  });

  addListener("mysql-user-create-btn", createUser);

  document.getElementById("mysql-user-name")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") createUser();
  });

  addListener("mysql-start-btn", async () => {
    const btn = document.getElementById("mysql-start-btn");
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span> ${t("common.starting")}`;
    await StartMySQL();
    await updateMySQLStatus();
  });

  addListener("mysql-stop-btn", async () => {
    const btn = document.getElementById("mysql-stop-btn");
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span> ${t("common.stopping")}`;
    await StopMySQL();
    await pollUntilStopped(IsMySQLRunning);
    await updateMySQLStatus();
  });

  addListener("mysql-restart-btn", async () => {
    const btn = document.getElementById("mysql-restart-btn");
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span> ${t("common.restarting")}`;
    await RestartMySQL();
    await updateMySQLStatus();
  });

  loadMySQLPage();

  let mysqlLogLoaded = false;

  document
    .getElementById("mysql-log-toggle")
    ?.addEventListener("click", (e) => {
      if (
        e.target.closest("button") ||
        e.target.closest("input") ||
        e.target.closest(".log-auto-label")
      )
        return;
      const body = document.getElementById("mysql-log-body");
      const chevron = document.getElementById("mysql-log-chevron");
      const autoLabel = document.getElementById("mysql-log-auto-label");
      const autoCheck = document.getElementById("mysql-log-auto-check");
      const refreshBtn = document.getElementById("mysql-log-refresh-btn");
      const clearBtn = document.getElementById("mysql-log-clear-btn");
      const open = body.style.display === "none";
      body.style.display = open ? "block" : "none";
      chevron.style.transform = open ? "rotate(180deg)" : "";
      autoLabel.style.display = open ? "flex" : "none";
      refreshBtn.style.display = open ? "inline-flex" : "none";
      clearBtn.style.display = open ? "inline-flex" : "none";
      if (!open) {
        autoCheck.checked = false;
        clearInterval(mysqlLogInterval);
        mysqlLogInterval = null;
      }
      if (open && !mysqlLogLoaded) {
        mysqlLogLoaded = true;
        loadMySQLLog();
      }
    });

  document
    .getElementById("mysql-log-auto-check")
    ?.addEventListener("change", (e) => {
      if (e.target.checked) {
        mysqlLogInterval = setInterval(loadMySQLLog, 2000);
      } else {
        clearInterval(mysqlLogInterval);
        mysqlLogInterval = null;
      }
    });

  addListener("mysql-log-refresh-btn", loadMySQLLog);

  addListener("mysql-log-clear-btn", async () => {
    const ok = await confirm(
      t("logs.clear_title"),
      t("logs.clear_confirm"),
      "warn",
    );
    if (!ok) return;
    await ClearLog("mysql");
    await loadMySQLLog();
  });

  createIcons({ icons });
}

async function loadMySQLLog() {
  const el = document.getElementById("mysql-log-content");
  if (!el) return;
  const active = await GetMySQLActiveVersion();
  if (!active) {
    el.innerHTML = `<span style="color:var(--text3)">${t("logs.empty")}</span>`;
    return;
  }
  const lines = await GetLogs("mysql", 200);
  if (!lines || lines.length === 0) {
    el.innerHTML = `<span style="color:var(--text3)">${t("logs.empty")}</span>`;
    return;
  }
  el.textContent = lines.join("\n");
  el.scrollTop = el.scrollHeight;
}
