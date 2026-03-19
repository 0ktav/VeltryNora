package main

import "nginxpanel/internal/applog"

func (a *App) GetAppLog() []string {
	return applog.GetLines(300)
}

func (a *App) ClearAppLog() bool {
	return applog.Clear() == nil
}
