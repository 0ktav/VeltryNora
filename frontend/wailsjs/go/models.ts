export namespace config {
	
	export class AppSettings {
	    base_path: string;
	    auto_stop: boolean;
	    auto_start: boolean;
	    start_on_boot: boolean;
	    theme: string;
	    language: string;
	    nginx_workers: number;
	    nginx_keepalive: number;
	    minimize_to_tray: boolean;
	    show_app_log: boolean;
	    preferred_browser: string;
	    notify_service_crash: boolean;
	    notify_operation_fail: boolean;
	
	    static createFrom(source: any = {}) {
	        return new AppSettings(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.base_path = source["base_path"];
	        this.auto_stop = source["auto_stop"];
	        this.auto_start = source["auto_start"];
	        this.start_on_boot = source["start_on_boot"];
	        this.theme = source["theme"];
	        this.language = source["language"];
	        this.nginx_workers = source["nginx_workers"];
	        this.nginx_keepalive = source["nginx_keepalive"];
	        this.minimize_to_tray = source["minimize_to_tray"];
	        this.show_app_log = source["show_app_log"];
	        this.preferred_browser = source["preferred_browser"];
	        this.notify_service_crash = source["notify_service_crash"];
	        this.notify_operation_fail = source["notify_operation_fail"];
	    }
	}

}

export namespace hosts {
	
	export class HostEntry {
	    ip: string;
	    host: string;
	    enabled: boolean;
	    system: boolean;
	
	    static createFrom(source: any = {}) {
	        return new HostEntry(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ip = source["ip"];
	        this.host = source["host"];
	        this.enabled = source["enabled"];
	        this.system = source["system"];
	    }
	}

}

export namespace main {
	
	export class AppInfo {
	    name: string;
	    version: string;
	    author: string;
	    repository: string;
	
	    static createFrom(source: any = {}) {
	        return new AppInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.version = source["version"];
	        this.author = source["author"];
	        this.repository = source["repository"];
	    }
	}
	export class UpdateInfo {
	    currentVersion: string;
	    latestVersion: string;
	    isUpToDate: boolean;
	    releaseURL: string;
	    error: string;
	
	    static createFrom(source: any = {}) {
	        return new UpdateInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.currentVersion = source["currentVersion"];
	        this.latestVersion = source["latestVersion"];
	        this.isUpToDate = source["isUpToDate"];
	        this.releaseURL = source["releaseURL"];
	        this.error = source["error"];
	    }
	}
	export class VersionResult {
	    version: string;
	    from_cache: boolean;
	
	    static createFrom(source: any = {}) {
	        return new VersionResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.version = source["version"];
	        this.from_cache = source["from_cache"];
	    }
	}

}

export namespace php {
	
	export class PHPConfig {
	    memory_limit: string;
	    post_max_size: string;
	    upload_max_filesize: string;
	    max_execution_time: string;
	    display_errors: boolean;
	
	    static createFrom(source: any = {}) {
	        return new PHPConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.memory_limit = source["memory_limit"];
	        this.post_max_size = source["post_max_size"];
	        this.upload_max_filesize = source["upload_max_filesize"];
	        this.max_execution_time = source["max_execution_time"];
	        this.display_errors = source["display_errors"];
	    }
	}
	export class PHPExtension {
	    name: string;
	    enabled: boolean;
	
	    static createFrom(source: any = {}) {
	        return new PHPExtension(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.enabled = source["enabled"];
	    }
	}

}

export namespace sites {
	
	export class Site {
	    name: string;
	    domain: string;
	    root: string;
	    php: string;
	    active: boolean;
	    laravel_version: string;
	
	    static createFrom(source: any = {}) {
	        return new Site(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.domain = source["domain"];
	        this.root = source["root"];
	        this.php = source["php"];
	        this.active = source["active"];
	        this.laravel_version = source["laravel_version"];
	    }
	}

}

export namespace system {
	
	export class Browser {
	    name: string;
	    path: string;
	
	    static createFrom(source: any = {}) {
	        return new Browser(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.path = source["path"];
	    }
	}
	export class PortConflict {
	    port: number;
	    service: string;
	    pid: number;
	    process_name: string;
	
	    static createFrom(source: any = {}) {
	        return new PortConflict(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.port = source["port"];
	        this.service = source["service"];
	        this.pid = source["pid"];
	        this.process_name = source["process_name"];
	    }
	}
	export class ServiceStatus {
	    name: string;
	    version: string;
	    running: boolean;
	    port: number;
	    type: string;
	
	    static createFrom(source: any = {}) {
	        return new ServiceStatus(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.version = source["version"];
	        this.running = source["running"];
	        this.port = source["port"];
	        this.type = source["type"];
	    }
	}
	export class SystemStats {
	    cpu: number;
	    ram_used: number;
	    ram_total: number;
	    ram_percent: number;
	    disk_used: number;
	    disk_total: number;
	    disk_percent: number;
	    uptime: string;
	
	    static createFrom(source: any = {}) {
	        return new SystemStats(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.cpu = source["cpu"];
	        this.ram_used = source["ram_used"];
	        this.ram_total = source["ram_total"];
	        this.ram_percent = source["ram_percent"];
	        this.disk_used = source["disk_used"];
	        this.disk_total = source["disk_total"];
	        this.disk_percent = source["disk_percent"];
	        this.uptime = source["uptime"];
	    }
	}

}

