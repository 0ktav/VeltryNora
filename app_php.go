package main

import (
	"nginxpanel/internal/cache"
	"nginxpanel/internal/php"
	"nginxpanel/internal/system"
	"os/exec"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

func (a *App) CheckPHPVersion() VersionResult {
	return checkLatestVersion(
		php.GetLatestVersion,
		func(c cache.VersionCache) string { return c.PHP },
		func(c *cache.VersionCache, v string) { c.PHP = v },
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
	err := php.Download(version, func(percent int) {
		runtime.EventsEmit(a.ctx, "php:download-progress", percent)
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
