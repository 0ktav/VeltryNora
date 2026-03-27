package main

import (
	"context"
	"nginxpanel/internal/applog"
	"nginxpanel/internal/git"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

func (a *App) CheckGit() string {
	return git.GetVersion()
}

func (a *App) DownloadGit(addToPath bool) bool {
	const key = "git:download-progress"
	ctx, cancel := context.WithCancel(a.ctx)
	a.registerDownload(key, cancel)
	defer func() {
		cancel()
		a.unregisterDownload(key)
	}()

	applog.Info("Git download started")
	err := git.Download(ctx, addToPath, func(percent int, totalMB float64) {
		runtime.EventsEmit(a.ctx, key, map[string]interface{}{"percent": percent, "totalMB": totalMB})
	})
	if err != nil {
		applog.Errorf("Git download failed: %s", err.Error())
		runtime.EventsEmit(a.ctx, "git:download-error", err.Error())
		return false
	}
	applog.Infof("Git installed successfully (%s)", git.GetVersion())
	return true
}
