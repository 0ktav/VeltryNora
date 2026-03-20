import {
  GetHostsEntries,
  AddHostEntry,
  ToggleHostEntry,
  DeleteHostEntry,
  DeleteHostEntries,
} from "../../wailsjs/go/main/App";
import { confirm, alert } from "./modal.js";
import { escapeHtml } from "./utils.js";
import { t } from "./i18n.js";
import { createIcons, icons } from "lucide";

// ── Init ───────────────────────────────────────────────────────────────────────

export async function init() {
  await renderEntries();

  document.getElementById("hosts-add-btn")?.addEventListener("click", addEntry);

  document.getElementById("hosts-host-input")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addEntry();
  });

  document.getElementById("hosts-list")?.addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const { action, host } = btn.dataset;
    if (action === "toggle") await toggleEntry(host);
    else if (action === "delete") await deleteEntry(host);
  });

  document.getElementById("hosts-list")?.addEventListener("change", (e) => {
    if (e.target.matches(".hosts-cb")) {
      updateBatchBar();
    } else if (e.target.matches("#hosts-select-all")) {
      document.querySelectorAll(".hosts-cb").forEach((cb) => {
        cb.checked = e.target.checked;
      });
      updateBatchBar();
    }
  });

  document.getElementById("hosts-delete-selected")?.addEventListener("click", deleteSelected);
}

// ── Render ─────────────────────────────────────────────────────────────────────

async function renderEntries() {
  const list = document.getElementById("hosts-list");
  if (!list) return;

  const entries = await GetHostsEntries();

  if (entries.length === 0) {
    list.innerHTML = `<div style="color:var(--text3);font-size:11px">${t("hosts.no_entries")}</div>`;
    updateBatchBar();
    return;
  }

  const hasEditable = entries.some((e) => !e.system);

  list.innerHTML = `
    ${hasEditable ? `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid var(--border)">
      <input type="checkbox" id="hosts-select-all" style="width:13px;height:13px;accent-color:var(--accent2);cursor:pointer" />
      <span style="font-size:11px;color:var(--text3)" data-i18n="hosts.select_all">${t("hosts.select_all")}</span>
    </div>` : ""}
    ${entries.map(buildRow).join("")}
  `;

  setTimeout(() => createIcons({ icons }), 0);
  updateBatchBar();
}

function buildRow(entry) {
  const statusColor = entry.enabled ? "var(--good)" : "var(--text3)";
  const ipColor = entry.enabled ? "var(--text)" : "var(--text3)";

  const checkbox = entry.system
    ? `<span style="width:13px;flex-shrink:0"></span>`
    : `<input type="checkbox" class="hosts-cb" data-host="${escapeHtml(entry.host)}" style="width:13px;height:13px;accent-color:var(--accent2);cursor:pointer;flex-shrink:0" />`;

  const actions = entry.system
    ? `<span style="font-size:10px;color:var(--text3);padding:2px 8px;border-radius:4px;background:var(--bg3);border:1px solid var(--border)">${t("hosts.system")}</span>`
    : `
      <button class="btn btn-secondary btn-icon" data-action="toggle" data-host="${escapeHtml(entry.host)}" title="${entry.enabled ? t("hosts.disable") : t("hosts.enable")}">
        <i data-lucide="${entry.enabled ? "pause" : "play"}"></i>
      </button>
      <button class="btn btn-danger btn-icon" data-action="delete" data-host="${escapeHtml(entry.host)}">
        <i data-lucide="trash-2"></i>
      </button>
    `;

  return `
    <div class="version-item-wrap">
      <div class="version-item">
        <div class="version-row" style="gap:10px">
          ${checkbox}
          <span class="version-badge" style="color:${ipColor};border-color:rgba(128,128,128,0.2);font-family:var(--font-mono);font-size:11px">${escapeHtml(entry.ip)}</span>
          <span style="font-size:13px;color:${entry.enabled ? "var(--text)" : "var(--text3)"};${!entry.enabled ? "text-decoration:line-through" : ""}">${escapeHtml(entry.host)}</span>
          <span style="width:7px;height:7px;border-radius:50%;background:${statusColor};flex-shrink:0"></span>
        </div>
        <div class="version-actions">${actions}</div>
      </div>
    </div>
  `;
}

function getCheckedHosts() {
  return [...document.querySelectorAll(".hosts-cb:checked")].map((cb) => cb.dataset.host);
}

function updateBatchBar() {
  const checked = getCheckedHosts();
  const bar = document.getElementById("hosts-batch-bar");
  const countEl = document.getElementById("hosts-selected-count");
  if (!bar) return;
  bar.style.display = checked.length > 0 ? "flex" : "none";
  if (countEl) countEl.textContent = t("hosts.selected_count", { count: checked.length });

  // Sync select-all checkbox
  const all = document.querySelectorAll(".hosts-cb");
  const selectAll = document.getElementById("hosts-select-all");
  if (selectAll && all.length > 0) {
    selectAll.checked = checked.length === all.length;
    selectAll.indeterminate = checked.length > 0 && checked.length < all.length;
  }
}

// ── Actions ────────────────────────────────────────────────────────────────────

async function addEntry() {
  const ipInput = document.getElementById("hosts-ip-input");
  const hostInput = document.getElementById("hosts-host-input");
  const ip = ipInput?.value.trim();
  const host = hostInput?.value.trim();

  if (!ip || !host) {
    await alert(t("common.error"), t("hosts.fields_required"), "warn");
    return;
  }

  const btn = document.getElementById("hosts-add-btn");
  btn.disabled = true;

  const ok = await AddHostEntry(ip, host);
  btn.disabled = false;

  if (!ok) {
    await alert(t("common.error"), t("hosts.add_error"), "danger");
    return;
  }

  ipInput.value = "";
  hostInput.value = "";
  await renderEntries();
}

async function toggleEntry(host) {
  const ok = await ToggleHostEntry(host);
  if (!ok) {
    await alert(t("common.error"), t("hosts.toggle_error"), "danger");
    return;
  }
  await renderEntries();
}

async function deleteEntry(host) {
  const ok = await confirm(
    t("hosts.delete_title"),
    t("hosts.delete_confirm", { host }),
    "warn",
  );
  if (!ok) return;

  const deleted = await DeleteHostEntry(host);
  if (!deleted) {
    await alert(t("common.error"), t("hosts.delete_error"), "danger");
    return;
  }
  await renderEntries();
}

async function deleteSelected() {
  const hostnames = getCheckedHosts();
  if (hostnames.length === 0) return;

  const ok = await confirm(
    t("hosts.delete_title"),
    t("hosts.delete_selected_confirm", { count: hostnames.length }),
    "warn",
  );
  if (!ok) return;

  const deleted = await DeleteHostEntries(hostnames);
  if (!deleted) {
    await alert(t("common.error"), t("hosts.delete_error"), "danger");
    return;
  }
  await renderEntries();
}
