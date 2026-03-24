package main

import (
	"nginxpanel/internal/applog"
	"nginxpanel/internal/git"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

func (a *App) CheckGit() string {
	return git.GetVersion()
}

func (a *App) DownloadGit(addToPath bool) bool {
	applog.Info("Git download started")
	err := git.Download(addToPath, func(percent int, totalMB float64) {
		runtime.EventsEmit(a.ctx, "git:download-progress", map[string]interface{}{"percent": percent, "totalMB": totalMB})
	})
	if err != nil {
		applog.Errorf("Git download failed: %s", err.Error())
		runtime.EventsEmit(a.ctx, "git:download-error", err.Error())
		return false
	}
	applog.Infof("Git installed successfully (%s)", git.GetVersion())
	return true
}
