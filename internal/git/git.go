package git

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

func gitDir() string {
	return filepath.Join(system.GetBasePath(), config.ToolsFolder, config.GitFolder)
}

func gitExe() string {
	return filepath.Join(gitDir(), "cmd", "git.exe")
}

// GetVersion returns the installed git version string, or "" if not installed.
// Checks the app-managed binary first, then falls back to the system PATH.
func GetVersion() string {
	exe := gitExe()
	if _, err := os.Stat(exe); err == nil {
		out, err := winexec.Command(exe, "--version").Output()
		if err == nil {
			return parseVersion(string(out))
		}
	}

	// Fallback: check system PATH
	out, err := winexec.Command("where", "git").Output()
	if err != nil || strings.TrimSpace(string(out)) == "" {
		return ""
	}
	out, err = winexec.Command("git", "--version").Output()
	if err != nil {
		return ""
	}
	return parseVersion(string(out)) + " (system)"
}

func parseVersion(out string) string {
	s := strings.TrimSpace(out)
	s = strings.TrimPrefix(s, "git version ")
	if idx := strings.Index(s, ".windows"); idx >= 0 {
		s = s[:idx]
	}
	return s
}

type githubAsset struct {
	Name               string `json:"name"`
	BrowserDownloadURL string `json:"browser_download_url"`
}

type githubRelease struct {
	TagName string        `json:"tag_name"`
	Assets  []githubAsset `json:"assets"`
}

// getLatestRelease fetches the latest MinGit zip URL and version from GitHub API.
func getLatestRelease() (downloadURL, version string, err error) {
	req, _ := http.NewRequest("GET", config.GitLatestReleaseURL, nil)
	req.Header.Set("User-Agent", config.AppName)
	req.Header.Set("Accept", "application/vnd.github.v3+json")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return "", "", fmt.Errorf("GitHub API returned HTTP %d", resp.StatusCode)
	}

	var rel githubRelease
	if err := json.NewDecoder(resp.Body).Decode(&rel); err != nil {
		return "", "", err
	}

	if rel.TagName == "" {
		return "", "", fmt.Errorf("GitHub API returned empty tag_name (possible rate limit)")
	}

	// Find the MinGit 64-bit zip asset (exclude busybox variant)
	for _, asset := range rel.Assets {
		if strings.HasPrefix(asset.Name, "MinGit-") &&
			strings.Contains(asset.Name, "64-bit") &&
			strings.HasSuffix(asset.Name, ".zip") &&
			!strings.Contains(asset.Name, "busybox") {
			// Parse version from tag: "v2.53.0.windows.2" → "2.53.0"
			v := strings.TrimPrefix(rel.TagName, "v")
			if idx := strings.Index(v, ".windows"); idx >= 0 {
				v = v[:idx]
			}
			return asset.BrowserDownloadURL, v, nil
		}
	}

	return "", "", fmt.Errorf("MinGit 64-bit zip not found in release assets for %s", rel.TagName)
}

// Download fetches the latest MinGit release and extracts it to {basePath}/git/.
// If addToSystemPath is true, the git/cmd directory is appended to the machine PATH.
func Download(addToSystemPath bool, onProgress func(int)) error {
	downloadURL, _, err := getLatestRelease()
	if err != nil {
		return fmt.Errorf("failed to fetch latest git release: %w", err)
	}

	destDir := gitDir()
	os.RemoveAll(destDir)

	zipPath := filepath.Join(system.GetBasePath(), config.DownloadsFolder, "git.zip")
	if err := utils.Download(downloadURL, zipPath, onProgress); err != nil {
		return err
	}

	// MinGit zip has no top-level directory wrapper — extract directly into gitDir
	if err := utils.Unzip(zipPath, destDir, ""); err != nil {
		return err
	}

	if addToSystemPath {
		addToPath(filepath.Join(destDir, "cmd"))
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
