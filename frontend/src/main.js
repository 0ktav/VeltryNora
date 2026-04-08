import "@fontsource/jetbrains-mono";
import "@fontsource/syne";

import "./css/variables.css";
import "./css/layout.css";
import "./css/components.css";
import "./css/animations.css";

import { startClock } from "./js/clock.js";
import { initRouter } from "./js/router.js";
import { translateStatic } from "./js/i18n.js";
import { loadTheme } from "./js/settings.js";
import { initDownloader } from "./js/downloader.js";
import { initUpdater } from "./js/updater.js";
import { createIcons, Globe, Folder, Pause, Play, Trash2 } from "lucide";

loadTheme();
translateStatic();
startClock();
initRouter();
initDownloader();
initUpdater();

// Global click pulse for all buttons
document.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  btn.classList.remove("btn-clicked");
  void btn.offsetWidth; // force reflow to restart animation
  btn.classList.add("btn-clicked");
  btn.addEventListener("animationend", () => btn.classList.remove("btn-clicked"), { once: true });
});
