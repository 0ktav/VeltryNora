package redis

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
	"sort"
	"strings"
)

func GetLatestVersion() (string, error) {
	versions := GetAvailableVersions()
	if len(versions) == 0 {
		return "necunoscut", nil
	}
	return versions[0], nil
}

func GetAvailableVersions() []string {
	client := &http.Client{}
	req, err := http.NewRequest("GET", config.RedisGitHubAPI+"?per_page=20", nil)
	if err != nil {
		return []string{}
	}
	req.Header.Set("User-Agent", config.AppName+"/1.0")

	resp, err := client.Do(req)
	if err != nil {
		return []string{}
	}
	defer resp.Body.Close()

	var releases []struct {
		TagName string `json:"tag_name"`
	}
	json.NewDecoder(resp.Body).Decode(&releases)

	versions := []string{}
	for _, r := range releases {
		v := strings.TrimPrefix(r.TagName, "v")
		parts := strings.Split(v, ".")
		if len(parts) == 3 {
			versions = append(versions, v)
		}
	}

	sort.Slice(versions, func(i, j int) bool {
		return versions[i] > versions[j]
	})
	return versions
}

func GetInstalledVersions() []string {
	basePath := system.GetBasePath()
	redisPath := filepath.Join(basePath, config.RedisFolder)

	entries, err := os.ReadDir(redisPath)
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
	activePath := filepath.Join(basePath, config.RedisFolder, "active.txt")
	data, err := os.ReadFile(activePath)
	if err != nil {
		return ""
	}
	return strings.TrimSpace(string(data))
}

func SetActiveVersion(version string) error {
	basePath := system.GetBasePath()
	activePath := filepath.Join(basePath, config.RedisFolder, "active.txt")
	return os.WriteFile(activePath, []byte(version), 0644)
}

func IsRunning() bool {
	return system.IsProcessRunning("redis-server.exe")
}

func Download(version string, onProgress func(percent int, totalMB float64)) error {
	url := fmt.Sprintf("%s/v%s/Redis-x64-%s.zip", config.RedisDownloadURL, version, version)
	basePath := system.GetBasePath()
	zipPath := filepath.Join(basePath, config.DownloadsFolder, "redis-"+version+".zip")
	destDir := filepath.Join(basePath, config.RedisFolder, version)

	os.MkdirAll(filepath.Join(basePath, config.RedisFolder), 0755)

	err := utils.Download(url, zipPath, 0, onProgress)
	if err != nil {
		return err
	}

	return utils.Unzip(zipPath, destDir, "")
}

func Start(version string) error {
	basePath := system.GetBasePath()
	exePath := filepath.Join(basePath, config.RedisFolder, version, "redis-server.exe")
	logPath := filepath.Join(basePath, config.RedisFolder, version, "redis.log")
	cmd := winexec.Command(exePath, "--logfile", logPath, "--loglevel", "notice")
	cmd.Dir = filepath.Join(basePath, config.RedisFolder, version)
	return cmd.Start()
}

func Stop() error {
	winexec.Command("taskkill", "/F", "/IM", "redis-server.exe").Run()
	return nil
}

func Restart(version string) error {
	Stop()
	return Start(version)
}

func DeleteVersion(version string) error {
	basePath := system.GetBasePath()
	return os.RemoveAll(filepath.Join(basePath, config.RedisFolder, version))
}

// ExecCommand runs redis-cli.exe with the given arguments and returns the output.
func ExecCommand(args ...string) (string, error) {
	version := GetActiveVersion()
	basePath := system.GetBasePath()
	cliPath := filepath.Join(basePath, config.RedisFolder, version, "redis-cli.exe")
	out, err := winexec.Command(cliPath, args...).Output()
	return strings.TrimSpace(string(out)), err
}
