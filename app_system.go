package main

import (
	"fmt"
	"nginxpanel/internal/config"
	"nginxpanel/internal/hosts"
	"nginxpanel/internal/mysql"
	"nginxpanel/internal/nginx"
	"nginxpanel/internal/php"
	"nginxpanel/internal/redis"
	"nginxpanel/internal/system"
	"nginxpanel/internal/winexec"
	"os"
	"path/filepath"
	"strings"
)

func (a *App) GetSystemStats() system.SystemStats {
	stats, _ := system.GetStats()
	return stats
}

func (a *App) GetServicesStatus() []system.ServiceStatus {
	return system.GetServicesStatus()
}

func (a *App) IsOnline() bool {
	return system.IsOnline()
}

func (a *App) CheckWinget() bool {
	return system.IsWingetAvailable()
}

func (a *App) GetBasePath() string {
	return system.GetBasePath()
}

func (a *App) CheckPortConflicts() []system.PortConflict {
	ports := map[int]string{
		80:   "Nginx",
		6379: "Redis",
		3306: "MySQL",
	}
	// Add PHP FastCGI ports dynamically
	for _, v := range php.GetInstalledVersions() {
		port := phpVersionToPort(v)
		ports[port] = "PHP " + v
	}
	return system.CheckPortConflicts(ports)
}

func phpVersionToPort(version string) int {
	parts := strings.Split(version, ".")
	if len(parts) >= 2 {
		var major, minor int
		fmt.Sscanf(parts[0], "%d", &major)
		fmt.Sscanf(parts[1], "%d", &minor)
		return 9000 + major*10 + minor
	}
	return 9000
}

func (a *App) KillProcess(pid int) bool {
	return system.KillProcess(pid)
}

func (a *App) GetHostsEntries() []hosts.HostEntry {
	return hosts.GetEntries()
}

func (a *App) AddHostEntry(ip, host string) bool {
	return hosts.AddEntry(ip, host) == nil
}

func (a *App) ToggleHostEntry(host string) bool {
	return hosts.ToggleEntry(host) == nil
}

func (a *App) DeleteHostEntry(host string) bool {
	return hosts.DeleteEntry(host) == nil
}

func (a *App) DeleteHostEntries(hostnames []string) bool {
	return hosts.DeleteEntries(hostnames) == nil
}

func (a *App) GetInstalledBrowsers() []system.Browser {
	return system.GetInstalledBrowsers()
}

func (a *App) OpenInBrowser(url string) {
	system.OpenInBrowser(url)
}

func (a *App) GetDefaultBasePath() string {
	return system.GetDefaultBasePath()
}

func (a *App) GetSettings() config.AppSettings {
	return config.LoadSettings()
}

func (a *App) SaveSettings(s config.AppSettings) bool {
	applyStartOnBoot(s.StartOnBoot)
	err := config.SaveSettings(s)
	return err == nil
}

func (a *App) StopAllServices() {
	nginx.Stop()
	for _, v := range php.GetInstalledVersions() {
		php.Stop(v)
	}
	redis.Stop()
	if active := mysql.GetActiveVersion(); active != "" {
		mysql.Stop(active)
	}
}

func (a *App) GetLogs(logType string, maxLines int) []string {
	basePath := system.GetBasePath()
	var logPath string
	switch logType {
	case "error":
		logPath = filepath.Join(basePath, config.LogsFolder, "error.log")
	case "access":
		logPath = filepath.Join(basePath, config.LogsFolder, "access.log")
	default:
		if len(logType) > 4 && logType[:4] == "php:" {
			logPath = filepath.Join(basePath, config.PHPFolder, logType[4:], "php.log")
		} else if len(logType) > 6 && logType[:6] == "redis:" {
			logPath = filepath.Join(basePath, config.RedisFolder, logType[6:], "redis.log")
		} else if logType == "mysql" {
			logPath = mysql.LogPath(mysql.GetActiveVersion())
		} else if len(logType) > 12 && logType[:12] == "site-access:" {
			logPath = filepath.Join(basePath, config.LogsFolder, config.SiteLogsFolder, logType[12:]+"-access.log")
		} else if len(logType) > 11 && logType[:11] == "site-error:" {
			logPath = filepath.Join(basePath, config.LogsFolder, config.SiteLogsFolder, logType[11:]+"-error.log")
		} else {
			return []string{}
		}
	}
	return system.ReadLastLines(logPath, maxLines)
}

func (a *App) ClearLog(logType string) bool {
	basePath := system.GetBasePath()
	var logPath string
	switch logType {
	case "error":
		logPath = filepath.Join(basePath, config.LogsFolder, "error.log")
	case "access":
		logPath = filepath.Join(basePath, config.LogsFolder, "access.log")
	default:
		if len(logType) > 4 && logType[:4] == "php:" {
			logPath = filepath.Join(basePath, config.PHPFolder, logType[4:], "php.log")
		} else if len(logType) > 6 && logType[:6] == "redis:" {
			logPath = filepath.Join(basePath, config.RedisFolder, logType[6:], "redis.log")
		} else if logType == "mysql" {
			logPath = mysql.LogPath(mysql.GetActiveVersion())
		} else if len(logType) > 12 && logType[:12] == "site-access:" {
			logPath = filepath.Join(basePath, config.LogsFolder, config.SiteLogsFolder, logType[12:]+"-access.log")
		} else if len(logType) > 11 && logType[:11] == "site-error:" {
			logPath = filepath.Join(basePath, config.LogsFolder, config.SiteLogsFolder, logType[11:]+"-error.log")
		} else {
			return false
		}
	}
	return os.WriteFile(logPath, []byte{}, 0644) == nil
}

func applyStartOnBoot(enabled bool) {
	exePath, err := os.Executable()
	if err != nil {
		return
	}
	if enabled {
		winexec.Command("reg", "add",
			`HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Run`,
			"/v", "VeltryNora", "/t", "REG_SZ", "/d", exePath, "/f",
		).Run()
	} else {
		winexec.Command("reg", "delete",
			`HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Run`,
			"/v", "VeltryNora", "/f",
		).Run()
	}
}
