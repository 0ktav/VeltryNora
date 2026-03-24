package nodejs

import (
	"encoding/json"
	"fmt"
	"net/http"
	"nginxpanel/internal/config"
	"nginxpanel/internal/system"
	"nginxpanel/internal/utils"
	"nginxpanel/internal/winexec"
	"os"
	"path/filepath"
	"strings"
)

func nodeDir() string {
	return filepath.Join(system.GetBasePath(), config.ToolsFolder, config.NodeFolder)
}

func nodeExe() string {
	return filepath.Join(nodeDir(), "node.exe")
}

// GetVersion returns the installed Node.js version, or "" if not installed.
// Checks the app-managed binary first, then falls back to the system PATH.
func GetVersion() string {
	exe := nodeExe()
	if _, err := os.Stat(exe); err == nil {
		out, err := winexec.Command(exe, "--version").Output()
		if err == nil {
			return strings.TrimSpace(string(out))
		}
	}

	// Fallback: check system PATH
	out, err := winexec.Command("where", "node").Output()
	if err != nil || strings.TrimSpace(string(out)) == "" {
		return ""
	}
	out, err = winexec.Command("node", "--version").Output()
	if err != nil {
		return ""
	}
	return strings.TrimSpace(string(out)) + " (system)"
}

type nodeRelease struct {
	Version string      `json:"version"` // "v22.11.0"
	LTS     interface{} `json:"lts"`     // false or LTS codename string
}

// getLatestLTS returns the latest Node.js LTS version without the "v" prefix.
func getLatestLTS() (string, error) {
	resp, err := http.Get(config.NodeReleasesURL)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var releases []nodeRelease
	if err := json.NewDecoder(resp.Body).Decode(&releases); err != nil {
		return "", err
	}

	for _, r := range releases {
		// LTS field is false (bool) for non-LTS, or a codename string for LTS
		if b, ok := r.LTS.(bool); ok && !b {
			continue
		}
		return strings.TrimPrefix(r.Version, "v"), nil
	}
	return "", fmt.Errorf("no LTS release found")
}

// Download fetches the latest Node.js LTS and extracts it to {basePath}/nodejs/.
// If addToSystemPath is true, the nodejs directory is appended to the machine PATH.
func Download(addToSystemPath bool, onProgress func(percent int, totalMB float64)) error {
	version, err := getLatestLTS()
	if err != nil {
		return fmt.Errorf("failed to fetch latest Node.js LTS: %w", err)
	}

	// e.g. https://nodejs.org/dist/v22.11.0/node-v22.11.0-win-x64.zip
	url := fmt.Sprintf("%s/v%s/node-v%s-win-x64.zip", config.NodeDownloadBaseURL, version, version)
	destDir := nodeDir()
	os.RemoveAll(destDir)

	zipPath := filepath.Join(system.GetBasePath(), config.DownloadsFolder, "nodejs.zip")
	if err := utils.Download(url, zipPath, 0, onProgress); err != nil {
		return err
	}

	// Node.js zip has a top-level directory e.g. "node-v22.11.0-win-x64/"
	stripPrefix := fmt.Sprintf("node-v%s-win-x64", version)
	if err := utils.Unzip(zipPath, destDir, stripPrefix); err != nil {
		return err
	}

	if addToSystemPath {
		addToPath(destDir)
	}
	return nil
}

// addToPath adds dir to the system PATH via PowerShell if not already present.
func addToPath(dir string) {
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
