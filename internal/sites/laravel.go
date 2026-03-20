package sites

import (
	"encoding/json"
	"os"
	"path/filepath"
)

// LaravelInfo holds detection info for a Laravel installation.
type LaravelInfo struct {
	IsLaravel bool   `json:"is_laravel"`
	Version   string `json:"version"`
}

// LaravelProjectRoot returns the Laravel project root for a given site web root.
// If the web root is a "public" directory, the project root is its parent.
func LaravelProjectRoot(siteRoot string) string {
	siteRoot = filepath.FromSlash(siteRoot)
	if filepath.Base(siteRoot) == "public" {
		return filepath.Dir(siteRoot)
	}
	return siteRoot
}

// GetLaravelInfo detects whether the site root contains a Laravel project
// and returns the framework version from composer.lock.
func GetLaravelInfo(siteRoot string) LaravelInfo {
	root := LaravelProjectRoot(siteRoot)

	if _, err := os.Stat(filepath.Join(root, "artisan")); err != nil {
		return LaravelInfo{}
	}

	return LaravelInfo{
		IsLaravel: true,
		Version:   laravelVersionFromLock(root),
	}
}

type composerLock struct {
	Packages []struct {
		Name    string `json:"name"`
		Version string `json:"version"`
	} `json:"packages"`
}

// laravelVersionFromLock reads the laravel/framework version from composer.lock.
func laravelVersionFromLock(projectRoot string) string {
	data, err := os.ReadFile(filepath.Join(projectRoot, "composer.lock"))
	if err != nil {
		return ""
	}
	var lock composerLock
	if err := json.Unmarshal(data, &lock); err != nil {
		return ""
	}
	for _, pkg := range lock.Packages {
		if pkg.Name == "laravel/framework" {
			return pkg.Version
		}
	}
	return ""
}
