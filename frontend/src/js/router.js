import { translatePage } from "./i18n.js";

const pageModules = {
  dashboard: () => import("./dashboard.js"),
  logs: () => import("./logs.js"),
  nginx: () => import("./nginx.js"),
  php: () => import("./php.js"),
  redis: () => import("./redis.js"),
  mysql: () => import("./mysql.js"),
  sites: () => import("./sites.js"),
  utils: () => import("./toolbox.js"),
  settings: () => import("./settings.js"),
  about: () => import("./about.js"),
};

let currentModule = null;

async function loadPage(page) {
  if (currentModule && currentModule.destroy) {
    currentModule.destroy();
  }

  const response = await fetch(`/src/pages/${page}.html`);
  const html = await response.text();
  document.getElementById("content").innerHTML = html;

  translatePage();

  const moduleLoader = pageModules[page];
  if (moduleLoader) {
    const module = await moduleLoader();
    currentModule = module;
    if (module.init) {
      module.init();
    }
  }
}

export function initRouter() {
  loadPage("dashboard");

  document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", () => {
      const page = item.dataset.page;

      document
        .querySelectorAll(".nav-item")
        .forEach((i) => i.classList.remove("active"));
      item.classList.add("active");

      loadPage(page);
    });
  });
}
