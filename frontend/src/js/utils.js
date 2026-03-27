export function addListener(id, handler) {
  const el = document.getElementById(id);
  if (!el) return;
  const clone = el.cloneNode(true);
  el.parentNode.replaceChild(clone, el);
  document.getElementById(id).addEventListener("click", handler);
}

export function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Polls isRunningFn every 500ms until it returns false (service stopped) or maxWaitMs is reached.
export async function pollUntilStopped(isRunningFn, maxWaitMs = 8000) {
  const interval = 500;
  let waited = 0;
  while (waited < maxWaitMs) {
    await new Promise((r) => setTimeout(r, interval));
    if (!(await isRunningFn())) return;
    waited += interval;
  }
}

// Initializes a tab bar inside the given container element.
// Buttons must have class "tab-btn" and data-tab attribute; panels must have class "tab-panel" and data-tab attribute.
export function initTabs(containerId, defaultTab) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.classList.add("tabs-active");
  const buttons = container.querySelectorAll(".tab-bar .tab-btn");
  const panels = container.querySelectorAll(".tab-panel");

  function activate(tabId) {
    buttons.forEach((btn) => btn.classList.toggle("active", btn.dataset.tab === tabId));
    panels.forEach((panel) => panel.classList.toggle("active", panel.dataset.tab === tabId));
  }

  container.querySelector(".tab-bar")?.addEventListener("click", (e) => {
    const btn = e.target.closest(".tab-btn[data-tab]");
    if (!btn) return;
    activate(btn.dataset.tab);
  });

  const initial = defaultTab || buttons[0]?.dataset.tab;
  if (initial) activate(initial);
}

// Polls isRunningFn every 500ms until it returns true (service started) or maxWaitMs is reached.
export async function pollUntilStarted(isRunningFn, maxWaitMs = 8000) {
  const interval = 500;
  let waited = 0;
  while (waited < maxWaitMs) {
    await new Promise((r) => setTimeout(r, interval));
    if (await isRunningFn()) return;
    waited += interval;
  }
}
