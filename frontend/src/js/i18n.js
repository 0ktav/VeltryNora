const translations = {
  ro: {
    // Sidebar
    "nav.general": "General",
    "nav.software": "Software",
    "nav.config": "Configurare",
    "nav.dashboard": "Dashboard",
    "nav.settings": "Setări",

    // Dashboard
    "dash.title": "Dashboard",
    "dash.cpu": "CPU",
    "dash.ram": "RAM",
    "dash.disk": "Disk",
    "dash.uptime": "Uptime",
    "dash.loading": "loading...",
    "dash.used": "utilizat",
    "dash.of": "din",
    "dash.system_active": "sistem activ",
    "dash.services": "Servicii",
    "dash.latest_versions": "Versiuni Latest",
    "dash.active": "activ",
    "dash.stopped": "oprit",
    "dash.no_services": "niciun serviciu găsit",
    "dash.versions_installed": "versiuni instalate",
    "dash.online": "online",
    "dash.offline": "offline",
    "dash.cache_fresh": "versiune recent verificată",
    "dash.cache_cached": "versiune din cache",
    "dash.cache_note":
      "Versiunile se actualizează o dată la 24h pentru a evita solicitări repetate.",

    // Common
    "common.install": "Instalează",
    "common.loading": "Se încarcă...",
    "common.all_installed": "Toate versiunile sunt instalate",
    "common.installed_versions": "Versiuni instalate",
    "common.install_new": "Instalează versiune nouă",
    "common.cancel": "Anulează",
    "common.confirm": "Confirmă",
    "common.active_version": "Versiune activă:",
    "common.not_configured": "neconfigurat",
    "common.activate": "Activează",
    "common.delete": "Șterge",
    "common.starting": "Pornire...",
    "common.stopping": "Oprire...",
    "common.restarting": "Restart...",
    "common.error": "Eroare",
    "common.add_new": "+ Instalează versiune nouă",
    "common.installing": "Se instalează...",
    "common.install_error": "Eroare la instalare!",
    "common.install_success": "Instalat cu succes!",
    "common.reset": "Reset",
    "common.save": "Salvează",
    "common.saved": "Salvat ✓",

    // Nginx
    "nginx.title": "Nginx",
    "nginx.not_installed": "Nginx nu este instalat",
    "nginx.start_error": "Nu s-a putut porni Nginx!",
    "nginx.stop_error": "Nu s-a putut opri Nginx!",
    "nginx.restart_error": "Nu s-a putut restarta Nginx!",
    "nginx.change_version": "Schimbă versiunea activă",
    "nginx.change_confirm":
      'Nginx rulează în prezent. Trebuie oprit pentru a activa <strong style="color:var(--text)">{version}</strong>.<br><br>Oprești Nginx și activezi versiunea nouă?',
    "nginx.delete_title": "Șterge versiunea",
    "nginx.delete_confirm":
      'Ești sigur că vrei să ștergi <strong style="color:var(--text)">Nginx {version}</strong>?<br>Această acțiune nu poate fi anulată.',

    // PHP
    "php.title": "PHP Manager",
    "php.not_installed": "PHP nu este instalat",
    "php.delete_title": "Șterge versiunea",
    "php.delete_confirm":
      'Ești sigur că vrei să ștergi <strong style="color:var(--text)">PHP {version}</strong>?<br>Această acțiune nu poate fi anulată.',
    "php.archived": "Arhivate",
    "php.config": "Configurare",
    "php.memory_limit": "Limită memorie",
    "php.post_max_size": "Post max size",
    "php.upload_max": "Upload max size",
    "php.max_exec_time": "Timp exec. max",
    "php.display_errors": "Afișează erori",
    "php.save_restart": "Salvează și Restartează",

    // Redis
    "redis.title": "Redis",
    "redis.not_installed": "Redis nu este instalat",
    "redis.change_version": "Schimbă versiunea activă",
    "redis.change_confirm":
      'Redis rulează în prezent. Trebuie oprit pentru a activa <strong style="color:var(--text)">{version}</strong>.<br><br>Oprești Redis și activezi versiunea nouă?',
    "redis.delete_title": "Șterge versiunea",
    "redis.delete_confirm":
      'Ești sigur că vrei să ștergi <strong style="color:var(--text)">Redis {version}</strong>?<br>Această acțiune nu poate fi anulată.',

    // Sites
    "sites.title": "Site-uri",
    "sites.active_sites": "Site-uri active",
    "sites.new_site": "+ Site nou",
    "sites.new_site_title": "Site nou",
    "sites.domain": "Domeniu",
    "sites.root_folder": "Folder rădăcină",
    "sites.optional": "opțional",
    "sites.root_placeholder": "Lasă gol pentru www/{domeniu}/public",
    "sites.php_version": "Versiune PHP",
    "sites.no_php": "Fără PHP (static)",
    "sites.create": "Creează site",
    "sites.creating": "Se creează...",
    "sites.no_sites": "Niciun site configurat.",
    "sites.delete_title": "Șterge site-ul",
    "sites.delete_confirm":
      'Ești sigur că vrei să ștergi site-ul <strong style="color:var(--text)">{name}</strong>?<br>Config-ul Nginx va fi șters.',
    "sites.delete_folder": "Șterge și folderul local al site-ului",
    "sites.domain_required": "Domeniul este obligatoriu!",
    "sites.php_required_laravel":
      "Selectează o versiune PHP pentru proiectul Laravel.",
    "sites.domain_exists": "Site-ul <strong>{domain}</strong> există deja.",
    "sites.created_warning": "Site creat cu avertisment",
    "sites.hosts_denied":
      "Site-ul a fost creat dar nu s-a putut adăuga <strong>{domain}</strong> în hosts.<br><br>Adaugă manual în <code>C:\\Windows\\System32\\drivers\\etc\\hosts</code>:<br><code>127.0.0.1 {domain}</code>",
    "sites.create_error": "Nu s-a putut crea site-ul!",
    "sites.change_php": "Schimbă versiunea PHP",
    "sites.change_php_error": "Nu s-a putut schimba versiunea PHP!",
    "sites.options": "Opțiuni",
    "sites.add_to_hosts": "Adaugă în hosts",
    "sites.create_index_html": "Creează index.html (pagină Welcome)",
    "sites.create_index_php": "Creează index.php (phpinfo)",
    "sites.rewrites": "Rewrite rules",
    "sites.rewrites_desc": "Directive nginx (rewrite, return, add_header...)",
    "sites.import_htaccess": "Import .htaccess",
    "sites.rewrites_placeholder":
      "# Ex: return 301 /new-path;\n# rewrite ^/old/(.*)$ /new/$1 last;",

    // Settings
    "settings.title": "Setări",
    "settings.language": "Limbă",
    "settings.language_desc": "Alege limba interfeței",
    "settings.theme": "Temă",
    "settings.theme_desc": "Alege tema vizuală",
    "settings.theme_dark": "Dark",
    "settings.theme_light": "Light",
    "settings.base_path": "Cale de bază",
    "settings.base_path_desc": "Folderul unde sunt instalate serviciile",
    "settings.base_path_placeholder": "Folderul aplicației",
    "settings.minimize_to_tray": "Minimizare în tray",
    "settings.minimize_to_tray_desc":
      "Ascunde în system tray în loc să închidă",
    "settings.auto_stop": "Oprire automată",
    "settings.auto_stop_desc":
      "Oprește toate serviciile la închiderea aplicației",
    "settings.services": "Servicii",
    "settings.startup": "Pornire",
    "settings.auto_start": "Pornire automată servicii",
    "settings.auto_start_desc":
      "Pornește Nginx, PHP și Redis la deschiderea aplicației",
    "settings.start_on_boot": "Pornire la boot",
    "settings.start_on_boot_desc": "Lansează VeltryNora când pornește Windows",
    "settings.nginx_workers": "Worker processes",
    "settings.nginx_workers_desc": "Numărul de procese worker nginx",
    "settings.nginx_workers_auto": "auto",
    "settings.nginx_keepalive": "Keepalive timeout",
    "settings.nginx_keepalive_desc": "Timeout conexiune keep-alive în secunde",
    "settings.base_path_change_title": "Schimbare cale de bază",
    "settings.base_path_change_body":
      "Toate serviciile vor fi oprite. Va trebui să le descarci din nou pentru noua locație.",
    "nav.logs": "Loguri",
    "logs.title": "Loguri",
    "logs.error": "Log erori",
    "logs.access": "Log acces",
    "logs.loading": "Se încarcă...",
    "logs.empty": "Log-ul este gol",
    "logs.clear_title": "Golire log",
    "logs.clear_confirm": "Ești sigur că vrei să ștergi log-ul?",
    "logs.auto": "Auto",
    "logs.app_log": "App Log",
    "logs.app_log_empty": "Nicio înregistrare în log.",
    "logs.app_log_clear_confirm": "Ești sigur că vrei să ștergi app log-ul?",
    "php.ini_extensions": "Extensii",
    "php.ini_open_notepad": "Deschide în Notepad",
    "php.ext_open_folder": "Deschide folderul",
    "php.ext_folder_hint": "Extensiile sunt încărcate din folderul ext/. Adaugă fișiere .dll personalizate acolo.",
    "php.fastcgi_errors": "Erori FastCGI (nginx error.log)",
    "php.fastcgi_no_errors": "Nicio eroare FastCGI găsită.",

    // Utils
    "nav.utils": "Utils",
    "utils.composer": "Composer",
    "utils.composer_desc": "Manager de pachete PHP",
    "utils.composer_path": "Instalat în tools/composer.phar",
    "utils.installed": "instalat",
    "utils.not_installed": "neinstalat",
    "utils.reinstall": "Reinstalează",
    "utils.downloading": "Se descarcă...",
    "utils.install_failed":
      "Instalarea a eșuat. Verifică conexiunea la internet.",
    "utils.add_to_path": "Adaugă în system PATH:",
    "utils.path_note":
      "✓ composer.bat creat și adăugat în system PATH. Deschide un CMD nou pentru a folosi comanda composer.",
    "utils.git": "Git",
    "utils.git_desc": "Sistem de versionare (MinGit portabil)",
    "utils.git_path": "Instalat în tools/git/cmd/git.exe",
    "utils.nodejs": "Node.js",
    "utils.nodejs_desc": "Runtime JavaScript (LTS portabil)",
    "utils.nodejs_path": "Instalat în tools/nodejs/node.exe",
    "utils.path_note_tool":
      "✓ Adăugat în system PATH. Deschide un CMD nou pentru a folosi comanda.",
    "utils.app_log": "App Logs",
    "utils.app_log_empty": "Nicio înregistrare în log.",
    "settings.show_app_log": "App logs",
    "settings.show_app_log_desc":
      "Afișează panelul de loguri în Utils (erori, avertismente, instalări)",
    "common.refresh": "Reîncarcă",
    "common.clear": "Șterge log",

    // About
    "nav.about": "Despre",
    "about.title": "Despre",
    "about.description": "Manager local de server web pentru Windows",
    "about.author": "Autor",
    "about.repository": "Repositoriu",
    "about.updates": "Actualizări",
    "about.check_updates": "Verifică actualizări",
    "about.checking": "Se verifică...",
    "about.up_to_date": "Ești la zi",
    "about.update_available": "Versiune nouă disponibilă: v{version}",
    "about.download": "Descarcă",
    "about.check_error": "Eroare la verificare. Încearcă din nou.",

    // Sites - Laravel
    "sites.laravel_desc": "Inițializează proiect Laravel cu Composer",
    "sites.laravel_installing": "Se creează proiectul Laravel...",
    "sites.laravel_done": "Proiect Laravel creat cu succes!",
    "sites.laravel_error": "Eroare la crearea proiectului Laravel.",
    "sites.laravel_requirements": "Extensii PHP necesare pentru Laravel:",
    "sites.laravel_zip_optional": "— opțional, instalare mai rapidă",
    "sites.laravel_pdo_note": "alege cel puțin una în funcție de baza de date",
    "sites.laravel_php_note":
      "Se va folosi PHP {version}. Activează extensiile lipsă din panoul Extensions.",
  },

  en: {
    // Sidebar
    "nav.general": "General",
    "nav.software": "Software",
    "nav.config": "Configuration",
    "nav.dashboard": "Dashboard",
    "nav.settings": "Settings",

    // Dashboard
    "dash.title": "Dashboard",
    "dash.cpu": "CPU",
    "dash.ram": "RAM",
    "dash.disk": "Disk",
    "dash.uptime": "Uptime",
    "dash.loading": "loading...",
    "dash.used": "used",
    "dash.of": "of",
    "dash.system_active": "system active",
    "dash.services": "Services",
    "dash.latest_versions": "Latest Versions",
    "dash.active": "running",
    "dash.stopped": "stopped",
    "dash.no_services": "no services found",
    "dash.versions_installed": "versions installed",
    "dash.online": "online",
    "dash.offline": "offline",
    "dash.cache_fresh": "version just fetched",
    "dash.cache_cached": "version from cache",
    "dash.cache_note":
      "Versions are refreshed once every 24h to avoid repeated requests.",

    // Common
    "common.install": "Install",
    "common.loading": "Loading...",
    "common.all_installed": "All versions are installed",
    "common.installed_versions": "Installed versions",
    "common.install_new": "Install new version",
    "common.cancel": "Cancel",
    "common.confirm": "Confirm",
    "common.active_version": "Active version:",
    "common.not_configured": "not configured",
    "common.activate": "Activate",
    "common.delete": "Delete",
    "common.starting": "Starting...",
    "common.stopping": "Stopping...",
    "common.restarting": "Restarting...",
    "common.error": "Error",
    "common.add_new": "+ Install new version",
    "common.installing": "Installing...",
    "common.install_error": "Installation failed!",
    "common.install_success": "Installed successfully!",
    "common.reset": "Reset",
    "common.save": "Save",
    "common.saved": "Saved ✓",

    // Nginx
    "nginx.title": "Nginx",
    "nginx.not_installed": "Nginx is not installed",
    "nginx.start_error": "Could not start Nginx!",
    "nginx.stop_error": "Could not stop Nginx!",
    "nginx.restart_error": "Could not restart Nginx!",
    "nginx.change_version": "Change active version",
    "nginx.change_confirm":
      'Nginx is currently running. It must be stopped to activate <strong style="color:var(--text)">{version}</strong>.<br><br>Stop Nginx and activate the new version?',
    "nginx.delete_title": "Delete version",
    "nginx.delete_confirm":
      'Are you sure you want to delete <strong style="color:var(--text)">Nginx {version}</strong>?<br>This action cannot be undone.',

    // PHP
    "php.title": "PHP Manager",
    "php.not_installed": "PHP is not installed",
    "php.delete_title": "Delete version",
    "php.delete_confirm":
      'Are you sure you want to delete <strong style="color:var(--text)">PHP {version}</strong>?<br>This action cannot be undone.',

    // Redis
    "redis.title": "Redis",
    "redis.not_installed": "Redis is not installed",
    "redis.change_version": "Change active version",
    "redis.change_confirm":
      'Redis is currently running. It must be stopped to activate <strong style="color:var(--text)">{version}</strong>.<br><br>Stop Redis and activate the new version?',
    "redis.delete_title": "Delete version",
    "redis.delete_confirm":
      'Are you sure you want to delete <strong style="color:var(--text)">Redis {version}</strong>?<br>This action cannot be undone.',

    // Sites
    "sites.title": "Sites",
    "sites.active_sites": "Active sites",
    "sites.new_site": "+ New site",
    "sites.new_site_title": "New site",
    "sites.domain": "Domain",
    "sites.root_folder": "Root folder",
    "sites.optional": "optional",
    "sites.root_placeholder": "Leave empty for www/{domain}/public",
    "sites.php_version": "PHP Version",
    "sites.no_php": "No PHP (static)",
    "sites.create": "Create site",
    "sites.creating": "Creating...",
    "sites.no_sites": "No sites configured.",
    "sites.delete_title": "Delete site",
    "sites.delete_confirm":
      'Are you sure you want to delete site <strong style="color:var(--text)">{name}</strong>?<br>Nginx config will be deleted.',
    "sites.delete_folder": "Also delete the local site folder",
    "sites.domain_required": "Domain is required!",
    "sites.php_required_laravel":
      "Select a PHP version for the Laravel project.",
    "sites.domain_exists": "Site <strong>{domain}</strong> already exists.",
    "sites.created_warning": "Site created with warning",
    "sites.hosts_denied":
      "Site was created but could not add <strong>{domain}</strong> to hosts.<br><br>Add manually to <code>C:\\Windows\\System32\\drivers\\etc\\hosts</code>:<br><code>127.0.0.1 {domain}</code>",
    "sites.create_error": "Could not create site!",
    "sites.change_php": "Change PHP version",
    "sites.change_php_error": "Could not change PHP version!",
    "sites.options": "Options",
    "sites.add_to_hosts": "Add to hosts",
    "sites.create_index_html": "Create index.html (Welcome page)",
    "sites.create_index_php": "Create index.php (phpinfo)",
    "sites.rewrites": "Rewrite rules",
    "sites.rewrites_desc": "Nginx directives (rewrite, return, add_header...)",
    "sites.import_htaccess": "Import .htaccess",
    "sites.rewrites_placeholder":
      "# Ex: return 301 /new-path;\n# rewrite ^/old/(.*)$ /new/$1 last;",

    // Settings
    "settings.title": "Settings",
    "settings.language": "Language",
    "settings.language_desc": "Choose the interface language",
    "settings.theme": "Theme",
    "settings.theme_desc": "Choose the visual theme",
    "settings.theme_dark": "Dark",
    "settings.theme_light": "Light",
    "settings.base_path": "Base path",
    "settings.base_path_desc": "Folder where services are installed",
    "settings.base_path_placeholder": "App folder",
    "settings.minimize_to_tray": "Minimize to tray",
    "settings.minimize_to_tray_desc": "Hide to system tray instead of closing",
    "settings.auto_stop": "Auto stop",
    "settings.auto_stop_desc": "Stop all services when closing the application",
    "settings.services": "Services",
    "settings.startup": "Startup",
    "settings.auto_start": "Auto-start services",
    "settings.auto_start_desc":
      "Start Nginx, PHP and Redis when opening the app",
    "settings.start_on_boot": "Start on boot",
    "settings.start_on_boot_desc": "Launch VeltryNora when Windows starts",
    "settings.nginx_workers": "Worker processes",
    "settings.nginx_workers_desc": "Number of nginx worker processes",
    "settings.nginx_workers_auto": "auto",
    "settings.nginx_keepalive": "Keepalive timeout",
    "settings.nginx_keepalive_desc": "Keep-alive connection timeout in seconds",
    "settings.base_path_change_title": "Change base path",
    "settings.base_path_change_body":
      "All services will be stopped. You will need to re-download them for the new location.",
    "nav.logs": "Logs",
    "logs.title": "Logs",
    "logs.error": "Error log",
    "logs.access": "Access log",
    "logs.loading": "Loading...",
    "logs.empty": "Log is empty",
    "logs.clear_title": "Clear log",
    "logs.clear_confirm": "Are you sure you want to clear the log?",
    "logs.app_log": "App Log",
    "logs.app_log_empty": "No log entries yet.",
    "logs.app_log_clear_confirm": "Are you sure you want to clear the app log?",
    "logs.auto": "Auto",
    "php.ini_extensions": "Extensions",
    "php.ini_open_notepad": "Open in Notepad",
    "php.ext_open_folder": "Open folder",
    "php.ext_folder_hint": "Extensions are loaded from the ext/ folder. Drop custom .dll files there.",
    "php.fastcgi_errors": "FastCGI errors (nginx error.log)",
    "php.fastcgi_no_errors": "No FastCGI errors found.",
    "php.archived": "Archived",

    // Utils
    "nav.utils": "Utils",
    "utils.composer": "Composer",
    "utils.composer_desc": "PHP package manager",
    "utils.composer_path": "Installed at tools/composer.phar",
    "utils.installed": "installed",
    "utils.not_installed": "not installed",
    "utils.reinstall": "Reinstall",
    "utils.downloading": "Downloading...",
    "utils.install_failed":
      "Installation failed. Check your internet connection.",
    "utils.add_to_path": "Add to system PATH:",
    "utils.path_note":
      "✓ composer.bat created and added to system PATH. Open a new CMD window to use the composer command.",
    "utils.git": "Git",
    "utils.git_desc": "Version control system (portable MinGit)",
    "utils.git_path": "Installed at tools/git/cmd/git.exe",
    "utils.nodejs": "Node.js",
    "utils.nodejs_desc": "JavaScript runtime (portable LTS)",
    "utils.nodejs_path": "Installed at tools/nodejs/node.exe",
    "utils.path_note_tool":
      "✓ Added to system PATH. Open a new CMD window to use the command.",
    "utils.app_log": "App Logs",
    "utils.app_log_empty": "No log entries yet.",
    "settings.show_app_log": "App logs",
    "settings.show_app_log_desc":
      "Show log panel in Utils (errors, warnings, installs)",
    "common.refresh": "Refresh",
    "common.clear": "Clear log",

    // About
    "nav.about": "About",
    "about.title": "About",
    "about.description": "Local web server manager for Windows",
    "about.author": "Author",
    "about.repository": "Repository",
    "about.updates": "Updates",
    "about.check_updates": "Check for updates",
    "about.checking": "Checking...",
    "about.up_to_date": "You are up to date",
    "about.update_available": "New version available: v{version}",
    "about.download": "Download",
    "about.check_error": "Check failed. Please try again.",

    // Sites - Laravel
    "sites.laravel_desc": "Initialize a Laravel project with Composer",
    "sites.laravel_installing": "Creating Laravel project...",
    "sites.laravel_done": "Laravel project created successfully!",
    "sites.laravel_error": "Failed to create Laravel project.",
    "sites.laravel_requirements": "PHP extensions required for Laravel:",
    "sites.laravel_zip_optional": "— optional, faster install",
    "sites.laravel_pdo_note": "choose at least one depending on your database",
    "sites.laravel_php_note":
      "PHP {version} will be used. Enable missing extensions from the Extensions panel.",
    "php.config": "Configuration",
    "php.memory_limit": "Memory limit",
    "php.post_max_size": "Post max size",
    "php.upload_max": "Upload max size",
    "php.max_exec_time": "Max exec time",
    "php.display_errors": "Display errors",
    "php.save_restart": "Save & Restart",
  },

  ru: {
    // Sidebar
    "nav.general": "Общее",
    "nav.software": "Софт",
    "nav.config": "Конфигурация",
    "nav.dashboard": "Панель",
    "nav.settings": "Настройки",

    // Dashboard
    "dash.title": "Панель",
    "dash.cpu": "CPU",
    "dash.ram": "RAM",
    "dash.disk": "Диск",
    "dash.uptime": "Аптайм",
    "dash.loading": "загрузка...",
    "dash.used": "использовано",
    "dash.of": "из",
    "dash.system_active": "система активна",
    "dash.services": "Сервисы",
    "dash.latest_versions": "Последние версии",
    "dash.active": "работает",
    "dash.stopped": "остановлен",
    "dash.no_services": "сервисы не найдены",
    "dash.versions_installed": "версий установлено",
    "dash.online": "онлайн",
    "dash.offline": "офлайн",
    "dash.cache_fresh": "версия только что проверена",
    "dash.cache_cached": "версия из кэша",
    "dash.cache_note":
      "Версии обновляются раз в 24 часа, чтобы не делать лишних запросов.",

    // Common
    "common.install": "Установить",
    "common.loading": "Загрузка...",
    "common.all_installed": "Все версии установлены",
    "common.installed_versions": "Установленные версии",
    "common.install_new": "Установить новую версию",
    "common.cancel": "Отмена",
    "common.confirm": "Подтвердить",
    "common.active_version": "Активная версия:",
    "common.not_configured": "не настроено",
    "common.activate": "Активировать",
    "common.delete": "Удалить",
    "common.starting": "Запуск...",
    "common.stopping": "Остановка...",
    "common.restarting": "Перезапуск...",
    "common.error": "Ошибка",
    "common.add_new": "+ Установить новую версию",
    "common.installing": "Установка...",
    "common.install_error": "Ошибка установки!",
    "common.install_success": "Установлено успешно!",
    "common.reset": "Сброс",
    "common.save": "Сохранить",
    "common.saved": "Сохранено ✓",

    // Nginx
    "nginx.title": "Nginx",
    "nginx.not_installed": "Nginx не установлен",
    "nginx.start_error": "Не удалось запустить Nginx!",
    "nginx.stop_error": "Не удалось остановить Nginx!",
    "nginx.restart_error": "Не удалось перезапустить Nginx!",
    "nginx.change_version": "Сменить активную версию",
    "nginx.change_confirm":
      'Nginx сейчас запущен. Его нужно остановить для активации <strong style="color:var(--text)">{version}</strong>.<br><br>Остановить Nginx и активировать новую версию?',
    "nginx.delete_title": "Удалить версию",
    "nginx.delete_confirm":
      'Вы уверены, что хотите удалить <strong style="color:var(--text)">Nginx {version}</strong>?<br>Это действие нельзя отменить.',

    // PHP
    "php.title": "PHP Manager",
    "php.not_installed": "PHP не установлен",
    "php.delete_title": "Удалить версию",
    "php.delete_confirm":
      'Вы уверены, что хотите удалить <strong style="color:var(--text)">PHP {version}</strong>?<br>Это действие нельзя отменить.',

    // Redis
    "redis.title": "Redis",
    "redis.not_installed": "Redis не установлен",
    "redis.change_version": "Сменить активную версию",
    "redis.change_confirm":
      'Redis сейчас запущен. Его нужно остановить для активации <strong style="color:var(--text)">{version}</strong>.<br><br>Остановить Redis и активировать новую версию?',
    "redis.delete_title": "Удалить версию",
    "redis.delete_confirm":
      'Вы уверены, что хотите удалить <strong style="color:var(--text)">Redis {version}</strong>?<br>Это действие нельзя отменить.',

    // Sites
    "sites.title": "Сайты",
    "sites.active_sites": "Активные сайты",
    "sites.new_site": "+ Новый сайт",
    "sites.new_site_title": "Новый сайт",
    "sites.domain": "Домен",
    "sites.root_folder": "Корневая папка",
    "sites.optional": "необязательно",
    "sites.root_placeholder": "Оставьте пустым для www/{домен}/public",
    "sites.php_version": "Версия PHP",
    "sites.no_php": "Без PHP (статика)",
    "sites.create": "Создать сайт",
    "sites.creating": "Создание...",
    "sites.no_sites": "Сайты не настроены.",
    "sites.delete_title": "Удалить сайт",
    "sites.delete_confirm":
      'Вы уверены, что хотите удалить сайт <strong style="color:var(--text)">{name}</strong>?<br>Конфиг Nginx будет удалён.',
    "sites.delete_folder": "Также удалить локальную папку сайта",
    "sites.domain_required": "Домен обязателен!",
    "sites.php_required_laravel": "Выберите версию PHP для Laravel проекта.",
    "sites.domain_exists": "Сайт <strong>{domain}</strong> уже существует.",
    "sites.created_warning": "Сайт создан с предупреждением",
    "sites.hosts_denied":
      "Сайт создан, но не удалось добавить <strong>{domain}</strong> в hosts.<br><br>Добавьте вручную в <code>C:\\Windows\\System32\\drivers\\etc\\hosts</code>:<br><code>127.0.0.1 {domain}</code>",
    "sites.create_error": "Не удалось создать сайт!",
    "sites.change_php": "Изменить версию PHP",
    "sites.change_php_error": "Не удалось изменить версию PHP!",
    "sites.options": "Параметры",
    "sites.add_to_hosts": "Добавить в hosts",
    "sites.create_index_html": "Создать index.html (страница Welcome)",
    "sites.create_index_php": "Создать index.php (phpinfo)",
    "sites.rewrites": "Rewrite rules",
    "sites.rewrites_desc": "Nginx директивы (rewrite, return, add_header...)",
    "sites.import_htaccess": "Импорт .htaccess",
    "sites.rewrites_placeholder":
      "# Пример: return 301 /new-path;\n# rewrite ^/old/(.*)$ /new/$1 last;",

    // Settings
    "settings.title": "Настройки",
    "settings.language": "Язык",
    "settings.language_desc": "Выберите язык интерфейса",
    "settings.theme": "Тема",
    "settings.theme_desc": "Выберите визуальную тему",
    "settings.theme_dark": "Тёмная",
    "settings.theme_light": "Светлая",
    "settings.base_path": "Базовый путь",
    "settings.base_path_desc": "Папка, где установлены сервисы",
    "settings.base_path_placeholder": "Папка приложения",
    "settings.minimize_to_tray": "Свернуть в трей",
    "settings.minimize_to_tray_desc":
      "Скрывать в системный трей вместо закрытия",
    "settings.auto_stop": "Авто-остановка",
    "settings.auto_stop_desc":
      "Останавливать все сервисы при закрытии приложения",
    "settings.services": "Сервисы",
    "settings.startup": "Запуск",
    "settings.auto_start": "Авто-запуск сервисов",
    "settings.auto_start_desc":
      "Запускать Nginx, PHP и Redis при открытии приложения",
    "settings.start_on_boot": "Запуск при загрузке",
    "settings.start_on_boot_desc": "Запускать VeltryNora при старте Windows",
    "settings.nginx_workers": "Worker процессы",
    "settings.nginx_workers_desc": "Количество рабочих процессов nginx",
    "settings.nginx_workers_auto": "авто",
    "settings.nginx_keepalive": "Keepalive timeout",
    "settings.nginx_keepalive_desc": "Таймаут keep-alive соединений в секундах",
    "settings.base_path_change_title": "Изменение базового пути",
    "settings.base_path_change_body":
      "Все сервисы будут остановлены. Их нужно будет скачать заново для нового расположения.",
    "nav.logs": "Логи",
    "logs.title": "Логи",
    "logs.error": "Лог ошибок",
    "logs.access": "Лог доступа",
    "logs.loading": "Загрузка...",
    "logs.empty": "Лог пуст",
    "logs.clear_title": "Очистить лог",
    "logs.clear_confirm": "Вы уверены, что хотите очистить лог?",
    "logs.auto": "Авто",
    "logs.app_log": "App Log",
    "logs.app_log_empty": "Записей в логе нет.",
    "logs.app_log_clear_confirm": "Вы уверены, что хотите очистить app log?",
    "php.ini_extensions": "Расширения",
    "php.ini_open_notepad": "Открыть в Notepad",
    "php.ext_open_folder": "Открыть папку",
    "php.ext_folder_hint": "Расширения загружаются из папки ext/. Добавляйте пользовательские .dll файлы туда.",
    "php.fastcgi_errors": "Ошибки FastCGI (nginx error.log)",
    "php.fastcgi_no_errors": "Ошибок FastCGI не найдено.",
    "php.archived": "Архив",
    "php.config": "Конфигурация",
    "php.memory_limit": "Лимит памяти",
    "php.post_max_size": "Post max size",
    "php.upload_max": "Upload max size",
    "php.max_exec_time": "Макс. время выполнения",
    "php.display_errors": "Показывать ошибки",
    "php.save_restart": "Сохранить и перезапустить",

    // Utils
    "nav.utils": "Utils",
    "utils.composer": "Composer",
    "utils.composer_desc": "Менеджер пакетов PHP",
    "utils.composer_path": "Установлен в tools/composer.phar",
    "utils.installed": "установлен",
    "utils.not_installed": "не установлен",
    "utils.reinstall": "Переустановить",
    "utils.downloading": "Загрузка...",
    "utils.install_failed":
      "Установка не удалась. Проверьте подключение к интернету.",
    "utils.add_to_path": "Добавить в system PATH:",
    "utils.path_note":
      "✓ composer.bat создан и добавлен в system PATH. Откройте новое окно CMD для использования команды composer.",
    "utils.git": "Git",
    "utils.git_desc": "Система контроля версий (портативный MinGit)",
    "utils.git_path": "Установлен в tools/git/cmd/git.exe",
    "utils.nodejs": "Node.js",
    "utils.nodejs_desc": "JavaScript runtime (портативный LTS)",
    "utils.nodejs_path": "Установлен в tools/nodejs/node.exe",
    "utils.path_note_tool":
      "✓ Добавлен в system PATH. Откройте новое окно CMD для использования команды.",
    "utils.app_log": "App Logs",
    "utils.app_log_empty": "Записей в логе нет.",
    "settings.show_app_log": "App logs",
    "settings.show_app_log_desc":
      "Показывать панель логов в Utils (ошибки, предупреждения, установки)",
    "common.refresh": "Обновить",
    "common.clear": "Очистить лог",

    // About
    "nav.about": "О программе",
    "about.title": "О программе",
    "about.description": "Локальный менеджер веб-сервера для Windows",
    "about.author": "Автор",
    "about.repository": "Репозиторий",
    "about.updates": "Обновления",
    "about.check_updates": "Проверить обновления",
    "about.checking": "Проверяется...",
    "about.up_to_date": "Версия актуальна",
    "about.update_available": "Доступна новая версия: v{version}",
    "about.download": "Скачать",
    "about.check_error": "Ошибка проверки. Попробуйте снова.",

    // Sites - Laravel
    "sites.laravel_desc": "Создать Laravel проект с Composer",
    "sites.laravel_installing": "Создание Laravel проекта...",
    "sites.laravel_done": "Laravel проект успешно создан!",
    "sites.laravel_error": "Не удалось создать Laravel проект.",
    "sites.laravel_requirements": "Необходимые PHP расширения для Laravel:",
    "sites.laravel_zip_optional": "— необязательно, ускоряет установку",
    "sites.laravel_pdo_note":
      "выберите хотя бы одно в зависимости от базы данных",
    "sites.laravel_php_note":
      "Будет использован PHP {version}. Включите недостающие расширения в панели Extensions.",
  },
};

const localeMap = { ro: "ro-RO", en: "en-US", ru: "ru-RU" };

let currentLang = localStorage.getItem("veltrynora-lang") || "en";

export function t(key, params = {}) {
  let text = translations[currentLang]?.[key] || translations.en[key] || key;
  for (const [k, v] of Object.entries(params)) {
    text = text.replaceAll(`{${k}}`, v);
  }
  return text;
}

export function getLang() {
  return currentLang;
}

export function getLocale() {
  return localeMap[currentLang] || "en-US";
}

export function setLang(lang) {
  if (!translations[lang]) return;
  currentLang = lang;
  localStorage.setItem("veltrynora-lang", lang);
  document.documentElement.lang = lang;
  translateStatic();
}

// Translate all elements with data-i18n attribute
export function translatePage() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
      el.placeholder = t(key);
    } else if (el.tagName === "OPTION") {
      el.textContent = t(key);
    } else {
      el.textContent = t(key);
    }
  });
  document.querySelectorAll("[data-i18n-html]").forEach((el) => {
    el.innerHTML = t(el.dataset.i18nHtml);
  });
}

// Translate sidebar and other static elements in index.html
export function translateStatic() {
  translatePage();
}
