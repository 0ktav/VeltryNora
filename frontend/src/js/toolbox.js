import {
  CheckComposer,
  InstallComposer,
  CheckGit,
  DownloadGit,
  CheckNodeJS,
  DownloadNodeJS,
  GetBasePath,
} from "../../wailsjs/go/main/App";
import { EventsOn, EventsOff } from "../../wailsjs/runtime/runtime.js";
import { createIcons, icons } from "lucide";
import { t } from "./i18n.js";
import { escapeHtml } from "./utils.js";
import { confirmInstall } from "./modal.js";

// ── Init ───────────────────────────────────────────────────────────────────────

export async function init() {
  await Promise.all([renderComposerCard(), renderGitCard(), renderNodeCard()]);
}

// ── Composer ───────────────────────────────────────────────────────────────────

async function renderComposerCard() {
  const card = document.getElementById("composer-card");
  if (!card) return;

  card.innerHTML = `<div style="color:var(--text3)">${t("common.loading")}</div>`;

  const version = await CheckComposer();

  if (version) {
    card.innerHTML = `
      <div class="version-item">
        <div class="version-row">
          <div style="display:flex;align-items:center;gap:10px">
            <div class="service-icon" style="background:rgba(47,155,255,0.1);color:var(--accent2);font-size:13px;font-weight:700">C</div>
            <div>
              <div style="font-weight:600;color:var(--text)">${escapeHtml(version)}</div>
              <div style="color:var(--text3);margin-top:2px">${t("utils.composer_path")}</div>
            </div>
          </div>
          <div class="version-actions">
            <span class="version-badge" style="color:var(--good);border-color:rgba(62,207,110,0.3)">✓ ${t("utils.installed")}</span>
            <button class="btn btn-secondary btn-icon" id="composer-reinstall-btn" title="${t("utils.reinstall")}">
              <i data-lucide="refresh-cw"></i>
            </button>
          </div>
        </div>
      </div>
    `;
    setTimeout(() => createIcons({ icons }), 0);
    document
      .getElementById("composer-reinstall-btn")
      ?.addEventListener("click", () => installComposer(true));
  } else {
    card.innerHTML = `
      <div class="version-item">
        <div class="version-row">
          <div style="display:flex;align-items:center;gap:10px">
            <div class="service-icon" style="background:rgba(47,155,255,0.08);color:var(--text3);font-size:13px;font-weight:700">C</div>
            <div>
              <div style="font-weight:600;color:var(--text)">Composer</div>
              <div style="color:var(--text3);margin-top:2px">${t("utils.composer_desc")}</div>
            </div>
          </div>
          <div class="version-actions">
            <span class="version-badge" style="color:var(--warn);border-color:rgba(224,168,34,0.3)">${t("utils.not_installed")}</span>
            <button class="btn btn-primary btn-icon" id="composer-install-btn" title="${t("common.install")}">
              <i data-lucide="download"></i>
            </button>
          </div>
        </div>
      </div>
    `;
    setTimeout(() => createIcons({ icons }), 0);
    document
      .getElementById("composer-install-btn")
      ?.addEventListener("click", () => installComposer(false));
  }
}

// ── Git ────────────────────────────────────────────────────────────────────────

async function renderGitCard() {
  const card = document.getElementById("git-card");
  if (!card) return;

  card.innerHTML = `<div style="color:var(--text3)">${t("common.loading")}</div>`;

  const version = await CheckGit();

  if (version) {
    card.innerHTML = `
      <div class="version-item">
        <div class="version-row">
          <div style="display:flex;align-items:center;gap:10px">
            <div class="service-icon" style="background:rgba(47,155,255,0.1);color:var(--accent2);font-size:13px;font-weight:700">G</div>
            <div>
              <div style="font-weight:600;color:var(--text)">${escapeHtml(version)}</div>
              <div style="color:var(--text3);margin-top:2px">${t("utils.git_path")}</div>
            </div>
          </div>
          <div class="version-actions">
            <span class="version-badge" style="color:var(--good);border-color:rgba(62,207,110,0.3)">✓ ${t("utils.installed")}</span>
            <button class="btn btn-secondary btn-icon" id="git-reinstall-btn" title="${t("utils.reinstall")}">
              <i data-lucide="refresh-cw"></i>
            </button>
          </div>
        </div>
      </div>
    `;
    setTimeout(() => createIcons({ icons }), 0);
    document
      .getElementById("git-reinstall-btn")
      ?.addEventListener("click", () => downloadTool("git"));
  } else {
    card.innerHTML = `
      <div class="version-item">
        <div class="version-row">
          <div style="display:flex;align-items:center;gap:10px">
            <div class="service-icon" style="background:rgba(47,155,255,0.08);color:var(--text3);font-size:13px;font-weight:700">G</div>
            <div>
              <div style="font-weight:600;color:var(--text)">Git</div>
              <div style="color:var(--text3);margin-top:2px">${t("utils.git_desc")}</div>
            </div>
          </div>
          <div class="version-actions">
            <span class="version-badge" style="color:var(--warn);border-color:rgba(224,168,34,0.3)">${t("utils.not_installed")}</span>
            <button class="btn btn-primary btn-icon" id="git-install-btn" title="${t("common.install")}">
              <i data-lucide="download"></i>
            </button>
          </div>
        </div>
      </div>
    `;
    setTimeout(() => createIcons({ icons }), 0);
    document
      .getElementById("git-install-btn")
      ?.addEventListener("click", () => downloadTool("git"));
  }
}

// ── Node.js ────────────────────────────────────────────────────────────────────

async function renderNodeCard() {
  const card = document.getElementById("nodejs-card");
  if (!card) return;

  card.innerHTML = `<div style="color:var(--text3)">${t("common.loading")}</div>`;

  const version = await CheckNodeJS();

  if (version) {
    card.innerHTML = `
      <div class="version-item">
        <div class="version-row">
          <div style="display:flex;align-items:center;gap:10px">
            <div class="service-icon" style="background:rgba(62,207,110,0.1);color:var(--good);font-size:11px;font-weight:700">JS</div>
            <div>
              <div style="font-weight:600;color:var(--text)">${escapeHtml(version)}</div>
              <div style="color:var(--text3);margin-top:2px">${t("utils.nodejs_path")}</div>
            </div>
          </div>
          <div class="version-actions">
            <span class="version-badge" style="color:var(--good);border-color:rgba(62,207,110,0.3)">✓ ${t("utils.installed")}</span>
            <button class="btn btn-secondary btn-icon" id="nodejs-reinstall-btn" title="${t("utils.reinstall")}">
              <i data-lucide="refresh-cw"></i>
            </button>
          </div>
        </div>
      </div>
    `;
    setTimeout(() => createIcons({ icons }), 0);
    document
      .getElementById("nodejs-reinstall-btn")
      ?.addEventListener("click", () => downloadTool("nodejs"));
  } else {
    card.innerHTML = `
      <div class="version-item">
        <div class="version-row">
          <div style="display:flex;align-items:center;gap:10px">
            <div class="service-icon" style="background:rgba(62,207,110,0.08);color:var(--text3);font-size:11px;font-weight:700">JS</div>
            <div>
              <div style="font-weight:600;color:var(--text)">Node.js</div>
              <div style="color:var(--text3);margin-top:2px">${t("utils.nodejs_desc")}</div>
            </div>
          </div>
          <div class="version-actions">
            <span class="version-badge" style="color:var(--warn);border-color:rgba(224,168,34,0.3)">${t("utils.not_installed")}</span>
            <button class="btn btn-primary btn-icon" id="nodejs-install-btn" title="${t("common.install")}">
              <i data-lucide="download"></i>
            </button>
          </div>
        </div>
      </div>
    `;
    setTimeout(() => createIcons({ icons }), 0);
    document
      .getElementById("nodejs-install-btn")
      ?.addEventListener("click", () => downloadTool("nodejs"));
  }
}

// ── Generic download with progress bar ────────────────────────────────────────

async function downloadTool(tool) {
  const cardId = tool === "git" ? "git-card" : "nodejs-card";
  const event =
    tool === "git" ? "git:download-progress" : "nodejs:download-progress";
  const card = document.getElementById(cardId);
  if (!card) return;

  const basePath = await GetBasePath();
  const pathToAdd =
    tool === "git"
      ? basePath + "\\tools\\git\\cmd"
      : basePath + "\\tools\\nodejs";
  const toolLabel = tool === "git" ? "Git" : "Node.js";

  const { ok: confirmed, addToPath } = await confirmInstall(
    t("common.install") + " " + toolLabel,
    pathToAdd
  );
  if (!confirmed) return;

  // Show progress UI
  card.innerHTML = `
    <div style="padding:4px 0">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span style="color:var(--text3);font-size:12px">${t("utils.downloading")}</span>
        <span id="${tool}-progress-pct" style="color:var(--text3);font-size:12px">0%</span>
      </div>
      <div style="background:var(--bg3);border-radius:4px;height:6px;overflow:hidden;border:1px solid var(--border)">
        <div id="${tool}-progress-bar" style="height:100%;width:0%;background:var(--accent2);border-radius:4px;transition:width 0.2s"></div>
      </div>
    </div>
  `;

  const onProgress = (percent) => {
    const bar = document.getElementById(`${tool}-progress-bar`);
    const pct = document.getElementById(`${tool}-progress-pct`);
    if (bar) bar.style.width = percent + "%";
    if (pct) pct.textContent = percent + "%";
  };

  let errorMsg = "";
  const onError = (msg) => {
    errorMsg = msg;
  };

  EventsOn(event, onProgress);
  EventsOn(`${tool}:download-error`, onError);

  const ok =
    tool === "git"
      ? await DownloadGit(addToPath)
      : await DownloadNodeJS(addToPath);

  EventsOff(event);
  EventsOff(`${tool}:download-error`);

  if (ok) {
    if (tool === "git") await renderGitCard();
    else await renderNodeCard();

    const updatedCard = document.getElementById(cardId);
    if (updatedCard && addToPath) {
      const note = document.createElement("div");
      note.style.cssText =
        "color:var(--text3);margin-top:8px;padding:8px 10px;background:var(--bg3);border-radius:6px;border:1px solid var(--border)";
      note.textContent = t("utils.path_note_tool");
      updatedCard.appendChild(note);
    }
  } else {
    if (tool === "git") await renderGitCard();
    else await renderNodeCard();

    const updatedCard = document.getElementById(cardId);
    if (updatedCard) {
      const errEl = document.createElement("div");
      errEl.style.cssText = "color:var(--danger);margin-top:8px;font-size:12px";
      errEl.textContent = errorMsg || t("utils.install_failed");
      updatedCard.appendChild(errEl);
    }
  }
}

// ── Composer ───────────────────────────────────────────────────────────────────

async function installComposer(isReinstall) {
  const card = document.getElementById("composer-card");
  if (!card) return;

  const basePath = await GetBasePath();
  const pathToAdd = basePath + "\\tools";

  const { ok: confirmed, addToPath } = await confirmInstall(
    t("common.install") + " Composer",
    pathToAdd
  );
  if (!confirmed) return;

  const btn = card.querySelector("button");
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span>`;
  }

  const ok = await InstallComposer(addToPath);

  if (ok) {
    await renderComposerCard();
    const updatedCard = document.getElementById("composer-card");
    if (updatedCard && addToPath) {
      const note = document.createElement("div");
      note.style.cssText =
        "color:var(--text3);margin-top:8px;padding:8px 10px;background:var(--bg3);border-radius:6px;border:1px solid var(--border)";
      note.textContent = t("utils.path_note");
      updatedCard.appendChild(note);
    }
  } else {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<i data-lucide="${isReinstall ? "refresh-cw" : "download"}"></i>`;
      createIcons({ icons });
    }
    const errEl =
      card.querySelector(".composer-error") || document.createElement("div");
    errEl.className = "composer-error";
    errEl.style.cssText = "color:var(--danger);margin-top:8px";
    errEl.textContent = t("utils.install_failed");
    if (!card.querySelector(".composer-error")) card.appendChild(errEl);
  }
}
