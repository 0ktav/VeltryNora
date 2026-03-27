package main

import "context"

func (a *App) CancelDownload(key string) {
	a.downloadMu.Lock()
	defer a.downloadMu.Unlock()
	if cancel, ok := a.downloadCancels[key]; ok {
		cancel()
	}
}

func (a *App) registerDownload(key string, cancel context.CancelFunc) {
	a.downloadMu.Lock()
	a.downloadCancels[key] = cancel
	a.downloadMu.Unlock()
}

func (a *App) unregisterDownload(key string) {
	a.downloadMu.Lock()
	delete(a.downloadCancels, key)
	a.downloadMu.Unlock()
}
