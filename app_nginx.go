package main

import (
	"context"
	"nginxpanel/internal/cache"
	"nginxpanel/internal/nginx"
	"nginxpanel/internal/notify"
	"nginxpanel/internal/system"
	"nginxpanel/internal/winexec"
	"path/filepath"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

func (a *App) CheckNginxVersion() VersionResult {
	return checkLatestVersion(
		nginx.GetLatestVersion,
		func(c cache.VersionCache) string { return c.Nginx },
		func(c *cache.VersionCache, v string) { c.Nginx = v },
		func(c cache.VersionCache) time.Time { return c.NginxUpdatedAt },
		func(c *cache.VersionCache, t time.Time) { c.NginxUpdatedAt = t },
	)
}

func (a *App) GetNginxInstalledVersions() []string {
	return nginx.GetInstalledVersions()
}

func (a *App) GetNginxActiveVersion() string {
	return nginx.GetActiveVersion()
}

func (a *App) SetNginxActiveVersion(version string) bool {
	err := nginx.SetActiveVersion(version)
	return err == nil
}

func (a *App) GetNginxAvailableVersions() []string {
	return nginx.GetAvailableVersions()
}

func (a *App) IsNginxRunning() bool {
	return nginx.IsRunning()
}

func (a *App) DownloadNginx(version string) bool {
	key := "nginx:download-progress:" + version
	ctx, cancel := context.WithCancel(a.ctx)
	a.registerDownload(key, cancel)
	defer func() {
		cancel()
		a.unregisterDownload(key)
	}()

	err := nginx.Download(ctx, version, func(percent int, totalMB float64) {
		runtime.EventsEmit(a.ctx, key, map[string]interface{}{"percent": percent, "totalMB": totalMB})
	})
	return err == nil
}

func (a *App) StartNginx() string {
	err := nginx.Start(system.GetBasePath())
	if err != nil {
		return err.Error()
	}
	return ""
}

func (a *App) StopNginx() bool {
	notify.SuppressNext("Nginx_")
	err := nginx.Stop()
	return err == nil
}

func (a *App) RestartNginx() string {
	notify.SuppressNext("Nginx_")
	err := nginx.Restart(system.GetBasePath())
	if err != nil {
		return err.Error()
	}
	return ""
}

func (a *App) DeleteNginxVersion(version string) bool {
	err := nginx.DeleteVersion(version)
	return err == nil
}

func (a *App) ReloadNginx() bool {
	active := nginx.GetActiveVersion()
	basePath := system.GetBasePath()
	exePath := filepath.Join(basePath, "nginx", active, "nginx.exe")
	configPath := filepath.Join(basePath, "config", "nginx.conf")

	err := winexec.Command(exePath, "-c", configPath, "-s", "reload").Run()
	return err == nil
}
