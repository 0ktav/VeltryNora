package nginx

import (
	"bytes"
	_ "embed"
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
	"text/template"
)

//go:embed templates/nginx.conf.tmpl
var nginxConfTmpl string

type GitHubTag struct {
	Name string `json:"name"`
}

func GetLatestVersion() (string, error) {
	client := &http.Client{}
	req, err := http.NewRequest("GET", config.NginxGitHubAPI, nil)
	if err != nil {
		return "", err
	}
	req.Header.Set("User-Agent", "nginxpanel-app")

	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var tags []GitHubTag
	json.NewDecoder(resp.Body).Decode(&tags)

	for _, tag := range tags {
		if strings.HasPrefix(tag.Name, "release-") {
			version := strings.TrimPrefix(tag.Name, "release-")
			return version, nil
		}
	}
	return "necunoscut", nil
}

func GetInstalledVersions() []string {
	basePath := system.GetBasePath()
	nginxPath := filepath.Join(basePath, config.NginxFolder)

	entries, err := os.ReadDir(nginxPath)
	if err != nil {
		return []string{}
	}

	versions := []string{}
	for _, entry := range entries {
		if entry.IsDir() {
			versions = append(versions, entry.Name())
		}
	}
	return versions
}

func GetActiveVersion() string {
	basePath := system.GetBasePath()
	activePath := filepath.Join(basePath, config.NginxFolder, "active.txt")

	data, err := os.ReadFile(activePath)
	if err != nil {
		return ""
	}
	return strings.TrimSpace(string(data))
}

func SetActiveVersion(version string) error {
	basePath := system.GetBasePath()
	activePath := filepath.Join(basePath, config.NginxFolder, "active.txt")

	err := os.MkdirAll(filepath.Dir(activePath), 0755)
	if err != nil {
		return err
	}
	return os.WriteFile(activePath, []byte(version), 0644)
}

func GetAvailableVersions() []string {
	client := &http.Client{}
	req, err := http.NewRequest("GET", config.NginxGitHubAPI+"?per_page=20", nil)
	if err != nil {
		return []string{}
	}
	req.Header.Set("User-Agent", "nginxpanel-app")

	resp, err := client.Do(req)
	if err != nil {
		return []string{}
	}
	defer resp.Body.Close()

	var tags []GitHubTag
	json.NewDecoder(resp.Body).Decode(&tags)

	versions := []string{}
	for _, tag := range tags {
		if strings.HasPrefix(tag.Name, "release-") {
			version := strings.TrimPrefix(tag.Name, "release-")
			versions = append(versions, version)
		}
	}
	return versions
}

func IsRunning() bool {
	return system.IsProcessRunning("nginx.exe")
}

func Download(version string, onProgress func(int)) error {
	url := fmt.Sprintf("%s/nginx-%s.zip", config.NginxDownloadURL, version)
	basePath := system.GetBasePath()
	zipPath := filepath.Join(basePath, config.DownloadsFolder, "nginx-"+version+".zip")
	destDir := filepath.Join(basePath, config.NginxFolder, version)

	err := utils.Download(url, zipPath, onProgress)
	if err != nil {
		return err
	}

	return utils.Unzip(zipPath, destDir, "nginx-"+version)
}

func DeleteVersion(version string) error {
	basePath := system.GetBasePath()
	return os.RemoveAll(filepath.Join(basePath, config.NginxFolder, version))
}

func Start(basePath string) error {
	if err := ensureConfig(basePath); err != nil {
		return fmt.Errorf("config error: %w", err)
	}

	activeVersion := GetActiveVersion()
	exePath := filepath.Join(basePath, config.NginxFolder, activeVersion, "nginx.exe")
	configPath := filepath.Join(basePath, config.ConfigFolder, "nginx.conf")
	workDir := filepath.Join(basePath, config.NginxFolder, activeVersion)

	// test config before starting
	testCmd := winexec.Command(exePath, "-t", "-c", configPath)
	testCmd.Dir = workDir
	if out, err := testCmd.CombinedOutput(); err != nil {
		return fmt.Errorf("nginx config test failed: %s", strings.TrimSpace(string(out)))
	}

	cmd := winexec.Command(exePath, "-c", configPath)
	cmd.Dir = workDir
	return cmd.Start()
}

func Stop() error {
	winexec.Command("taskkill", "/F", "/IM", "nginx.exe").Run()
	return nil
}

func Restart(basePath string) error {
	Stop()
	return Start(basePath)
}

func ensureConfig(basePath string) error {
	configDir := filepath.Join(basePath, config.ConfigFolder, config.SitesFolder)
	os.MkdirAll(configDir, 0755)
	os.MkdirAll(filepath.Join(basePath, config.LogsFolder), 0755)
	os.MkdirAll(filepath.Join(basePath, config.LogsFolder, config.SiteLogsFolder), 0755)

	// nginx on Windows fails with "include *.conf" when no .conf files exist in the dir.
	// Create a placeholder so the glob always matches at least one file.
	entries, _ := os.ReadDir(configDir)
	hasConf := false
	for _, e := range entries {
		if !e.IsDir() && strings.HasSuffix(e.Name(), ".conf") {
			hasConf = true
			break
		}
	}
	if !hasConf {
		placeholder := filepath.Join(configDir, "_placeholder.conf")
		os.WriteFile(placeholder, []byte("# placeholder\n"), 0644)
	}

	configPath := filepath.Join(basePath, config.ConfigFolder, "nginx.conf")

	activeVersion := GetActiveVersion()
	copyFile(
		filepath.Join(basePath, config.NginxFolder, activeVersion, "conf", "mime.types"),
		filepath.Join(basePath, config.ConfigFolder, "mime.types"),
	)
	copyFile(
		filepath.Join(basePath, config.NginxFolder, activeVersion, "conf", "fastcgi_params"),
		filepath.Join(basePath, config.ConfigFolder, "fastcgi_params"),
	)

	s := config.LoadSettings()
	workers := "auto"
	if s.NginxWorkers > 0 {
		workers = fmt.Sprintf("%d", s.NginxWorkers)
	}
	keepalive := s.NginxKeepalive
	if keepalive <= 0 {
		keepalive = 65
	}

	tmpl, _ := template.New("nginx").Parse(nginxConfTmpl)
	var buf bytes.Buffer
	tmpl.Execute(&buf, map[string]interface{}{
		"Workers":   workers,
		"Keepalive": keepalive,
		"ErrorLog":  filepath.ToSlash(filepath.Join(basePath, config.LogsFolder, "error.log")),
		"AccessLog": filepath.ToSlash(filepath.Join(basePath, config.LogsFolder, "access.log")),
		"MimesPath": filepath.ToSlash(filepath.Join(basePath, config.ConfigFolder, "mime.types")),
		"SitesPath": filepath.ToSlash(filepath.Join(basePath, config.ConfigFolder, config.SitesFolder, "*.conf")),
	})

	return os.WriteFile(configPath, buf.Bytes(), 0644)
}

func copyFile(src, dst string) error {
	data, err := os.ReadFile(src)
	if err != nil {
		return err
	}
	return os.WriteFile(dst, data, 0644)
}
