package main

import (
	_ "embed"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

//go:embed wails.json
var wailsConfigBytes []byte

type wailsConfig struct {
	Name       string `json:"name"`
	Version    string `json:"version"`
	Repository string `json:"repository"`
	Author     struct {
		Name string `json:"name"`
	} `json:"author"`
}

// AppInfo holds public app metadata read from wails.json.
type AppInfo struct {
	Name       string `json:"name"`
	Version    string `json:"version"`
	Author     string `json:"author"`
	Repository string `json:"repository"`
}

// UpdateInfo holds the result of a check-for-updates call.
type UpdateInfo struct {
	CurrentVersion string `json:"currentVersion"`
	LatestVersion  string `json:"latestVersion"`
	IsUpToDate     bool   `json:"isUpToDate"`
	ReleaseURL     string `json:"releaseURL"`
	Error          string `json:"error"`
}

func readWailsConfig() wailsConfig {
	var cfg wailsConfig
	json.Unmarshal(wailsConfigBytes, &cfg)
	return cfg
}

// GetAppInfo returns app name, version, author and repository from wails.json.
func (a *App) GetAppInfo() AppInfo {
	cfg := readWailsConfig()
	return AppInfo{
		Name:       cfg.Name,
		Version:    cfg.Version,
		Author:     cfg.Author.Name,
		Repository: cfg.Repository,
	}
}

// CheckForUpdates fetches the latest release from GitHub and compares it with the current version.
func (a *App) CheckForUpdates() UpdateInfo {
	cfg := readWailsConfig()
	current := cfg.Version
	repo := cfg.Repository

	if repo == "" {
		return UpdateInfo{CurrentVersion: current, IsUpToDate: true}
	}

	apiURL := "https://api.github.com/repos/" + repo + "/releases/latest"
	req, err := http.NewRequest("GET", apiURL, nil)
	if err != nil {
		return UpdateInfo{CurrentVersion: current, IsUpToDate: true, Error: err.Error()}
	}
	req.Header.Set("User-Agent", "VeltryNora")
	req.Header.Set("Accept", "application/vnd.github.v3+json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return UpdateInfo{CurrentVersion: current, IsUpToDate: true, Error: err.Error()}
	}
	defer resp.Body.Close()

	var release struct {
		TagName string `json:"tag_name"`
		HTMLURL string `json:"html_url"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&release); err != nil {
		return UpdateInfo{CurrentVersion: current, IsUpToDate: true, Error: err.Error()}
	}

	latest := strings.TrimPrefix(release.TagName, "v")
	return UpdateInfo{
		CurrentVersion: current,
		LatestVersion:  latest,
		IsUpToDate:     latest == "" || latest == current,
		ReleaseURL:     release.HTMLURL,
	}
}

// OpenURL opens a URL in the default system browser.
func (a *App) OpenURL(url string) {
	runtime.BrowserOpenURL(a.ctx, url)
}
