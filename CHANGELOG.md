## v1.6.0 — 2026-04-08

### Added
- **UI: button click pulse** — all buttons show a brief pulse animation on click as visual feedback
- **UI: active panel button glow** — buttons that open inline panels (sites: logs, rewrites, env, terminal, PHP change, etc.; PHP: config, extensions, logs) stay highlighted with a persistent pulse while the panel is open
- **UI: panel scroll + title** — opening an inline panel auto-scrolls to it and shows a title label at the top
- **Nginx: global header buffer settings** — new "Header Buffers" panel on the Nginx page with preset selects for `client_header_buffer_size` and `large_client_header_buffers`; values applied to `nginx.conf` on Save & Restart

---

## v1.5.0 — 2026-03-27

### Added
- **UI: opt-in tabs layout** — Settings toggle to display Nginx, MySQL and Redis service pages with tabs (Control · Logs / Control · Databases · Users · Logs / Control · Commands · Logs) instead of vertical scroll; tab icons colored per section
- **UI: "New" feature badge** — first-run badge on the Settings nav item and on the Interface panel guides users to the new tabs layout setting
- **PHP: Start All / Stop All** — bulk buttons to start or stop all installed PHP versions in parallel; per-version concurrency guards prevent conflicts
- **Dashboard: active version badge** — each service card (Nginx, MySQL, Redis) shows the currently active version
- **Dashboard: install-drive disk usage** — disk stats now reflect the drive where services are installed, not always C:
- **Dashboard: parallel version checks** — Nginx, PHP and Redis latest-version lookups run in parallel, reducing dashboard load time

### Fixed
- **MySQL: spinner on start** — clicking Start now immediately shows a loading spinner and polls until the service is ready before refreshing status
- **MySQL: false running state during install** — MySQL no longer shows as running while the installer briefly spawns the mysqld process during initialization; detection now uses port 3306 instead of process name
- **Hosts: selection highlight color** — selected host rows now use the correct green accent color

---

## v1.4.0 — 2026-03-26

### Added
- **Hosts: row highlight + path display** — selected rows are highlighted and the hosts file path is shown in the header
- **Sites: overwrite confirmation** — confirms before overwriting an existing index file when creating a new site

### Changed
- **Sites: card layout redesign** — action buttons are now grouped for a cleaner, more consistent layout

### Fixed
- **PHP: stop only LISTENING processes** — stopping a PHP version no longer kills unrelated processes, preventing accidental nginx shutdown
- **Updater: multiple downloads prevented** — downloading an update multiple times in the same session no longer triggers duplicate setups
- **Tray: minimize-to-tray on startup** — minimize-to-tray and quit from tray now behave correctly on startup and throughout the session

---

## v1.3.0 — 2026-03-25

### Added
- **Sites: change public path** — new panel per site to change the Nginx root directory, with a folder browser that opens at the current root

### Fixed
- **Installer: parallel downloads** — each version now has its own progress event channel; downloading multiple versions in parallel no longer mixes up progress bars or causes them to freeze
- **Installer: duplicate installs prevented** — a version being downloaded is excluded from the install modal list until the download completes or fails
- **Installer: active version preserved on parallel install** — installing multiple MySQL versions no longer overrides the currently active version with whichever finishes last
- **Sites: new site modal Enter key leak** — pressing Enter after cancelling the new site modal no longer re-triggers site creation
- **Sites: delete site with nested root** — deleting a site whose root is a subdirectory inside the default site folder now correctly removes the parent folder

---

## v1.2.0 — 2026-03-24

### Added
- **Auto-update** — app checks for a new version on startup, shows a sidebar badge, and lets you download and install the update directly from the About page; Windows toast notification when a new version is available
- **MySQL** — install, start/stop/restart, view logs; manage databases (create, drop, collation info); manage users (create, drop, change password, set permissions); import/export SQL dumps
- **MySQL import confirmation** — confirmation modal before importing a SQL file, warning that existing data may be overwritten
- **Sites: filter pills** — filter the sites list by status (active/inactive) and PHP version
- **Installer: download progress** — percent and total MB shown during component downloads
- **UI: persistent download progress widget** — download status pinned in the sidebar while a download is in progress
- **UI: spinner feedback** — delete and activate buttons show a spinner while the operation is running
- **Single instance enforcement** — launching a second instance brings the existing window to foreground instead of opening a duplicate


---

## v1.1.0 — 2026-03-20

### Added
- **Hosts file editor** — view, add, enable/disable and delete entries in the Windows hosts file
- **Laravel module per site** — detect Laravel projects automatically, show framework version, run artisan commands (optimize:clear, cache:clear, config:clear, config:cache, view:clear, route:clear, storage:link, migrate:status, migrate) and upgrade the framework via `composer update` with real-time streaming output
- **Redis interactive commands panel** — run Redis commands directly from the UI
- **Port conflict detector on dashboard** — warns when required ports (80, 3306, 6379, etc.) are occupied by another process
- **Windows toast notifications** — native alerts when a service (nginx, PHP, Redis) crashes unexpectedly
- **Open site in browser** — globe button opens the site in the configured preferred browser; browser preference saved in Settings
- **Real-time site search** — filter sites list by domain name or path as you type
- **System theme follow** — app theme automatically follows the OS light/dark preference when no manual override is set
- **System-installed tools fallback** — if Git, Node.js or Composer are not found in the app folder, falls back to system PATH

### Fixed
- **Sites — nginx status badge** — nginx running/stopped status is now correctly shown on each site card
- **Sites — PHP change panel** — the current active PHP version is now pre-selected when opening the change panel

---

## v1.0.0

- Initial release
- Nginx, PHP, Redis manager with version switching
- Virtual sites management with automatic hosts configuration
- Laravel project creation via Composer
- PHP version change for existing sites
- Multilingual interface (Romanian, English, Russian)
- Portable tools: Git, Node.js, Composer
- PHP: ext/ folder hint in Extensions panel
- PHP: FastCGI errors section in PHP manager
- Utils: PATH confirmation dialog before installing Composer, Git and Node.js
- About page with app version, author, repository link and check for updates
- Windows installer (`VeltryNora-Setup.exe`) built with Inno Setup
- Sites: redesigned new site modal with two-column layout
- Sites: checkboxes to add domain to hosts file, create index.html and index.php
- Sites: generated index.html welcome page with VeltryNora branding
- Install modals: auto-close after successful installation
