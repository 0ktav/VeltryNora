import { getLocale } from "./i18n.js";

let clockInterval;

export function startClock() {
  function updateClock() {
    const el = document.getElementById("clock");
    if (el) el.textContent = new Date().toLocaleTimeString(getLocale());
  }
  updateClock();
  clockInterval = setInterval(updateClock, 1000);
}

export function stopClock() {
  clearInterval(clockInterval);
}
