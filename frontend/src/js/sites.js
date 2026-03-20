import {
  CreateSite,
  CreateIndexFiles,
  DeleteSite,
  GetSites,
  ToggleSite,
  GetPHPInstalledVersions,
  BrowseFolder,
  OpenFolder,
  RestartNginx,
  IsPHPRunning,
  IsNginxRunning,
  GetSiteRewrites,
  SaveSiteRewrites,
  BrowseHtaccessFile,
  ConvertHtaccess,
  GetLogs,
  ClearLog,
  CheckComposer,
  CreateLaravelProject,
  ChangeSitePHP,
  OpenInBrowser,
  RunArtisan,
  RunLaravelUpdate,
} from "../../wailsjs/go/main/App";
import { EventsOn, EventsOff } from "../../wailsjs/runtime/runtime";
import { alert, confirm, confirmWithCheckbox } from "./modal.js";
import { addListener, escapeHtml } from "./utils.js";
import { createIcons, icons } from "lucide";
import { t } from "./i18n.js";

// ── State ──────────────────────────────────────────────────────────────────────

let isDeleting = false;
let isToggling = false;
let currentSites = [];
let currentSiteLogType = {};
let searchQuery = "";

// ── Init ───────────────────────────────────────────────────────────────────────

export function init() {
  const list = document.getElementById("sites-list");
  if (list) {
    list.addEventListener("click", async (e) => {
      const btn = e.target.closest("button[data-action]");
      if (!btn) return;
      const { action, domain, root, name } = btn.dataset;
      if (action === "open-site") await openSite(domain);
      else if (action === "open-root") await openRoot(root);
      else if (action === "rewrites") await openRewritesPanel(name);
      else if (action === "log") await openLogPanel(name);
      else if (action === "change-php") await openChangePHPPanel(name);
      else if (action === "laravel") await openLaravelPanel(name);
      else if (action === "toggle") await toggleSite(btn, name);
      else if (action === "delete") await deleteSite(name);
    });
  }

  loadSitesPage();
}

async function loadSitesPage() {
  await renderSites();
  addListener("sites-fab-btn", () => openNewSiteModal());

  const searchInput = document.getElementById("sites-search");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      searchQuery = searchInput.value;
      renderFilteredSites();
    });
  }
}

// ── Render ─────────────────────────────────────────────────────────────────────

function shortPath(p) {
  const norm = p.replace(/\\/g, "/");
  const idx = norm.indexOf("/www/");
  return idx >= 0 ? "..." + norm.slice(idx) : p;
}

async function renderSites() {
  const list = document.getElementById("sites-list");
  if (!list) return;

  const sites = await GetSites();
  currentSites = sites;

  const searchWrap = document.getElementById("sites-search-wrap");
  if (searchWrap) searchWrap.style.display = sites.length > 0 ? "block" : "none";

  if (sites.length === 0) {
    list.innerHTML = `<div style="color:var(--text3);font-size:11px">${t("sites.no_sites")}</div>`;
    return;
  }

  const nginxRunning = await IsNginxRunning();
  const rows = await Promise.all(
    sites.map(async (site) => {
      const phpRunning =
        site.php && site.php !== "0" ? await IsPHPRunning(site.php) : null;
      return buildSiteRow(site, phpRunning, nginxRunning);
    }),
  );

  // Cache rendered rows by site name for filtering
  list._allRows = Object.fromEntries(
    sites.map((site, i) => [site.name, rows[i]])
  );

  renderFilteredSites();
}

function renderFilteredSites() {
  const list = document.getElementById("sites-list");
  if (!list || !list._allRows) return;

  const q = searchQuery.trim().toLowerCase();
  const filtered = q
    ? currentSites.filter(
        (s) =>
          s.domain.toLowerCase().includes(q) ||
          s.root.toLowerCase().includes(q),
      )
    : currentSites;

  if (filtered.length === 0) {
    list.innerHTML = `<div style="color:var(--text3);font-size:11px">${t("sites.no_results")}</div>`;
    return;
  }

  list.innerHTML = filtered.map((s) => list._allRows[s.name]).join("");
  setTimeout(() => createIcons({ icons }), 0);
}

function buildSiteRow(site, phpRunning, nginxRunning) {
  const nginxLabel = `<span class="site-meta" style="color:${nginxRunning ? "var(--good)" : "var(--danger)"}" title="${nginxRunning ? t("sites.nginx_running") : t("sites.nginx_stopped")}">nginx</span>`;
  const phpLabel =
    site.php && site.php !== "0"
      ? `<span class="site-meta" style="color:${phpRunning ? "var(--good)" : "var(--danger)"}">PHP ${site.php}</span>`
      : `<span class="site-meta" style="color:var(--text3)">static</span>`;

  const statusDot = site.active
    ? '<span class="dot-pulse"></span>'
    : '<span class="dot-inactive"></span>';

  return `
    <div class="version-item-wrap" data-name="${site.name}">
      <div class="version-item">
        <div class="version-row" style="flex-direction:column;align-items:flex-start;gap:3px">
          <div style="display:flex;align-items:center;gap:8px">
            <span class="version-badge" style="color:var(--accent);border-color:rgba(0,212,170,0.25)">${escapeHtml(site.domain)}</span>
            ${nginxLabel}
            ${phpLabel}
          </div>
          <span class="site-path" title="${escapeHtml(site.root)}">${escapeHtml(shortPath(site.root))}</span>
        </div>
        <div class="version-actions">
          ${statusDot}
          <button class="btn btn-secondary btn-icon" data-action="open-site" data-domain="${escapeHtml(site.domain)}">
            <i data-lucide="globe"></i>
          </button>
          <button class="btn btn-secondary btn-icon" data-action="open-root" data-root="${escapeHtml(site.root)}">
            <i data-lucide="folder"></i>
          </button>
          <button class="btn btn-secondary btn-icon" data-action="change-php" data-name="${site.name}" title="${t("sites.change_php")}">
            <i data-lucide="cpu"></i>
          </button>
          ${site.laravel_version ? `<button class="btn btn-secondary btn-icon" data-action="laravel" data-name="${site.name}" title="${t("sites.laravel_panel")}" style="color:var(--accent3)"><i data-lucide="flame"></i></button>` : ""}
          <button class="btn btn-secondary btn-icon" data-action="rewrites" data-name="${site.name}" title="${t("sites.rewrites")}">
            <i data-lucide="route"></i>
          </button>
          <button class="btn btn-secondary btn-icon" data-action="log" data-name="${site.name}" title="${t("nav.logs")}">
            <i data-lucide="scroll-text"></i>
          </button>
          <button class="btn ${site.active ? "btn-warning" : "btn-secondary"} btn-icon" data-action="toggle" data-name="${site.name}">
            <i data-lucide="${site.active ? "pause" : "play"}"></i>
          </button>
          <button class="btn btn-danger btn-icon" data-action="delete" data-name="${site.name}">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      </div>
      <div class="php-config-panel" id="site-php-${site.name}" style="display:none"></div>
      <div class="php-config-panel" id="site-rewrites-${site.name}" style="display:none"></div>
      <div class="php-config-panel" id="site-log-${site.name}" style="display:none"></div>
      <div class="php-config-panel" id="site-laravel-${site.name}" style="display:none"></div>
    </div>
  `;
}

// ── Modal: new site ────────────────────────────────────────────────────────────

async function openNewSiteModal() {
  const [phpVersions, composerVersion] = await Promise.all([
    GetPHPInstalledVersions(),
    CheckComposer(),
  ]);

  const phpOptions = [
    `<option value="">${t("sites.no_php")}</option>`,
    ...phpVersions
      .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
      .map((v) => `<option value="${v}">${v}</option>`),
  ].join("");

  const laravelAvailable = !!composerVersion && phpVersions.length > 0;
  const laravelRow = laravelAvailable
    ? `
    <div class="form-group" style="margin-bottom:0">
      <label class="laravel-toggle-label" style="display:flex;align-items:center;gap:10px;cursor:pointer;padding:10px 12px;border-radius:8px;border:1px solid var(--border);background:rgba(255,99,35,0.04);transition:border-color 0.2s">
        <input type="checkbox" id="modal-laravel-cb" style="width:14px;height:14px;accent-color:var(--accent3);cursor:pointer" />
        <div>
          <div style="font-size:12px;font-weight:600;color:var(--text)">Laravel</div>
          <div style="font-size:11px;color:var(--text3);margin-top:1px">${t("sites.laravel_desc")}</div>
        </div>
        <span style="margin-left:auto;font-size:10px;padding:2px 7px;border-radius:999px;background:rgba(255,99,35,0.1);color:var(--accent3);font-weight:600">composer</span>
      </label>
    </div>
  `
    : "";

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";

  const modal = document.createElement("div");
  modal.className = "modal";
  modal.style.width = "560px";
  modal.style.maxWidth = "calc(100vw - 48px)";

  modal.innerHTML = `
    <div class="modal-title">⊞ ${t("sites.new_site_title")}</div>
    <div id="modal-site-form">
      <div class="modal-body" style="margin-bottom:0;display:flex;gap:0">

        <!-- Left: main form -->
        <div style="flex:1;min-width:0;padding-right:20px">
          <div class="form-group">
            <label class="form-label">${t("sites.domain")}</label>
            <input type="text" id="modal-site-domain" class="input" placeholder="myapp.test" autocomplete="off" />
          </div>
          <div class="form-group" id="modal-root-group">
            <label class="form-label">
              ${t("sites.root_folder")}
              <span style="color:var(--text3);font-weight:400">(${t("sites.optional")})</span>
            </label>
            <div style="display:flex;gap:8px">
              <input type="text" id="modal-site-root" class="input" style="flex:1" placeholder="${t("sites.root_placeholder")}" />
              <button class="btn btn-secondary" id="modal-browse-btn">📁</button>
            </div>
          </div>
          <div class="form-group" style="margin-bottom:0">
            <label id="modal-php-label" class="form-label">${t("sites.php_version")}</label>
            <select id="modal-site-php" class="select">${phpOptions}</select>
          </div>
        </div>

        <!-- Divider -->
        <div style="width:1px;background:var(--border);flex-shrink:0;margin:2px 0"></div>

        <!-- Right: options -->
        <div style="width:168px;flex-shrink:0;padding-left:20px;display:flex;flex-direction:column;gap:0">
          <div style="font-size:10px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:10px">${t("sites.options")}</div>
          <div style="display:flex;flex-direction:column;gap:8px">
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12px;color:var(--text)">
              <input type="checkbox" id="modal-add-hosts" checked style="width:13px;height:13px;accent-color:var(--accent2);cursor:pointer;flex-shrink:0" />
              <span>${t("sites.add_to_hosts")}</span>
            </label>
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12px;color:var(--text)">
              <input type="checkbox" id="modal-create-html" style="width:13px;height:13px;accent-color:var(--accent2);cursor:pointer;flex-shrink:0" />
              <span>index.html</span>
            </label>
            <label id="modal-create-php-label" style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12px;color:var(--text)">
              <input type="checkbox" id="modal-create-php" style="width:13px;height:13px;accent-color:var(--accent2);cursor:pointer;flex-shrink:0" />
              <span>index.php</span>
            </label>
          </div>
          ${laravelAvailable ? `
          <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border)">
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
              <input type="checkbox" id="modal-laravel-cb" style="width:13px;height:13px;accent-color:var(--accent3);cursor:pointer;flex-shrink:0" />
              <div>
                <div style="font-size:12px;font-weight:600;color:var(--text)">Laravel</div>
                <div style="font-size:11px;color:var(--text3);margin-top:1px">${t("sites.laravel_desc")}</div>
              </div>
            </label>
          </div>
          ` : ""}
        </div>
      </div>

      <!-- Laravel requirements (full width, below both columns) -->
      <div id="laravel-requirements" style="display:none;margin-top:16px;padding:10px 12px;border-radius:8px;border:1px solid var(--border);background:var(--bg2);font-size:11px">
        <div style="color:var(--text2);font-weight:600;margin-bottom:6px">${t("sites.laravel_requirements")}</div>
        <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px">
          ${["openssl", "mbstring", "curl", "fileinfo"]
            .map((e) => `<span style="padding:1px 7px;border-radius:4px;background:rgba(0,201,160,0.12);color:var(--accent);font-family:var(--font-mono)">${e}</span>`)
            .join("")}
          ${["pdo_mysql", "pdo_sqlite"]
            .map((e) => `<span style="padding:1px 7px;border-radius:4px;background:rgba(47,155,255,0.12);color:var(--accent2);font-family:var(--font-mono)">${e} **</span>`)
            .join("")}
          <span style="padding:1px 7px;border-radius:4px;background:rgba(255,200,0,0.12);color:var(--warn);font-family:var(--font-mono)">zip *</span>
        </div>
        <div id="laravel-php-note" style="color:var(--text3)"></div>
        <div style="color:var(--text3);margin-top:4px">* zip ${t("sites.laravel_zip_optional")}</div>
        <div style="color:var(--text3);margin-top:2px">** ${t("sites.laravel_pdo_note")}</div>
      </div>

      <div class="modal-footer" style="margin-top:20px">
        <button class="btn btn-secondary" id="modal-site-cancel">${t("common.cancel")}</button>
        <button class="btn btn-primary" id="modal-site-create">${t("sites.create")}</button>
      </div>
    </div>
    <div id="modal-laravel-progress" style="display:none">
      <div class="modal-body">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
          <span class="spinner"></span>
          <span style="font-size:12px;color:var(--text2)" id="modal-laravel-status">${t("sites.laravel_installing")}</span>
        </div>
        <pre id="modal-laravel-output" class="log-viewer" style="max-height:200px;min-height:80px;font-size:10px"></pre>
      </div>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const domainInput = modal.querySelector("#modal-site-domain");
  domainInput.focus();

  const close = () => {
    EventsOff("laravel-output");
    EventsOff("laravel-done");
    overlay.remove();
  };

  // Laravel checkbox toggles root field + requirements panel
  modal.querySelector("#modal-laravel-cb")?.addEventListener("change", (e) => {
    const rootGroup = modal.querySelector("#modal-root-group");
    const rootInput = modal.querySelector("#modal-site-root");
    const req = modal.querySelector("#laravel-requirements");
    const phpSelect = modal.querySelector("#modal-site-php");
    const phpLabel = modal.querySelector("#modal-php-label");
    const htmlCb = modal.querySelector("#modal-create-html");
    const htmlCbLabel = modal.querySelector("#modal-create-html")?.closest("label");
    if (e.target.checked) {
      rootInput.value = "";
      rootInput.disabled = true;
      modal.querySelector("#modal-browse-btn").disabled = true;
      rootGroup.style.opacity = "0.4";
      phpSelect.querySelector("option[value='']")?.remove();
      if (!phpSelect.value) phpSelect.value = phpVersions[0] ?? "";
      phpLabel?.classList.add("required-label");
      modal.querySelector("#laravel-php-note").textContent = phpSelect.value
        ? t("sites.laravel_php_note", { version: phpSelect.value })
        : "";
      req.style.display = "block";
      // Disable template checkboxes — Laravel creates its own structure
      if (htmlCb) { htmlCb.checked = false; htmlCb.disabled = true; }
      if (htmlCbLabel) htmlCbLabel.style.opacity = "0.4";
      phpCb.checked = false;
      phpCb.disabled = true;
      phpCbLabel.style.opacity = "0.4";
    } else {
      rootInput.disabled = false;
      modal.querySelector("#modal-browse-btn").disabled = false;
      rootGroup.style.opacity = "1";
      phpLabel?.classList.remove("required-label");
      if (!phpSelect.querySelector("option[value='']")) {
        phpSelect.insertAdjacentHTML(
          "afterbegin",
          `<option value="">${t("sites.no_php")}</option>`,
        );
      }
      req.style.display = "none";
      // Re-enable template checkboxes
      if (htmlCb) { htmlCb.disabled = false; }
      if (htmlCbLabel) htmlCbLabel.style.opacity = "1";
      updatePhpCheckbox();
    }
  });

  modal.querySelector("#modal-site-php").addEventListener("change", (e) => {
    const note = modal.querySelector("#laravel-php-note");
    if (note)
      note.textContent = e.target.value
        ? t("sites.laravel_php_note", { version: e.target.value })
        : "";
  });

  modal
    .querySelector("#modal-browse-btn")
    .addEventListener("click", async () => {
      const path = await BrowseFolder();
      if (path) modal.querySelector("#modal-site-root").value = path;
    });

  // Enable/disable index.php checkbox based on PHP selection
  const phpSelect = modal.querySelector("#modal-site-php");
  const phpCbLabel = modal.querySelector("#modal-create-php-label");
  const phpCb = modal.querySelector("#modal-create-php");
  const updatePhpCheckbox = () => {
    const hasPHP = phpSelect.value !== "";
    phpCb.disabled = !hasPHP;
    phpCbLabel.style.opacity = hasPHP ? "1" : "0.4";
    if (!hasPHP) phpCb.checked = false;
  };
  phpSelect.addEventListener("change", updatePhpCheckbox);
  updatePhpCheckbox();

  modal.querySelector("#modal-site-cancel").addEventListener("click", close);

  document.addEventListener("keydown", function onKey(e) {
    if (
      e.key === "Enter" &&
      e.target !== modal.querySelector("#modal-browse-btn")
    ) {
      onCreateSite(modal, close);
      document.removeEventListener("keydown", onKey);
    }
  });

  modal
    .querySelector("#modal-site-create")
    .addEventListener("click", () => onCreateSite(modal, close));
}

async function onCreateSite(modal, close) {
  const domain = modal.querySelector("#modal-site-domain").value.trim();
  const root = modal.querySelector("#modal-site-root").value.trim();
  const php = modal.querySelector("#modal-site-php").value;
  const isLaravel = modal.querySelector("#modal-laravel-cb")?.checked ?? false;
  const addToHosts = modal.querySelector("#modal-add-hosts")?.checked ?? true;
  const createHtml = modal.querySelector("#modal-create-html")?.checked ?? false;
  const createPhp = modal.querySelector("#modal-create-php")?.checked ?? false;

  if (!domain) {
    await alert(t("common.error"), t("sites.domain_required"), "warn");
    return;
  }

  if (isLaravel && !php) {
    await alert(t("common.error"), t("sites.php_required_laravel"), "warn");
    return;
  }

  if (currentSites.some((s) => s.domain === domain)) {
    await alert(
      t("common.error"),
      t("sites.domain_exists", { domain }),
      "warn",
    );
    return;
  }

  const btn = modal.querySelector("#modal-site-create");
  btn.disabled = true;
  btn.textContent = t("sites.creating");

  const result = await CreateSite(domain, root, php, addToHosts);
  if (result === "ok" || result === "hosts_denied") {
    if (createHtml || createPhp) {
      await CreateIndexFiles(domain, root, createHtml, createPhp);
    }
  }
  await RestartNginx();

  if (result === "error") {
    btn.disabled = false;
    btn.textContent = t("sites.create");
    await alert(t("common.error"), t("sites.create_error"), "danger");
    return;
  }

  if (result === "hosts_denied") {
    // Show warning after Laravel finishes (or immediately if not Laravel)
    if (!isLaravel) {
      close();
      await renderSites();
      await alert(
        t("sites.created_warning"),
        t("sites.hosts_denied", { domain }),
        "warn",
      );
      return;
    }
  }

  if (isLaravel) {
    await runLaravelInModal(
      modal,
      close,
      domain,
      php,
      result === "hosts_denied",
    );
  } else {
    close();
    await renderSites();
  }
}

async function runLaravelInModal(
  modal,
  close,
  domain,
  phpVersion,
  hostsWarning,
) {
  // Switch modal to progress view
  modal.querySelector("#modal-site-form").style.display = "none";
  const progress = modal.querySelector("#modal-laravel-progress");
  progress.style.display = "block";

  const statusEl = modal.querySelector("#modal-laravel-status");
  const outputEl = modal.querySelector("#modal-laravel-output");
  outputEl.innerHTML = "";

  const appendLine = (line) => {
    const isError = line.startsWith("ERROR:");
    const isWarn = line.startsWith("WARNING:") || line.startsWith("Tip:");
    const span = document.createElement("span");
    span.style.color = isError ? "var(--danger)" : isWarn ? "var(--warn)" : "";
    span.style.fontWeight = isError ? "600" : "";
    span.textContent = line + "\n";
    outputEl.appendChild(span);
    outputEl.scrollTop = outputEl.scrollHeight;
  };

  EventsOn("laravel-output", appendLine);
  EventsOn("laravel-done", async (ok) => {
    EventsOff("laravel-output");
    EventsOff("laravel-done");

    if (ok) {
      statusEl.textContent = t("sites.laravel_done");
      statusEl.style.color = "var(--good)";
      statusEl.previousElementSibling?.remove(); // remove spinner
      await renderSites();
      setTimeout(() => {
        close();
        if (hostsWarning)
          alert(
            t("sites.created_warning"),
            t("sites.hosts_denied", { domain }),
            "warn",
          );
      }, 1500);
    } else {
      statusEl.textContent = t("sites.laravel_error");
      statusEl.style.color = "var(--danger)";
      statusEl.previousElementSibling?.remove();
      const siteName = domain.replaceAll(".", "_");
      await DeleteSite(siteName, true);
      await RestartNginx();

      const footer = document.createElement("div");
      footer.className = "modal-footer";
      footer.style.marginTop = "16px";
      footer.innerHTML = `<button class="btn btn-secondary" id="modal-laravel-close">${t("common.cancel")}</button>`;
      progress.appendChild(footer);
      document
        .getElementById("modal-laravel-close")
        ?.addEventListener("click", close);
    }
  });

  // Start the project creation (non-blocking — events stream the output)
  CreateLaravelProject(domain, phpVersion).catch(() => {
    EventsOff("laravel-output");
    EventsOff("laravel-done");
    statusEl.textContent = t("sites.laravel_error");
    statusEl.style.color = "var(--danger)";
  });
}

// ── Actions ────────────────────────────────────────────────────────────────────

async function openSite(domain) {
  OpenInBrowser("http://" + domain);
}

async function openRoot(root) {
  OpenFolder(root);
}

async function toggleSite(btn, name) {
  if (isToggling) return;
  isToggling = true;
  try {
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span>`;
    await ToggleSite(name);
    await RestartNginx();
    await renderSites();
  } finally {
    isToggling = false;
  }
}

async function deleteSite(name) {
  if (isDeleting) return;
  isDeleting = true;
  try {
    const result = await confirmWithCheckbox(
      t("sites.delete_title"),
      t("sites.delete_confirm", { name }),
      t("sites.delete_folder"),
    );
    if (!result.ok) return;
    await DeleteSite(name, result.checked);
    await renderSites();
  } finally {
    isDeleting = false;
  }
}

// ── Panel: change PHP ──────────────────────────────────────────────────────────

async function openChangePHPPanel(name) {
  const panel = document.getElementById(`site-php-${name}`);
  if (!panel) return;

  if (panel.style.display !== "none") {
    panel.style.display = "none";
    return;
  }

  panel.innerHTML = `<div style="padding:12px;color:var(--text3);font-size:12px">${t("common.loading")}</div>`;
  panel.style.display = "block";

  const [phpVersions, sites] = await Promise.all([
    GetPHPInstalledVersions(),
    GetSites(),
  ]);

  const site = sites.find((s) => s.name === name);
  const currentPHP = site?.php ?? "";

  const options = [
    `<option value=""${!currentPHP ? " selected" : ""}>${t("sites.no_php")}</option>`,
    ...phpVersions
      .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
      .map(
        (v) =>
          `<option value="${v}"${v === currentPHP || v.startsWith(currentPHP + ".") ? " selected" : ""}>${v}</option>`,
      ),
  ].join("");

  panel.innerHTML = `
    <div class="php-config-body">
      <div style="display:flex;align-items:center;gap:8px">
        <select id="site-php-select-${name}" class="select" style="flex:1">${options}</select>
        <button class="btn btn-primary" id="site-php-save-${name}">${t("common.save")}</button>
      </div>
    </div>
  `;

  document
    .getElementById(`site-php-save-${name}`)
    ?.addEventListener("click", async () => {
      const saveBtn = document.getElementById(`site-php-save-${name}`);
      const newVersion = document.getElementById(
        `site-php-select-${name}`,
      ).value;
      saveBtn.disabled = true;

      const ok = await ChangeSitePHP(name, newVersion);
      if (ok) {
        await RestartNginx();
        panel.style.display = "none";
        await renderSites();
      } else {
        saveBtn.disabled = false;
        await alert(t("common.error"), t("sites.change_php_error"), "danger");
      }
    });
}

// ── Panel: rewrites ────────────────────────────────────────────────────────────

async function openRewritesPanel(name) {
  const panel = document.getElementById(`site-rewrites-${name}`);
  if (!panel) return;

  if (panel.style.display !== "none") {
    panel.style.display = "none";
    return;
  }

  panel.innerHTML = `<div style="padding:12px;color:var(--text3);font-size:12px">${t("common.loading")}</div>`;
  panel.style.display = "block";

  const current = await GetSiteRewrites(name);

  panel.innerHTML = `
    <div class="php-config-body">
      <textarea
        id="site-rewrites-input-${name}"
        class="input"
        style="font-family:var(--font-mono);font-size:11px;min-height:140px;width:100%;resize:vertical;line-height:1.6"
        spellcheck="false"
        placeholder="${t("sites.rewrites_placeholder")}"
      >${current}</textarea>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px">
        <button class="btn btn-secondary" id="site-import-htaccess-${name}" style="font-size:11px">
          <i data-lucide="upload"></i> ${t("sites.import_htaccess")}
        </button>
        <button class="btn btn-primary" id="site-rewrites-save-${name}">${t("common.save")}</button>
      </div>
    </div>
  `;

  setTimeout(() => createIcons({ icons }), 0);

  document
    .getElementById(`site-import-htaccess-${name}`)
    ?.addEventListener("click", async () => {
      const content = await BrowseHtaccessFile();
      if (!content) return;
      const converted = await ConvertHtaccess(content);
      document.getElementById(`site-rewrites-input-${name}`).value = converted;
    });

  document
    .getElementById(`site-rewrites-save-${name}`)
    ?.addEventListener("click", async () => {
      const rules = document.getElementById(
        `site-rewrites-input-${name}`,
      ).value;
      const ok = await SaveSiteRewrites(name, rules);
      if (ok) {
        panel.style.display = "none";
        await RestartNginx();
      }
    });
}

// ── Panel: logs ────────────────────────────────────────────────────────────────

async function openLogPanel(name) {
  const panel = document.getElementById(`site-log-${name}`);
  if (!panel) return;

  if (panel.style.display !== "none") {
    panel.style.display = "none";
    return;
  }

  panel.style.display = "block";
  if (!currentSiteLogType[name]) currentSiteLogType[name] = "site-access";
  await refreshSiteLog(panel, name);
}

async function refreshSiteLog(panel, name) {
  panel.innerHTML = `<div style="padding:12px;color:var(--text3);font-size:12px">${t("common.loading")}</div>`;

  const logType = (currentSiteLogType[name] || "site-access") + ":" + name;
  const lines = await GetLogs(logType, 200);

  panel.innerHTML = `
    <div class="php-config-body">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div class="lang-selector" style="padding:2px;gap:2px">
          <button class="lang-btn${(currentSiteLogType[name] || "site-access") === "site-access" ? " active" : ""}" data-log-tab="site-access">${t("logs.access")}</button>
          <button class="lang-btn${currentSiteLogType[name] === "site-error" ? " active" : ""}" data-log-tab="site-error">${t("logs.error")}</button>
        </div>
        <div style="display:flex;gap:6px">
          <button class="btn btn-secondary btn-icon site-log-refresh" data-name="${name}"><i data-lucide="refresh-cw"></i></button>
          <button class="btn btn-danger btn-icon site-log-clear" data-name="${name}"><i data-lucide="trash-2"></i></button>
        </div>
      </div>
      <pre class="log-viewer">${lines?.length > 0 ? escapeHtml(lines.join("\n")) : `<span style="color:var(--text3)">${t("logs.empty")}</span>`}</pre>
    </div>
  `;

  setTimeout(() => createIcons({ icons }), 0);

  panel.querySelectorAll("[data-log-tab]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      currentSiteLogType[name] = btn.dataset.logTab;
      await refreshSiteLog(panel, name);
    });
  });

  panel
    .querySelector(".site-log-refresh")
    ?.addEventListener("click", () => refreshSiteLog(panel, name));
  panel
    .querySelector(".site-log-clear")
    ?.addEventListener("click", async () => {
      const ok = await confirm(
        t("logs.clear_title"),
        t("logs.clear_confirm"),
        "warn",
      );
      if (!ok) return;
      await ClearLog((currentSiteLogType[name] || "site-access") + ":" + name);
      await refreshSiteLog(panel, name);
    });
}

// ── Panel: Laravel ─────────────────────────────────────────────────────────────

const ARTISAN_COMMANDS = [
  { cmd: "optimize:clear", icon: "trash-2", label: "optimize:clear" },
  { cmd: "cache:clear", icon: "database", label: "cache:clear" },
  { cmd: "config:clear", icon: "settings", label: "config:clear" },
  { cmd: "config:cache", icon: "save", label: "config:cache" },
  { cmd: "view:clear", icon: "layout", label: "view:clear" },
  { cmd: "route:clear", icon: "route", label: "route:clear" },
  { cmd: "storage:link", icon: "link", label: "storage:link" },
  { cmd: "migrate:status", icon: "table", label: "migrate:status" },
  { cmd: "migrate", icon: "play", label: "migrate", confirm: true },
];

async function openLaravelPanel(name) {
  const panel = document.getElementById(`site-laravel-${name}`);
  if (!panel) return;

  if (panel.style.display !== "none") {
    EventsOff(`laravel-update-output-${name}`);
    EventsOff(`laravel-update-done-${name}`);
    panel.style.display = "none";
    return;
  }

  panel.style.display = "block";

  const site = currentSites.find((s) => s.name === name);
  const version = site?.laravel_version || "";

  const artisanButtons = ARTISAN_COMMANDS.map(
    (c) => `
    <button
      class="btn btn-secondary artisan-btn"
      data-cmd="${c.cmd}"
      style="font-family:var(--font-mono);font-size:10px;padding:4px 9px"
    ><i data-lucide="${c.icon}" style="width:11px;height:11px"></i> ${c.label}</button>
  `,
  ).join("");

  panel.innerHTML = `
    <div class="php-config-body">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:11px;font-weight:600;color:var(--accent3)"><i data-lucide="flame" style="width:13px;height:13px;vertical-align:-2px"></i> Laravel</span>
          ${version ? `<span style="font-size:10px;padding:1px 8px;border-radius:999px;background:rgba(255,99,35,0.12);color:var(--accent3);font-family:var(--font-mono)">${escapeHtml(version)}</span>` : ""}
        </div>
        <button class="btn btn-secondary" id="laravel-update-btn-${name}" style="font-size:11px;gap:5px">
          <i data-lucide="arrow-up-circle" style="width:12px;height:12px"></i> ${t("sites.laravel_upgrade")}
        </button>
      </div>
      <div style="font-size:10px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px">${t("sites.laravel_artisan")}</div>
      <div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px">
        ${artisanButtons}
      </div>
      <pre id="laravel-output-${name}" class="log-viewer" style="min-height:48px;max-height:200px;font-size:10px;display:none"></pre>
    </div>
  `;

  setTimeout(() => createIcons({ icons }), 0);

  // Artisan command buttons
  panel.querySelectorAll(".artisan-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const cmd = btn.dataset.cmd;
      const isConfirm = ARTISAN_COMMANDS.find((c) => c.cmd === cmd)?.confirm;
      if (isConfirm) {
        const ok = await confirm(
          "Artisan",
          t("sites.laravel_migrate_confirm"),
          "warn",
        );
        if (!ok) return;
      }

      const outputEl = document.getElementById(`laravel-output-${name}`);
      outputEl.style.display = "block";
      outputEl.style.color = "";
      outputEl.textContent = t("sites.laravel_running");

      setLaravelPanelBusy(panel, true);
      const result = await RunArtisan(name, site?.php ?? "", cmd);
      setLaravelPanelBusy(panel, false);

      const isError = result.startsWith("ERROR:");
      outputEl.style.color = isError ? "var(--danger)" : "";
      outputEl.textContent = result || "(no output)";
    });
  });

  // Upgrade button
  document.getElementById(`laravel-update-btn-${name}`)?.addEventListener("click", async () => {
    const ok = await confirm("Laravel", t("sites.laravel_update_confirm"), "warn");
    if (!ok) return;

    const outputEl = document.getElementById(`laravel-output-${name}`);
    outputEl.style.display = "block";
    outputEl.style.color = "";
    outputEl.innerHTML = "";

    const updateBtn = document.getElementById(`laravel-update-btn-${name}`);
    updateBtn.disabled = true;
    updateBtn.innerHTML = `<span class="spinner"></span> ${t("sites.laravel_updating")}`;
    setLaravelPanelBusy(panel, true);

    const appendLine = (line) => {
      const span = document.createElement("span");
      span.textContent = line + "\n";
      outputEl.appendChild(span);
      outputEl.scrollTop = outputEl.scrollHeight;
    };

    EventsOn("laravel-update-output", appendLine);
    EventsOn("laravel-update-done", async (ok) => {
      EventsOff("laravel-update-output");
      EventsOff("laravel-update-done");

      setLaravelPanelBusy(panel, false);
      updateBtn.disabled = false;
      updateBtn.innerHTML = `<i data-lucide="arrow-up-circle" style="width:12px;height:12px"></i> ${t("sites.laravel_upgrade")}`;
      createIcons({ icons });

      if (ok) {
        updateBtn.style.color = "var(--good)";
        appendLine("\n✓ " + t("sites.laravel_update_done"));
        // Refresh sites to pick up new Laravel version
        await renderSites();
      } else {
        appendLine("\n✗ " + t("sites.laravel_update_error"));
        outputEl.style.color = "var(--danger)";
      }
    });

    RunLaravelUpdate(name, site?.php ?? "");
  });
}

function setLaravelPanelBusy(panel, busy) {
  panel.querySelectorAll(".artisan-btn").forEach((b) => (b.disabled = busy));
}
