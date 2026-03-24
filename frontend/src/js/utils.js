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
