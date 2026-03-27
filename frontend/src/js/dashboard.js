import {
  GetDashboardVersions,
  GetServicesStatus,
  GetSystemStats,
  IsOnline,
  CheckPortConflicts,
  KillProcess,
} from "../../wailsjs/go/main/App";
import { t } from "./i18n.js";

let statsInterval, servicesInterval, onlineInterval, conflictsInterval;

function timeAgo(isoString) {
  if (!isoString) return "";
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 60) return t("dash.just_now");
  if (diff < 3600) return Math.floor(diff / 60) + "min ago";
  if (diff < 86400) return Math.floor(diff / 3600) + "h ago";
  return Math.floor(diff / 86400) + "d ago";
}

function updateStats() {
  GetSystemStats().then((s) => {
    document.getElementById("cpu-val").textContent = s.cpu + "%";
    document.getElementById("cpu-sub").textContent = t("dash.used");
    document.getElementById("cpu-gauge").style.width = s.cpu + "%";

    document.getElementById("ram-val").textContent = s.ram_used + " GB";
    document.getElementById("ram-sub").textContent =
      s.ram_used + " GB " + t("dash.of") + " " + s.ram_total + " GB";
    document.getElementById("ram-gauge").style.width = s.ram_percent + "%";

    document.getElementById("disk-val").textContent = s.disk_percent + "%";
    const driveLabel = s.disk_drive ? s.disk_drive + " · " : "";
    document.getElementById("disk-sub").textContent =
      driveLabel + s.disk_used + " GB " + t("dash.of") + " " + s.disk_total + " GB";
    document.getElementById("disk-gauge").style.width = s.disk_percent + "%";

    document.getElementById("uptime-val").textContent = s.uptime;
    document.getElementById("uptime-sub").textContent = t("dash.system_active");
  });
}

function togglePhpGroup() {
  const group = document.getElementById("php-group-list");
  const arrow = document.getElementById("php-group-arrow");
  if (!group) return;
  if (group.style.display === "none") {
    group.style.display = "flex";
    if (arrow) arrow.textContent = "▼";
  } else {
    group.style.display = "none";
    if (arrow) arrow.textContent = "▶";
  }
}

function updateServices() {
  const phpGroupOpen =
    document.getElementById("php-group-list")?.style.display === "flex";

  GetServicesStatus().then((services) => {
    const list = document.getElementById("services-list");
    if (!list) return;
    list.innerHTML = "";

    const icons = {
      Nginx: { letter: "N", color: "var(--nginx)", bg: "rgba(0,150,57,0.12)" },
      Redis: { letter: "R", color: "var(--redis)", bg: "rgba(220,56,44,0.1)" },
      MySQL: { letter: "M", color: "var(--mysql)", bg: "rgba(0,97,138,0.12)" },
    };

    const single = services.filter((s) => s.type === "single");
    const phpServices = services.filter((s) => s.type === "php");

    single.forEach((s) => {
      const icon = icons[s.name] || {
        letter: "?",
        color: "var(--text)",
        bg: "var(--bg3)",
      };
      const tag = s.running
        ? '<span class="tag tag-active">RUNNING</span>'
        : '<span class="tag tag-inactive">STOPPED</span>';

      const versionBadge = s.version
        ? `<span class="version-badge" style="font-size:10px;color:${icon.color};border-color:${icon.color}33">v${s.version}</span>`
        : "";
      list.innerHTML += `
                <div class="service-item">
                    <div class="service-icon" style="background:${icon.bg};color:${icon.color}">${icon.letter}</div>
                    <div class="service-info">
                        <div class="service-name">${s.name}</div>
                        <div class="service-detail" style="display:flex;align-items:center;gap:5px">${versionBadge}${s.running ? t("dash.active") : t("dash.stopped")}</div>
                    </div>
                    <div class="service-status">${tag}</div>
                </div>
            `;
    });

    if (phpServices.length > 0) {
      const runningCount = phpServices.filter((s) => s.running).length;
      const groupTag =
        runningCount > 0
          ? `<span class="tag tag-active">${runningCount}/${phpServices.length} RUNNING</span>`
          : `<span class="tag tag-inactive">STOPPED</span>`;

      list.innerHTML += `
                <div class="service-item" id="php-group-header" style="cursor:pointer">
                    <div class="service-icon" style="background:rgba(136,146,191,0.1);color:var(--php)">P</div>
                    <div class="service-info">
                        <div class="service-name">PHP-FPM</div>
                        <div class="service-detail">${phpServices.length} ${t("dash.versions_installed")}</div>
                    </div>
                    <div class="service-status" style="flex-direction:row;align-items:center;gap:8px">
                        ${groupTag}
                        <span id="php-group-arrow" style="color:var(--text3);font-size:12px">▶</span>
                    </div>
                </div>
                <div id="php-group-list" style="display:none;flex-direction:column;gap:6px;padding:4px 0 4px 16px">
                    ${[...phpServices]
                      .sort((a, b) =>
                        b.version.localeCompare(a.version, undefined, {
                          numeric: true,
                        }),
                      )
                      .map(
                        (s) => `
                        <div class="service-item" style="background:rgba(136,146,191,0.03)">
                            <div class="service-icon" style="background:rgba(136,146,191,0.1);color:var(--php);font-size:12px">P</div>
                            <div class="service-info">
                                <div class="service-name">PHP ${s.version}</div>
                                <div class="service-detail">port :${s.port}</div>
                            </div>
                            <div class="service-status">
                                ${
                                  s.running
                                    ? '<span class="tag tag-active">RUNNING</span>'
                                    : '<span class="tag tag-inactive">STOPPED</span>'
                                }
                            </div>
                        </div>
                    `,
                      )
                      .join("")}
                </div>
            `;

      document
        .getElementById("php-group-header")
        ?.addEventListener("click", togglePhpGroup);
    }

    if (phpGroupOpen) {
      const group = document.getElementById("php-group-list");
      const arrow = document.getElementById("php-group-arrow");
      if (group) {
        group.style.display = "flex";
        if (arrow) arrow.textContent = "▼";
      }
    }

    if (services.length === 0) {
      list.innerHTML = `<div style="color:var(--text3);font-size:13px">${t("dash.no_services")}</div>`;
    }
  });
}

function updateOnlineStatus() {
  IsOnline().then((online) => {
    const dot = document.querySelector(".status-dot");
    const hostname = document.getElementById("hostname");
    if (!dot || !hostname) return;
    if (online) {
      dot.style.background = "var(--good)";
      hostname.textContent = "localhost · " + t("dash.online");
    } else {
      dot.style.background = "var(--danger)";
      hostname.textContent = "localhost · " + t("dash.offline");
    }
  });
}

export function init() {
  const renderVersion = (elId, r) => {
    const el = document.getElementById(elId);
    if (!el) return;
    const icon = r.from_cache ? "⟳" : "✓";
    const iconColor = r.from_cache ? "var(--text3)" : "var(--good)";
    const ago = timeAgo(r.cached_at);
    const agoHtml = ago ? ` <span style="color:var(--text3);font-size:10px">${ago}</span>` : "";
    el.innerHTML = `latest: ${r.version} <span style="color:${iconColor}">${icon}</span>${agoHtml}`;
  };

  GetDashboardVersions().then((v) => {
    renderVersion("latest-nginx", v.nginx);
    renderVersion("latest-php", v.php);
    renderVersion("latest-redis", v.redis);
  });

  const infoBtn = document.getElementById("versions-info-btn");
  const infoPopup = document.getElementById("versions-info-popup");
  if (infoBtn && infoPopup) {
    infoBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      infoPopup.classList.toggle("open");
    });
    document.addEventListener("click", () =>
      infoPopup.classList.remove("open"),
    );
  }

  updateStats();
  updateServices();
  updateOnlineStatus();
  updatePortConflicts();

  statsInterval = setInterval(updateStats, 5000);
  servicesInterval = setInterval(updateServices, 5000);
  onlineInterval = setInterval(updateOnlineStatus, 10000);
  conflictsInterval = setInterval(updatePortConflicts, 10000);
}

export function destroy() {
  clearInterval(statsInterval);
  clearInterval(servicesInterval);
  clearInterval(onlineInterval);
  clearInterval(conflictsInterval);
}

// ── Port conflicts ─────────────────────────────────────────────────────────────

async function updatePortConflicts() {
  const panel = document.getElementById("port-conflicts-panel");
  const list = document.getElementById("port-conflicts-list");
  if (!panel || !list) return;

  const conflicts = await CheckPortConflicts();

  if (!conflicts || conflicts.length === 0) {
    panel.style.display = "none";
    return;
  }

  panel.style.display = "block";
  list.innerHTML = conflicts.map((c) => `
    <div class="version-item" style="margin-bottom:4px">
      <div class="version-row" style="gap:10px">
        <span class="version-badge" style="color:var(--danger);border-color:rgba(220,56,44,0.3);font-family:var(--font-mono)">:${c.port}</span>
        <span style="font-size:12px;color:var(--text2);font-weight:600">${c.service}</span>
        <span style="font-size:11px;color:var(--text3)">${t("dash.blocked_by")} <strong style="color:var(--text)">${c.process_name}</strong> (PID ${c.pid})</span>
      </div>
      <div class="version-actions">
        <button class="btn btn-danger" style="font-size:11px" data-pid="${c.pid}" data-port="${c.port}" id="kill-btn-${c.pid}">${t("dash.kill_process")}</button>
      </div>
    </div>
  `).join("");

  conflicts.forEach((c) => {
    document.getElementById(`kill-btn-${c.pid}`)?.addEventListener("click", async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true;
      await KillProcess(c.pid);
      await updatePortConflicts();
    });
  });
}
