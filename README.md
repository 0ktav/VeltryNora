# VeltryNora

A lightweight Windows desktop app for managing a local web development environment — Nginx, PHP, Redis and virtual sites, all from a clean UI without touching the terminal.

## Features

- **Nginx** — install, switch versions, start/stop/restart
- **PHP** — install multiple versions, start/stop, configure php.ini, manage extensions
- **Redis** — install, switch versions, start/stop
- **Sites** — create virtual hosts with automatic `hosts` file entry, change PHP version per site, manage rewrite rules, import `.htaccess`
- **Laravel** — create new Laravel projects via Composer directly from the UI
- **Tools** — portable Git, Node.js, Composer management
- **Logs** — view and clear Nginx access/error logs per site
- Multilingual interface: English, Romanian, Russian

## Requirements

- Windows 10 / 11 (64-bit)
- Administrator privileges (required for hosts file and service management)
- [Microsoft Edge WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) — usually pre-installed on Windows 11

## Download

Download the latest release from the [Releases](../../releases/latest) page:

- **`VeltryNora-Setup.exe`** — recommended, installs the app and creates shortcuts
- **`VeltryNora.exe`** — portable, run directly without installation (requires Administrator)

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
