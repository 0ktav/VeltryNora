# VeltryNora

A lightweight Windows desktop app for managing a local web development environment — Nginx, PHP, Redis and virtual sites, all from a clean UI without touching the terminal.

## Features

- **Nginx** — install, switch versions, start/stop/restart/reload
- **PHP** — install multiple versions simultaneously, start/stop per version, configure `php.ini`, manage extensions
- **Redis** — install, start/stop/restart, run commands interactively from the UI
- **Sites** — create virtual hosts with automatic `hosts` file entry, change PHP version per site, manage rewrite rules, import `.htaccess`, open in browser, real-time search
- **Laravel** — create new projects via Composer, auto-detect existing projects, show framework version, run artisan commands, upgrade framework with streaming output
- **Hosts file editor** — view, add, enable/disable and delete Windows hosts file entries
- **Dashboard** — live CPU/RAM/disk stats, service status, port conflict detector
- **Tools** — portable Git, Node.js, Composer (or use system-installed ones automatically)
- **Notifications** — Windows toast alerts when a service crashes unexpectedly
- **Logs** — view and clear Nginx access/error logs per site
- Multilingual interface: English, Romanian, Russian

## Requirements

- Windows 10 / 11 (64-bit)
- Administrator privileges (required for hosts file and service management)
- [Microsoft Edge WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) — usually pre-installed on Windows 11

## Download

Download the latest installer from the [Releases](../../releases/latest) page:

- **`VeltryNora-Setup.exe`** — installs the app and creates shortcuts (requires Administrator for first run)

## Build from source

### Prerequisites

- [Go 1.23+](https://go.dev/dl/)
- [Node.js 20+](https://nodejs.org/)
- [Wails CLI](https://wails.io/docs/gettingstarted/installation): `go install github.com/wailsapp/wails/v2/cmd/wails@latest`

### Steps

```bash
git clone https://github.com/0ktav/VeltryNora.git
cd VeltryNora
wails build
```

The executable will be at `build/bin/VeltryNora.exe`.

For development with hot reload:

```bash
wails dev
```

## Feedback & Contributing

This is an early release — feedback, bug reports and suggestions are welcome via [Issues](../../issues).

## License

[MIT](LICENSE)
