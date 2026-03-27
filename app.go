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
	"sync"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type App struct {
	ctx             context.Context
	forceQuit       bool
	downloadCancels map[string]context.CancelFunc
	downloadMu      sync.Mutex
}

type VersionResult struct {
	Version   string    `json:"version"`
	FromCache bool      `json:"from_cache"`
	CachedAt  time.Time `json:"cached_at"`
}

func NewApp() *App {
	return &App{
		downloadCancels: make(map[string]context.CancelFunc),
	}
}

func checkLatestVersion(
	getLatest func() (string, error),
	getCached func(cache.VersionCache) string,
	setCached func(*cache.VersionCache, string),
	getUpdatedAt func(cache.VersionCache) time.Time,
	setUpdatedAt func(*cache.VersionCache, time.Time),
) VersionResult {
	c, _ := cache.Load()
	cached := getCached(c)
	updatedAt := getUpdatedAt(c)
	if !system.IsOnline() {
		return VersionResult{Version: cached, FromCache: true, CachedAt: updatedAt}
	}
	if !cache.IsServiceExpired(updatedAt) && cached != "" {
		return VersionResult{Version: cached, FromCache: true, CachedAt: updatedAt}
	}
	version, err := getLatest()
	if err != nil || version == "necunoscut" {
		return VersionResult{Version: cached, FromCache: true, CachedAt: updatedAt}
	}
	now := time.Now()
	setCached(&c, version)
	setUpdatedAt(&c, now)
	cache.Save(c)
	return VersionResult{Version: version, FromCache: false, CachedAt: now}
}

func (a *App) ShowNotification(title, message string) {
	notify.Show(title, message)
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	go system.StartServiceWatcher(ctx)

	go func() {
		time.Sleep(3 * time.Second)
		info := a.CheckForUpdates()
		if !info.IsUpToDate && info.DownloadURL != "" {
			runtime.EventsEmit(a.ctx, "update:available", info)
			notify.Show("VeltryNora", "Version v"+info.LatestVersion+" is available. Open the app to update.")
		}
	}()

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
