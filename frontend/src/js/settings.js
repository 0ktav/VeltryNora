import { getLang, setLang, translatePage, t } from "./i18n.js";
import { confirm } from "./modal.js";
import {
  GetSettings,
  SaveSettings,
  GetDefaultBasePath,
  BrowseFolder,
  StopAllServices,
} from "../../wailsjs/go/main/App";

let _persistTimer = null;
function debouncedPersist() {
  clearTimeout(_persistTimer);
  _persistTimer = setTimeout(() => persistSettings(), 300);
}

// ── Theme ─────────────────────────────────────────────────────────────────────

export function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

export function loadTheme() {
  const saved = localStorage.getItem("veltrynora-theme") || "dark";
  applyTheme(saved);
}

function saveTheme(theme) {
  localStorage.setItem("veltrynora-theme", theme);
  applyTheme(theme);
}

// ── Settings page ─────────────────────────────────────────────────────────────

function updateLangBtns() {
  const lang = getLang();
  document.querySelectorAll(".lang-btn[data-lang]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === lang);
  });
}

function updateThemeBtns(theme) {
  document.querySelectorAll(".lang-btn[data-theme-val]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.themeVal === theme);
  });
}

export async function init() {
  updateLangBtns();

  // Current theme
  const currentTheme = localStorage.getItem("veltrynora-theme") || "dark";
  updateThemeBtns(currentTheme);

  // Load settings from Go backend
  const s = await GetSettings();

  // Base path
  const pathInput = document.getElementById("base-path-input");
  if (pathInput && s.base_path) {
    pathInput.value = s.base_path;
  }

  // Minimize to tray
  const trayCheckbox = document.getElementById("minimize-to-tray-checkbox");
  if (trayCheckbox) trayCheckbox.checked = s.minimize_to_tray;

  // Auto stop
  const checkbox = document.getElementById("auto-stop-checkbox");
  if (checkbox) checkbox.checked = s.auto_stop;

  // Auto start
  const autoStartCb = document.getElementById("auto-start-checkbox");
  if (autoStartCb) autoStartCb.checked = s.auto_start;

  // Start on boot
  const bootCb = document.getElementById("start-on-boot-checkbox");
  if (bootCb) bootCb.checked = s.start_on_boot;

  // Nginx workers
  const workersSelect = document.getElementById("nginx-workers-select");
  if (workersSelect) workersSelect.value = String(s.nginx_workers ?? 0);

  // Nginx keepalive
  const keepaliveInput = document.getElementById("nginx-keepalive-input");
  if (keepaliveInput) keepaliveInput.value = String(s.nginx_keepalive ?? 65);

  // Show app log
  const showLogCb = document.getElementById("show-app-log-checkbox");
  if (showLogCb) {
    showLogCb.checked = s.show_app_log;
    const logPanel = document.getElementById("app-log-panel");
    if (logPanel) logPanel.style.display = s.show_app_log ? "" : "none";
  }

  // ── Language buttons ────────────────────────────────────────────────────────
  document.getElementById("lang-selector")?.addEventListener("click", (e) => {
    const btn = e.target.closest(".lang-btn[data-lang]");
    if (!btn) return;
    setLang(btn.dataset.lang);
    translatePage();
    updateLangBtns();
    persistSettings();
  });

  // ── Theme buttons ───────────────────────────────────────────────────────────
  document.getElementById("theme-selector")?.addEventListener("click", (e) => {
    const btn = e.target.closest(".lang-btn[data-theme-val]");
    if (!btn) return;
    const theme = btn.dataset.themeVal;
    saveTheme(theme);
    updateThemeBtns(theme);
    persistSettings();
  });

  // ── Base path browse ────────────────────────────────────────────────────────
  document
    .getElementById("base-path-browse-btn")
    ?.addEventListener("click", async () => {
      const ok = await confirm(
        t("settings.base_path_change_title"),
        t("settings.base_path_change_body"),
        "warn",
      );
      if (!ok) return;
      await StopAllServices();
      const path = await BrowseFolder();
      if (path && pathInput) {
        pathInput.value = path;
        await persistSettings();
      }
    });

  // ── Base path reset ─────────────────────────────────────────────────────────
  document
    .getElementById("base-path-reset-btn")
    ?.addEventListener("click", async () => {
      const ok = await confirm(
        t("settings.base_path_change_title"),
        t("settings.base_path_change_body"),
        "warn",
      );
      if (!ok) return;
      await StopAllServices();
      if (pathInput) pathInput.value = "";
      await persistSettings();
    });

  // ── Base path manual input ──────────────────────────────────────────────────
  pathInput?.addEventListener("change", () => debouncedPersist());

  // ── Minimize to tray toggle ──────────────────────────────────────────────────
  trayCheckbox?.addEventListener("change", () => debouncedPersist());

  // ── Auto stop toggle ────────────────────────────────────────────────────────
  checkbox?.addEventListener("change", () => debouncedPersist());

  // ── Auto start toggle ────────────────────────────────────────────────────────
  document
    .getElementById("auto-start-checkbox")
    ?.addEventListener("change", () => debouncedPersist());

  // ── Start on boot toggle ─────────────────────────────────────────────────────
  document
    .getElementById("start-on-boot-checkbox")
    ?.addEventListener("change", () => debouncedPersist());

  // ── Nginx workers ─────────────────────────────────────────────────────────────
  document
    .getElementById("nginx-workers-select")
    ?.addEventListener("change", () => debouncedPersist());

  // ── Nginx keepalive ───────────────────────────────────────────────────────────
  document
    .getElementById("nginx-keepalive-input")
    ?.addEventListener("change", () => debouncedPersist());

  // ── Show app log toggle ───────────────────────────────────────────────────────
  document
    .getElementById("show-app-log-checkbox")
    ?.addEventListener("change", (e) => {
      const logPanel = document.getElementById("app-log-panel");
      if (logPanel) logPanel.style.display = e.target.checked ? "" : "none";
      debouncedPersist();
    });
}

async function persistSettings() {
  const theme = localStorage.getItem("veltrynora-theme") || "dark";

  await SaveSettings({
    base_path: document.getElementById("base-path-input")?.value?.trim() || "",
    auto_stop: document.getElementById("auto-stop-checkbox")?.checked || false,
    auto_start:
      document.getElementById("auto-start-checkbox")?.checked || false,
    start_on_boot:
      document.getElementById("start-on-boot-checkbox")?.checked || false,
    minimize_to_tray:
      document.getElementById("minimize-to-tray-checkbox")?.checked || false,
    nginx_workers: parseInt(
      document.getElementById("nginx-workers-select")?.value || "0",
    ),
    nginx_keepalive: parseInt(
      document.getElementById("nginx-keepalive-input")?.value || "65",
    ),
    show_app_log:
      document.getElementById("show-app-log-checkbox")?.checked || false,
    theme,
    language: getLang(),
  });
}
