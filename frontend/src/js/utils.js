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
