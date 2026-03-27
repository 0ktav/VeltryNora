package main

import (
	"context"
	"nginxpanel/internal/cache"
	"nginxpanel/internal/notify"
	"nginxpanel/internal/php"
	"nginxpanel/internal/system"
	"os/exec"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

func (a *App) CheckPHPVersion() VersionResult {
	return checkLatestVersion(
		php.GetLatestVersion,
		func(c cache.VersionCache) string { return c.PHP },
		func(c *cache.VersionCache, v string) { c.PHP = v },
		func(c cache.VersionCache) time.Time { return c.PHPUpdatedAt },
		func(c *cache.VersionCache, t time.Time) { c.PHPUpdatedAt = t },
	)
}

func (a *App) GetPHPInstalledVersions() []string {
	return php.GetInstalledVersions()
}

func (a *App) GetPHPAvailableVersions() []string {
	return php.GetAvailableVersions()
}

func (a *App) GetPHPArchivedVersions() []string {
	return php.GetArchivedVersions()
}

func (a *App) IsPHPRunning(version string) bool {
	return php.IsRunning(version)
}

func (a *App) DownloadPHP(version string) string {
	key := "php:download-progress:" + version
	ctx, cancel := context.WithCancel(a.ctx)
	a.registerDownload(key, cancel)
	defer func() {
		cancel()
		a.unregisterDownload(key)
	}()

	err := php.Download(ctx, version, func(percent int, totalMB float64) {
		runtime.EventsEmit(a.ctx, key, map[string]interface{}{"percent": percent, "totalMB": totalMB})
	})
	if err != nil {
		return err.Error()
	}
	return ""
}

func (a *App) DeletePHPVersion(version string) bool {
	basePath := system.GetBasePath()
	err := php.DeleteVersion(version, basePath)
	return err == nil
}

func (a *App) StartPHP(version string) bool {
	err := php.Start(version)
	return err == nil
}

func (a *App) StopPHP(version string) bool {
	notify.SuppressNext("PHP-FPM_" + version)
	err := php.Stop(version)
	return err == nil
}

func (a *App) GetPHPConfig(version string) php.PHPConfig {
	return php.GetConfig(version)
}

func (a *App) SavePHPConfig(version string, cfg php.PHPConfig) bool {
	return php.SaveConfig(version, cfg) == nil
}

func (a *App) GetPHPIni(version string) string {
	return php.GetIni(version)
}

func (a *App) SavePHPIni(version string, content string) bool {
	return php.SaveIni(version, content) == nil
}

func (a *App) OpenPHPIni(version string) bool {
	path := php.GetIniPath(version)
	return exec.Command("notepad", path).Start() == nil
}

func (a *App) GetPHPExtensions(version string) []php.PHPExtension {
	return php.GetExtensions(version)
}

func (a *App) SavePHPExtensions(version string, enabled []string) bool {
	return php.SaveExtensions(version, enabled) == nil
}
