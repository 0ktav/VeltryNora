package main

import (
	"nginxpanel/internal/applog"
	"nginxpanel/internal/nodejs"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

func (a *App) CheckNodeJS() string {
	return nodejs.GetVersion()
}

func (a *App) DownloadNodeJS(addToPath bool) bool {
	applog.Info("Node.js download started")
	err := nodejs.Download(addToPath, func(percent int) {
		runtime.EventsEmit(a.ctx, "nodejs:download-progress", percent)
	})
	if err != nil {
		applog.Errorf("Node.js download failed: %s", err.Error())
		runtime.EventsEmit(a.ctx, "nodejs:download-error", err.Error())
		return false
	}
	applog.Infof("Node.js installed successfully (%s)", nodejs.GetVersion())
	return true
}
