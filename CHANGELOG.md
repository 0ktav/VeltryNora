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
