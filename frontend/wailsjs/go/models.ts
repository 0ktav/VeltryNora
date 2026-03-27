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
	    tabs_layout: boolean;
	
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
	        this.tabs_layout = source["tabs_layout"];
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
	export class VersionResult {
	    version: string;
	    from_cache: boolean;
	    // Go type: time
	    cached_at: any;
	
	    static createFrom(source: any = {}) {
	        return new VersionResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.version = source["version"];
	        this.from_cache = source["from_cache"];
	        this.cached_at = this.convertValues(source["cached_at"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class DashboardVersions {
	    nginx: VersionResult;
	    php: VersionResult;
	    redis: VersionResult;
	
	    static createFrom(source: any = {}) {
	        return new DashboardVersions(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.nginx = this.convertValues(source["nginx"], VersionResult);
	        this.php = this.convertValues(source["php"], VersionResult);
	        this.redis = this.convertValues(source["redis"], VersionResult);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class MySQLConnectionInfo {
	    host: string;
	    port: number;
	    user: string;
	    hasPassword: boolean;
	    password: string;
	
	    static createFrom(source: any = {}) {
	        return new MySQLConnectionInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.host = source["host"];
	        this.port = source["port"];
	        this.user = source["user"];
	        this.hasPassword = source["hasPassword"];
	        this.password = source["password"];
	    }
	}
	export class MySQLDatabaseInfo {
	    name: string;
	    charset: string;
	    collation: string;
	
	    static createFrom(source: any = {}) {
	        return new MySQLDatabaseInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.charset = source["charset"];
	        this.collation = source["collation"];
	    }
	}
	export class MySQLUserInfo {
	    user: string;
	    host: string;
	    hasPassword: boolean;
	
	    static createFrom(source: any = {}) {
	        return new MySQLUserInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.user = source["user"];
	        this.host = source["host"];
	        this.hasPassword = source["hasPassword"];
	    }
	}
	export class UpdateInfo {
	    currentVersion: string;
	    latestVersion: string;
	    isUpToDate: boolean;
	    releaseURL: string;
	    downloadURL: string;
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
	        this.downloadURL = source["downloadURL"];
	        this.error = source["error"];
	    }
	}

}

export namespace php {
	
	export class PHPConfig {
	    memory_limit: string;
	    post_max_size: string;
	    upload_max_filesize: string;
	    max_execution_time: string;
	    max_input_time: string;
	    display_errors: boolean;
	    html_errors: boolean;
	    log_errors: boolean;
	    short_open_tag: boolean;
	
	    static createFrom(source: any = {}) {
	        return new PHPConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.memory_limit = source["memory_limit"];
	        this.post_max_size = source["post_max_size"];
	        this.upload_max_filesize = source["upload_max_filesize"];
	        this.max_execution_time = source["max_execution_time"];
	        this.max_input_time = source["max_input_time"];
	        this.display_errors = source["display_errors"];
	        this.html_errors = source["html_errors"];
	        this.log_errors = source["log_errors"];
	        this.short_open_tag = source["short_open_tag"];
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
	    disk_drive: string;
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
	        this.disk_drive = source["disk_drive"];
	        this.uptime = source["uptime"];
	    }
	}

}

