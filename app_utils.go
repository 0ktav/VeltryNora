package main

import (
	"bufio"
	"fmt"
	"io"
	"net/http"
	"nginxpanel/internal/applog"
	"nginxpanel/internal/config"
	"nginxpanel/internal/php"
	"nginxpanel/internal/system"
	"nginxpanel/internal/winexec"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"sync"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

func composerPharPath() string {
	return filepath.Join(system.GetBasePath(), config.ToolsFolder, "composer.phar")
}

func phpExeForVersion(version string) string {
	basePath := system.GetBasePath()
	if version != "" && version != "0" {
		p := filepath.Join(basePath, config.PHPFolder, version, "php.exe")
		if _, err := os.Stat(p); err == nil {
			return p
		}
	}
	// Pick the highest installed version using semver sort
	versions := php.GetInstalledVersions()
	sort.Slice(versions, func(i, j int) bool {
		return compareSemver(versions[i], versions[j]) > 0
	})
	for _, v := range versions {
		p := filepath.Join(basePath, config.PHPFolder, v, "php.exe")
		if _, err := os.Stat(p); err == nil {
			return p
		}
	}
	return "php"
}

// compareSemver returns positive if a > b, negative if a < b, 0 if equal.
func compareSemver(a, b string) int {
	partsA := strings.SplitN(a, ".", 3)
	partsB := strings.SplitN(b, ".", 3)
	for i := 0; i < 3; i++ {
		var x, y int
		if i < len(partsA) {
			fmt.Sscanf(partsA[i], "%d", &x)
		}
		if i < len(partsB) {
			fmt.Sscanf(partsB[i], "%d", &y)
		}
		if x != y {
			return x - y
		}
	}
	return 0
}

// CheckComposer returns the composer version string if installed, or empty string.
// Only uses app-managed PHP — never falls back to a system PHP that may be outdated.
func (a *App) CheckComposer() string {
	phar := composerPharPath()
	if _, err := os.Stat(phar); err != nil {
		return ""
	}
	phpExe := phpExeForVersion("")
	if phpExe == "php" {
		// No managed PHP found — phar exists but we can't verify version
		return "installed"
	}
	out, err := winexec.Command(phpExe, phar, "--version", "--no-ansi").Output()
	if err != nil {
		return "installed"
	}
	lines := strings.Split(strings.TrimSpace(string(out)), "\n")
	return strings.TrimSpace(lines[0])
}

// InstallComposer downloads composer.phar and creates composer.bat.
// If addToPath is true, the tools/ directory is appended to the machine PATH.
func (a *App) InstallComposer(addToPath bool) bool {
	applog.Info("Composer install started")
	toolsDir := filepath.Join(system.GetBasePath(), config.ToolsFolder)
	if err := os.MkdirAll(toolsDir, 0755); err != nil {
		return false
	}

	// Download composer.phar
	resp, err := http.Get("https://getcomposer.org/composer-stable.phar")
	if err != nil {
		return false
	}
	defer resp.Body.Close()

	phar := composerPharPath()
	f, err := os.Create(phar)
	if err != nil {
		return false
	}
	defer f.Close()
	if _, err = io.Copy(f, resp.Body); err != nil {
		return false
	}

	// Create composer.bat using the highest installed PHP version
	phpExe := phpExeForVersion("")
	var batContent string
	if phpExe == "php" {
		batContent = "@echo off\r\necho Error: No PHP found in VeltryNora. Please install PHP first.\r\nexit /b 1\r\n"
	} else {
		batContent = "@echo off\r\n\"" + phpExe + "\" \"" + phar + "\" %*\r\n"
	}
	batPath := filepath.Join(toolsDir, "composer.bat")
	if err := os.WriteFile(batPath, []byte(batContent), 0644); err != nil {
		return false
	}

	if addToPath {
		addToSystemPath(toolsDir)
	}

	applog.Info("Composer installed successfully")
	return true
}

// addToSystemPath appends dir to the system PATH via PowerShell.
// PowerShell's SetEnvironmentVariable broadcasts WM_SETTINGCHANGE automatically,
// so new CMD windows pick it up without requiring a reboot.
func addToSystemPath(dir string) {
	script := `
$dir = '` + strings.ReplaceAll(dir, `'`, `''`) + `'
$current = [Environment]::GetEnvironmentVariable('Path', 'Machine')
$parts = $current -split ';' | Where-Object { $_ -ne '' }
if (-not ($parts | Where-Object { $_.TrimEnd('\') -ieq $dir.TrimEnd('\') })) {
    [Environment]::SetEnvironmentVariable('Path', ($current.TrimEnd(';') + ';' + $dir), 'Machine')
}
`
	winexec.Command("powershell", "-NoProfile", "-NonInteractive", "-Command", script).Run()
}

// CreateLaravelProject runs `composer create-project laravel/laravel` in www/{domain}.
// Streams output via "laravel-output" events and signals completion via "laravel-done".
func (a *App) CreateLaravelProject(domain string, phpVersion string) bool {
	applog.Infof("Laravel project creation started: domain=%s php=%s", domain, phpVersion)
	projectDir := filepath.Join(system.GetBasePath(), config.WWWFolder, domain)
	os.RemoveAll(projectDir)
	if err := os.MkdirAll(projectDir, 0755); err != nil {
		applog.Errorf("Laravel: failed to create project dir: %s", err.Error())
		runtime.EventsEmit(a.ctx, "laravel-done", false)
		return false
	}

	phpExe := phpExeForVersion(phpVersion)
	phar := composerPharPath()

	checkExt := func(name string) bool {
		o, _ := winexec.Command(phpExe, "-r", "echo extension_loaded('"+name+"') ? '1' : '0';").Output()
		return strings.TrimSpace(string(o)) == "1"
	}

	if !checkExt("openssl") {
		applog.Errorf("Laravel: openssl extension not enabled for PHP %s", phpVersion)
		runtime.EventsEmit(a.ctx, "laravel-output", "ERROR: openssl extension is not enabled for PHP "+phpVersion+".")
		runtime.EventsEmit(a.ctx, "laravel-output", "Enable it from the PHP Extensions panel and try again.")
		runtime.EventsEmit(a.ctx, "laravel-done", false)
		return false
	}
	if !checkExt("zip") {
		applog.Warnf("Laravel: zip extension not enabled for PHP %s, using git clone", phpVersion)
		runtime.EventsEmit(a.ctx, "laravel-output", "WARNING: zip extension is not enabled. Install will use git clone (slower).")
		runtime.EventsEmit(a.ctx, "laravel-output", "Tip: enable zip in the PHP Extensions panel for faster installs.")
	}

	cmd := winexec.Command(phpExe, phar, "create-project", "laravel/laravel", ".", "--no-interaction", "--no-ansi")
	cmd.Dir = projectDir

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		runtime.EventsEmit(a.ctx, "laravel-done", false)
		return false
	}
	stderr, err := cmd.StderrPipe()
	if err != nil {
		runtime.EventsEmit(a.ctx, "laravel-done", false)
		return false
	}

	if err := cmd.Start(); err != nil {
		runtime.EventsEmit(a.ctx, "laravel-done", false)
		return false
	}

	var wg sync.WaitGroup
	wg.Add(2)
	go func() {
		defer wg.Done()
		scanner := bufio.NewScanner(stdout)
		for scanner.Scan() {
			runtime.EventsEmit(a.ctx, "laravel-output", scanner.Text())
		}
	}()
	go func() {
		defer wg.Done()
		scanner := bufio.NewScanner(stderr)
		for scanner.Scan() {
			runtime.EventsEmit(a.ctx, "laravel-output", scanner.Text())
		}
	}()

	err = cmd.Wait()
	wg.Wait()
	if err != nil {
		applog.Errorf("Laravel: composer create-project failed for %s: %s", domain, err.Error())
	} else {
		applog.Infof("Laravel: project created successfully for %s", domain)
	}
	runtime.EventsEmit(a.ctx, "laravel-done", err == nil)
	return err == nil
}
