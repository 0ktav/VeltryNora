package main

import (
	"nginxpanel/internal/cache"
	"nginxpanel/internal/notify"
	"nginxpanel/internal/redis"
	"strings"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

func (a *App) CheckRedisVersion() VersionResult {
	return checkLatestVersion(
		redis.GetLatestVersion,
		func(c cache.VersionCache) string { return c.Redis },
		func(c *cache.VersionCache, v string) { c.Redis = v },
	)
}

func (a *App) GetRedisInstalledVersions() []string {
	return redis.GetInstalledVersions()
}

func (a *App) GetRedisActiveVersion() string {
	return redis.GetActiveVersion()
}

func (a *App) SetRedisActiveVersion(version string) bool {
	err := redis.SetActiveVersion(version)
	return err == nil
}

func (a *App) GetRedisAvailableVersions() []string {
	return redis.GetAvailableVersions()
}

func (a *App) IsRedisRunning() bool {
	return redis.IsRunning()
}

func (a *App) DownloadRedis(version string) bool {
	err := redis.Download(version, func(percent int) {
		runtime.EventsEmit(a.ctx, "redis:download-progress", percent)
	})
	return err == nil
}

func (a *App) StartRedis() bool {
	active := redis.GetActiveVersion()
	err := redis.Start(active)
	return err == nil
}

func (a *App) StopRedis() bool {
	notify.SuppressNext("Redis_")
	err := redis.Stop()
	return err == nil
}

func (a *App) RestartRedis() bool {
	notify.SuppressNext("Redis_")
	active := redis.GetActiveVersion()
	err := redis.Restart(active)
	return err == nil
}

func (a *App) DeleteRedisVersion(version string) bool {
	err := redis.DeleteVersion(version)
	return err == nil
}

func (a *App) ExecRedisCommand(cmd string) string {
	parts := strings.Fields(cmd)
	if len(parts) == 0 {
		return ""
	}
	out, err := redis.ExecCommand(parts...)
	if err != nil {
		return "Error: " + err.Error()
	}
	return out
}
