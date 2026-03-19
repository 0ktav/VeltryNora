import {
  GetLogs,
  ClearLog,
  GetAppLog,
  ClearAppLog,
} from "../../wailsjs/go/main/App";
import { confirm } from "./modal.js";
import { addListener } from "./utils.js";
import { t } from "./i18n.js";
import { createIcons, icons } from "lucide";

let currentLogType = "error";
let refreshInterval = null;

// ── Nginx log ──────────────────────────────────────────────────────────────────

async function loadLog() {
  const el = document.getElementById("log-content");
  if (!el) return;

  const lines = await GetLogs(currentLogType, 200);

  if (!lines || lines.length === 0) {
    el.innerHTML = `<span style="color:var(--text3)">${t("logs.empty")}</span>`;
    return;
  }

  el.textContent = lines.join("\n");
  el.scrollTop = el.scrollHeight;
}

// ── App log ────────────────────────────────────────────────────────────────────

async function loadAppLog() {
  const el = document.getElementById("applog-content");
  if (!el) return;

  const lines = await GetAppLog();

  if (!lines || lines.length === 0) {
    el.innerHTML = `<span style="color:var(--text3)">${t("logs.app_log_empty")}</span>`;
    return;
  }

  el.innerHTML = lines
    .map((line) => {
      const escaped = line.replace(/&/g, "&amp;").replace(/</g, "&lt;");
      if (line.includes("] ERROR:"))
        return `<span style="color:var(--danger)">${escaped}</span>`;
      if (line.includes("] WARN:"))
        return `<span style="color:var(--warn)">${escaped}</span>`;
      return `<span style="color:var(--text3)">${escaped}</span>`;
    })
    .join("\n");

  el.scrollTop = el.scrollHeight;
}

// ── Init ───────────────────────────────────────────────────────────────────────

export function init() {
  createIcons({ icons });

  loadLog();
  loadAppLog();

  document
    .getElementById("log-tab-selector")
    ?.addEventListener("click", (e) => {
      const btn = e.target.closest(".lang-btn[data-log]");
      if (!btn) return;
      currentLogType = btn.dataset.log;
      document.querySelectorAll("#log-tab-selector .lang-btn").forEach((b) => {
        b.classList.toggle("active", b.dataset.log === currentLogType);
      });
      loadLog();
    });

  addListener("log-refresh-btn", loadLog);

  addListener("log-clear-btn", async () => {
    const ok = await confirm(
      t("logs.clear_title"),
      t("logs.clear_confirm"),
      "warn",
    );
    if (!ok) return;
    ClearLog(currentLogType);
    setTimeout(loadLog, 200);
  });

  addListener("applog-refresh-btn", loadAppLog);

  addListener("applog-clear-btn", async () => {
    const ok = await confirm(
      t("logs.clear_title"),
      t("logs.app_log_clear_confirm"),
      "warn",
    );
    if (!ok) return;
    await ClearAppLog();
    loadAppLog();
  });

  refreshInterval = setInterval(() => {
    loadLog();
    loadAppLog();
  }, 5000);
}

export function destroy() {
  clearInterval(refreshInterval);
}
