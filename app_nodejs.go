package main

import (
	"context"
	"nginxpanel/internal/applog"
	"nginxpanel/internal/nodejs"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

func (a *App) CheckNodeJS() string {
	return nodejs.GetVersion()
}

func (a *App) DownloadNodeJS(addToPath bool) bool {
	const key = "nodejs:download-progress"
	ctx, cancel := context.WithCancel(a.ctx)
	a.registerDownload(key, cancel)
	defer func() {
		cancel()
		a.unregisterDownload(key)
	}()

	applog.Info("Node.js download started")
	err := nodejs.Download(ctx, addToPath, func(percent int, totalMB float64) {
		runtime.EventsEmit(a.ctx, key, map[string]interface{}{"percent": percent, "totalMB": totalMB})
	})
	if err != nil {
		applog.Errorf("Node.js download failed: %s", err.Error())
		runtime.EventsEmit(a.ctx, "nodejs:download-error", err.Error())
		return false
	}
	applog.Infof("Node.js installed successfully (%s)", nodejs.GetVersion())
	return true
}
