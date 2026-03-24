package config

const (
	// URLs
	NginxGitHubAPI         = "https://api.github.com/repos/nginx/nginx/tags"
	NginxDownloadURL       = "https://nginx.org/download"
	PHPReleasesListURL     = "https://windows.php.net/downloads/releases/"
	PHPReleasesJSONURL    = "https://windows.php.net/downloads/releases/releases.json"
	PHPDownloadURL         = "https://windows.php.net/downloads/releases"
	PHPArchivesListURL     = "https://windows.php.net/downloads/releases/archives/"
	PHPArchivesDownloadURL = "https://windows.php.net/downloads/releases/archives"
	RedisGitHubAPI         = "https://api.github.com/repos/tporadowski/redis/releases"
	RedisDownloadURL       = "https://github.com/tporadowski/redis/releases/download"
	DNSCheckURL            = "https://dns.google"

	// App
	AppName          = "Veltrynora"
	AppDataFolder    = "VeltryNora"
	CacheFile        = "version_cache.json"
	CacheExpireHours = 24
	HostsFile        = "\\System32\\drivers\\etc\\hosts"

	// PHP compilers
	PHPCompilerVS17 = "vs17"
	PHPCompilerVS16 = "vs16"
	PHPVC15         = "vc15"
	PHPVC14         = "vc14"
	PHPVC11         = "vc11"
	PHPVC9          = "vc9"

	// Git for Windows (MinGit)
	GitLatestReleaseURL = "https://api.github.com/repos/git-for-windows/git/releases/latest"

	// Node.js
	NodeReleasesURL     = "https://nodejs.org/dist/index.json"
	NodeDownloadBaseURL = "https://nodejs.org/dist"

	// MySQL
	MySQLDownloadBaseURL        = "https://cdn.mysql.com/Downloads"
	MySQLArchiveDownloadBaseURL = "https://downloads.mysql.com/archives/get/p/23/file"
	MySQLPort                   = 3306

	// Paths
	DownloadsFolder = "downloads"
	NginxFolder     = "nginx"
	PHPFolder       = "php"
	RedisFolder     = "redis"
	MySQLFolder     = "mysql"
	GitFolder       = "git"
	NodeFolder      = "nodejs"
	ConfigFolder    = "config"
	SitesFolder     = "sites"
	LogsFolder      = "logs"
	SiteLogsFolder  = "sites"
	WWWFolder       = "www"
	ToolsFolder     = "tools"
)
