package main

import (
	"context"
	"nginxpanel/internal/cache"
	"nginxpanel/internal/config"
	"nginxpanel/internal/nginx"
	"nginxpanel/internal/notify"
	"nginxpanel/internal/php"
	"nginxpanel/internal/redis"
	"nginxpanel/internal/system"
)

type App struct {
	ctx context.Context
}

type VersionResult struct {
	Version   string `json:"version"`
	FromCache bool   `json:"from_cache"`
}

func NewApp() *App {
	return &App{}
}

func checkLatestVersion(
	getLatest func() (string, error),
	getCached func(cache.VersionCache) string,
	setCached func(*cache.VersionCache, string),
) VersionResult {
	c, _ := cache.Load()
	cached := getCached(c)
	if !system.IsOnline() {
		return VersionResult{Version: cached, FromCache: true}
	}
	if !cache.IsExpired(c) && cached != "" {
		return VersionResult{Version: cached, FromCache: true}
	}
	version, err := getLatest()
	if err != nil || version == "necunoscut" {
		return VersionResult{Version: cached, FromCache: true}
	}
	setCached(&c, version)
	cache.Save(c)
	return VersionResult{Version: version, FromCache: false}
}

func (a *App) ShowNotification(title, message string) {
	notify.Show(title, message)
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	go system.StartServiceWatcher(ctx)

	s := config.LoadSettings()
	if s.AutoStart {
		basePath := system.GetBasePath()
		if nginx.GetActiveVersion() != "" && !nginx.IsRunning() {
			nginx.Start(basePath)
		}
		for _, v := range php.GetInstalledVersions() {
			if !php.IsRunning(v) {
				php.Start(v)
			}
		}
		if active := redis.GetActiveVersion(); active != "" && !redis.IsRunning() {
			redis.Start(active)
		}
	}
}
