import { t } from "./i18n.js";

export function confirm(title, message) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";

    const modal = document.createElement("div");
    modal.className = "modal";

    const titleEl = document.createElement("div");
    titleEl.className = "modal-title";
    titleEl.textContent = "\u26A0 " + title;

    const bodyEl = document.createElement("div");
    bodyEl.className = "modal-body";
    bodyEl.innerHTML = message;

    const footer = document.createElement("div");
    footer.className = "modal-footer";

    const cancelBtn = document.createElement("button");
    cancelBtn.className = "btn btn-secondary";
    cancelBtn.textContent = t("common.cancel");

    const confirmBtn = document.createElement("button");
    confirmBtn.className = "btn btn-danger";
    confirmBtn.textContent = t("common.confirm");

    footer.append(cancelBtn, confirmBtn);
    modal.append(titleEl, bodyEl, footer);
    overlay.append(modal);
    document.body.appendChild(overlay);

    cancelBtn.addEventListener("click", () => {
      overlay.remove();
      resolve(false);
    });
    confirmBtn.addEventListener("click", () => {
      overlay.remove();
      resolve(true);
    });
  });
}

export function confirmWithCheckbox(title, message, checkboxLabel) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";

    const modal = document.createElement("div");
    modal.className = "modal";

    const titleEl = document.createElement("div");
    titleEl.className = "modal-title";
    titleEl.textContent = "\u26A0 " + title;

    const bodyEl = document.createElement("div");
    bodyEl.className = "modal-body";
    bodyEl.style.marginBottom = "0";
    bodyEl.innerHTML = message;

    const checkWrap = document.createElement("label");
    checkWrap.style.cssText =
      "display:flex;align-items:center;gap:8px;margin-top:14px;font-size:13px;color:var(--text);cursor:pointer;user-select:none";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.style.cssText =
      "width:14px;height:14px;accent-color:var(--danger);cursor:pointer;flex-shrink:0";

    const checkLabel = document.createElement("span");
    checkLabel.textContent = checkboxLabel;

    checkWrap.append(checkbox, checkLabel);
    bodyEl.appendChild(checkWrap);

    const footer = document.createElement("div");
    footer.className = "modal-footer";
    footer.style.marginTop = "20px";

    const cancelBtn = document.createElement("button");
    cancelBtn.className = "btn btn-secondary";
    cancelBtn.textContent = t("common.cancel");

    const confirmBtn = document.createElement("button");
    confirmBtn.className = "btn btn-danger";
    confirmBtn.textContent = t("common.confirm");

    footer.append(cancelBtn, confirmBtn);
    modal.append(titleEl, bodyEl, footer);
    overlay.append(modal);
    document.body.appendChild(overlay);

    cancelBtn.addEventListener("click", () => {
      overlay.remove();
      resolve({ ok: false, checked: false });
    });
    confirmBtn.addEventListener("click", () => {
      overlay.remove();
      resolve({ ok: true, checked: checkbox.checked });
    });
  });
}

// confirmInstall — shows a tool install confirmation with a PATH checkbox.
// Checkbox is checked by default. Returns { ok: boolean, addToPath: boolean }.
export function confirmInstall(title, pathToAdd) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";

    const modal = document.createElement("div");
    modal.className = "modal";

    const titleEl = document.createElement("div");
    titleEl.className = "modal-title";
    titleEl.style.color = "var(--accent2)";
    titleEl.textContent = "\u2193 " + title;

    const bodyEl = document.createElement("div");
    bodyEl.className = "modal-body";
    bodyEl.style.marginBottom = "0";

    const checkWrap = document.createElement("label");
    checkWrap.style.cssText =
      "display:flex;align-items:flex-start;gap:8px;font-size:13px;color:var(--text);cursor:pointer;user-select:none";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = true;
    checkbox.style.cssText =
      "width:14px;height:14px;margin-top:1px;accent-color:var(--accent2);cursor:pointer;flex-shrink:0";

    const checkLabelWrap = document.createElement("div");
    checkLabelWrap.style.cssText = "display:flex;flex-direction:column;gap:2px";

    const checkLabel = document.createElement("span");
    checkLabel.textContent = t("utils.add_to_path");

    const pathEl = document.createElement("span");
    pathEl.style.cssText =
      "font-size:11px;color:var(--text3);font-family:monospace;word-break:break-all";
    pathEl.textContent = pathToAdd;

    checkLabelWrap.append(checkLabel, pathEl);
    checkWrap.append(checkbox, checkLabelWrap);
    bodyEl.appendChild(checkWrap);

    const footer = document.createElement("div");
    footer.className = "modal-footer";
    footer.style.marginTop = "20px";

    const cancelBtn = document.createElement("button");
    cancelBtn.className = "btn btn-secondary";
    cancelBtn.textContent = t("common.cancel");

    const installBtn = document.createElement("button");
    installBtn.className = "btn btn-primary";
    installBtn.textContent = t("common.install");

    footer.append(cancelBtn, installBtn);
    modal.append(titleEl, bodyEl, footer);
    overlay.append(modal);
    document.body.appendChild(overlay);

    cancelBtn.addEventListener("click", () => {
      overlay.remove();
      resolve({ ok: false, addToPath: false });
    });
    installBtn.addEventListener("click", () => {
      overlay.remove();
      resolve({ ok: true, addToPath: checkbox.checked });
    });
  });
}

export function alert(title, message, type = "info") {
  return new Promise((resolve) => {
    const colors = {
      info: "var(--accent)",
      warn: "var(--warn)",
      danger: "var(--danger)",
    };
    const icons = { info: "\u2139", warn: "\u26A0", danger: "\u2715" };

    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";

    const modal = document.createElement("div");
    modal.className = "modal";

    const titleEl = document.createElement("div");
    titleEl.className = "modal-title";
    titleEl.style.color = colors[type] ?? "var(--accent)";
    titleEl.textContent = (icons[type] ?? "\u2139") + " " + title;

    const bodyEl = document.createElement("div");
    bodyEl.className = "modal-body";
    bodyEl.innerHTML = message;

    const footer = document.createElement("div");
    footer.className = "modal-footer";

    const okBtn = document.createElement("button");
    okBtn.className = "btn btn-secondary";
    okBtn.textContent = "OK";

    footer.append(okBtn);
    modal.append(titleEl, bodyEl, footer);
    overlay.append(modal);
    document.body.appendChild(overlay);

    okBtn.addEventListener("click", () => {
      overlay.remove();
      resolve();
    });
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        overlay.remove();
        resolve();
      }
    });
  });
}
