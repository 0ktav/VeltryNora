package main

import (
	"bufio"
	"nginxpanel/internal/applog"
	"nginxpanel/internal/sites"
	"nginxpanel/internal/winexec"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// RunArtisan runs a php artisan command for the given site and returns combined output.
// Returns an error string prefixed with "ERROR:" on failure.
func (a *App) RunArtisan(name string, phpVersion string, command string) string {
	site, err := sites.GetSiteByName(name)
	if err != nil {
		return "ERROR: site not found"
	}

	projectRoot := sites.LaravelProjectRoot(site.Root)
	if _, err := os.Stat(filepath.Join(projectRoot, "artisan")); err != nil {
		return "ERROR: artisan not found in " + projectRoot
	}

	phpExe := phpExeForVersion(phpVersion)
	parts := strings.Fields(command)
	args := append([]string{filepath.Join(projectRoot, "artisan")}, parts...)

	cmd := winexec.Command(phpExe, args...)
	cmd.Dir = projectRoot

	out, err := cmd.CombinedOutput()
	result := strings.TrimSpace(string(out))
	if err != nil && result == "" {
		return "ERROR: " + err.Error()
	}
	return result
}

// RunLaravelUpdate runs `composer update laravel/framework` for the given site.
// Streams output via "laravel-update-output" events and signals completion via "laravel-update-done".
func (a *App) RunLaravelUpdate(name string, phpVersion string) {
	site, err := sites.GetSiteByName(name)
	if err != nil {
		runtime.EventsEmit(a.ctx, "laravel-update-done", false)
		return
	}

	projectRoot := sites.LaravelProjectRoot(site.Root)
	if _, err := os.Stat(filepath.Join(projectRoot, "composer.json")); err != nil {
		runtime.EventsEmit(a.ctx, "laravel-update-output", "ERROR: composer.json not found in "+projectRoot)
		runtime.EventsEmit(a.ctx, "laravel-update-done", false)
		return
	}

	composerArgs := resolveComposerArgs()
	if composerArgs == nil {
		runtime.EventsEmit(a.ctx, "laravel-update-output", "ERROR: Composer is not installed.")
		runtime.EventsEmit(a.ctx, "laravel-update-done", false)
		return
	}

	phpExe := phpExeForVersion(phpVersion)
	// Override the PHP executable in composer args if it starts with a php path
	if len(composerArgs) > 1 {
		composerArgs[0] = phpExe
	}

	cmdArgs := append(composerArgs, "update", "laravel/framework", "--no-interaction", "--no-ansi", "--with-all-dependencies")
	cmd := winexec.Command(cmdArgs[0], cmdArgs[1:]...)
	cmd.Dir = projectRoot

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		runtime.EventsEmit(a.ctx, "laravel-update-done", false)
		return
	}
	stderr, err := cmd.StderrPipe()
	if err != nil {
		runtime.EventsEmit(a.ctx, "laravel-update-done", false)
		return
	}

	if err := cmd.Start(); err != nil {
		runtime.EventsEmit(a.ctx, "laravel-update-done", false)
		return
	}

	var wg sync.WaitGroup
	wg.Add(2)
	go func() {
		defer wg.Done()
		scanner := bufio.NewScanner(stdout)
		for scanner.Scan() {
			runtime.EventsEmit(a.ctx, "laravel-update-output", scanner.Text())
		}
	}()
	go func() {
		defer wg.Done()
		scanner := bufio.NewScanner(stderr)
		for scanner.Scan() {
			runtime.EventsEmit(a.ctx, "laravel-update-output", scanner.Text())
		}
	}()

	err = cmd.Wait()
	wg.Wait()
	if err != nil {
		applog.Errorf("Laravel update failed for %s: %s", name, err.Error())
	} else {
		applog.Infof("Laravel updated successfully for %s", name)
	}
	runtime.EventsEmit(a.ctx, "laravel-update-done", err == nil)
}
