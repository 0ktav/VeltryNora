package php

import (
	"fmt"
	"io"
	"net/http"
	"nginxpanel/internal/config"
	"nginxpanel/internal/system"
	"nginxpanel/internal/utils"
	"nginxpanel/internal/winexec"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"syscall"
)

func GetLatestVersion() (string, error) {
	versions := GetAvailableVersions()
	if len(versions) == 0 {
		return "necunoscut", nil
	}
	return versions[0], nil
}

func GetInstalledVersions() []string {
	basePath := system.GetBasePath()
	phpPath := filepath.Join(basePath, config.PHPFolder)

	entries, err := os.ReadDir(phpPath)
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

func GetAvailableVersions() []string {
	resp, err := http.Get(config.PHPReleasesListURL)
	if err != nil {
		return []string{}
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	re := regexp.MustCompile(`php-(\d+\.\d+\.\d+)-nts-Win32`)
	matches := re.FindAllStringSubmatch(string(body), -1)

	versions := []string{}
	seen := map[string]bool{}
	for _, m := range matches {
		v := m[1]
		if !seen[v] {
			seen[v] = true
			versions = append(versions, v)
		}
	}

	sort.Slice(versions, func(i, j int) bool {
		return versions[i] > versions[j]
	})
	return latestPerMinor(versions)
}

func IsRunning(version string) bool {
	port := VersionToPort(version)
	return system.IsPortInUse(port)
}

func GetArchivedVersions() []string {
	resp, err := http.Get(config.PHPArchivesListURL)
	if err != nil {
		return []string{}
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	re := regexp.MustCompile(`php-(\d+\.\d+\.\d+)-nts-Win32`)
	matches := re.FindAllStringSubmatch(string(body), -1)

	installed := GetInstalledVersions()
	installedMinors := map[string]bool{}
	for _, v := range installed {
		p := strings.Split(v, ".")
		if len(p) >= 2 {
			installedMinors[p[0]+"."+p[1]] = true
		}
	}

	seen := map[string]bool{}
	versions := []string{}
	for _, m := range matches {
		v := m[1]
		p := strings.Split(v, ".")
		minor := ""
		if len(p) >= 2 {
			minor = p[0] + "." + p[1]
		}
		if !seen[v] && !installedMinors[minor] {
			seen[v] = true
			versions = append(versions, v)
		}
	}

	return latestPerMinor(versions)
}

func compilerForVersion(major, minor int) string {
	switch {
	case major > 8 || (major == 8 && minor >= 4):
		return config.PHPCompilerVS17
	case major == 8:
		return config.PHPCompilerVS16
	case major == 7 && minor >= 2:
		return config.PHPVC15
	case major == 7:
		return config.PHPVC14
	case major == 5 && minor >= 5:
		return config.PHPVC11
	default:
		return config.PHPVC9
	}
}

func latestPerMinor(versions []string) []string {
	type semver struct{ major, minor, patch int }
	parse := func(v string) semver {
		p := strings.Split(v, ".")
		if len(p) < 3 {
			return semver{}
		}
		maj, _ := strconv.Atoi(p[0])
		min, _ := strconv.Atoi(p[1])
		pat, _ := strconv.Atoi(p[2])
		return semver{maj, min, pat}
	}

	best := map[string]semver{}
	for _, v := range versions {
		sv := parse(v)
		key := fmt.Sprintf("%d.%d", sv.major, sv.minor)
		if ex, ok := best[key]; !ok || sv.patch > ex.patch {
			best[key] = sv
		}
	}

	result := []string{}
	for _, sv := range best {
		result = append(result, fmt.Sprintf("%d.%d.%d", sv.major, sv.minor, sv.patch))
	}
	sort.Slice(result, func(i, j int) bool {
		return result[i] > result[j]
	})
	return result
}

func resolveDownloadURL(version string) (string, error) {
	parts := strings.Split(version, ".")
	major, minor := 0, 0
	if len(parts) >= 2 {
		major, _ = strconv.Atoi(parts[0])
		minor, _ = strconv.Atoi(parts[1])
	}
	compiler := compilerForVersion(major, minor)

	candidates := []string{
		fmt.Sprintf("%s/php-%s-nts-Win32-%s-x64.zip", config.PHPDownloadURL, version, compiler),
		fmt.Sprintf("%s/php-%s-nts-Win32-%s-x64.zip", config.PHPArchivesDownloadURL, version, compiler),
		fmt.Sprintf("%s/php-%s-nts-Win32-%s-x86.zip", config.PHPDownloadURL, version, compiler),
		fmt.Sprintf("%s/php-%s-nts-Win32-%s-x86.zip", config.PHPArchivesDownloadURL, version, compiler),
	}

	for _, url := range candidates {
		resp, err := http.Head(url)
		if err == nil && resp.StatusCode == 200 {
			return url, nil
		}
	}

	return "", fmt.Errorf("no download found for PHP %s", version)
}

func Download(version string, onProgress func(int)) error {
	downloadURL, err := resolveDownloadURL(version)
	if err != nil {
		return err
	}
	basePath := system.GetBasePath()
	zipPath := filepath.Join(basePath, config.DownloadsFolder, "php-"+version+".zip")
	destDir := filepath.Join(basePath, config.PHPFolder, version)

	os.MkdirAll(filepath.Join(basePath, config.PHPFolder), 0755)

	err = utils.Download(downloadURL, zipPath, onProgress)
	if err != nil {
		return err
	}

	return utils.Unzip(zipPath, destDir, "")
}

func VersionToPort(version string) int {
	parts := strings.Split(version, ".")
	if len(parts) >= 2 {
		major, _ := strconv.Atoi(parts[0])
		minor, _ := strconv.Atoi(parts[1])
		return 9000 + major*10 + minor
	}
	return 9000
}

func DeleteVersion(version string, basePath string) error {
	return os.RemoveAll(filepath.Join(basePath, config.PHPFolder, version))
}

func iniPath(basePath, version string) string {
	return filepath.Join(basePath, config.PHPFolder, version, "php.ini")
}

func resolveIni(basePath, version string) string {
	p := iniPath(basePath, version)
	if _, err := os.Stat(p); err == nil {
		return p
	}
	return filepath.Join(basePath, config.PHPFolder, version, "php.ini-production")
}

func Start(version string) error {
	basePath := system.GetBasePath()
	port := VersionToPort(version)
	exePath := filepath.Join(basePath, config.PHPFolder, version, "php-cgi.exe")

	logPath := filepath.Join(basePath, config.PHPFolder, version, "php.log")
	logFile, _ := os.OpenFile(logPath, os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0644)

	cmd := winexec.Command(exePath,
		"-b", fmt.Sprintf("127.0.0.1:%d", port),
		"-c", resolveIni(basePath, version),
	)
	cmd.Dir = filepath.Join(basePath, config.PHPFolder, version)
	if logFile != nil {
		cmd.Stderr = logFile
		cmd.Stdout = logFile
	}
	cmd.SysProcAttr = &syscall.SysProcAttr{
		HideWindow:    true,
		CreationFlags: syscall.CREATE_NEW_PROCESS_GROUP,
	}
	return cmd.Start()
}

// ── PHP Config ────────────────────────────────────────────────────────────────

type PHPConfig struct {
	MemoryLimit       string `json:"memory_limit"`
	PostMaxSize       string `json:"post_max_size"`
	UploadMaxFilesize string `json:"upload_max_filesize"`
	MaxExecutionTime  string `json:"max_execution_time"`
	DisplayErrors     bool   `json:"display_errors"`
}

func GetConfig(version string) PHPConfig {
	basePath := system.GetBasePath()
	cfg := PHPConfig{
		MemoryLimit:       "128M",
		PostMaxSize:       "8M",
		UploadMaxFilesize: "2M",
		MaxExecutionTime:  "30",
		DisplayErrors:     false,
	}

	data, err := os.ReadFile(resolveIni(basePath, version))
	if err != nil {
		return cfg
	}

	for _, line := range strings.Split(string(data), "\n") {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, ";") {
			continue
		}
		if v, ok := iniGet(line, "memory_limit"); ok {
			cfg.MemoryLimit = v
		} else if v, ok := iniGet(line, "post_max_size"); ok {
			cfg.PostMaxSize = v
		} else if v, ok := iniGet(line, "upload_max_filesize"); ok {
			cfg.UploadMaxFilesize = v
		} else if v, ok := iniGet(line, "max_execution_time"); ok {
			cfg.MaxExecutionTime = v
		} else if v, ok := iniGet(line, "display_errors"); ok {
			cfg.DisplayErrors = strings.EqualFold(v, "on") || v == "1"
		}
	}
	return cfg
}

func SaveConfig(version string, cfg PHPConfig) error {
	basePath := system.GetBasePath()
	dst := iniPath(basePath, version)

	// Copy php.ini-production → php.ini on first save
	if _, err := os.Stat(dst); os.IsNotExist(err) {
		src := filepath.Join(basePath, config.PHPFolder, version, "php.ini-production")
		data, err := os.ReadFile(src)
		if err != nil {
			data = []byte("")
		}
		if err := os.WriteFile(dst, data, 0644); err != nil {
			return err
		}
	}
	ensureExtensionDir(basePath, version)

	data, err := os.ReadFile(dst)
	if err != nil {
		return err
	}

	displayErrors := "Off"
	if cfg.DisplayErrors {
		displayErrors = "On"
	}

	content := string(data)
	content = iniSet(content, "memory_limit", cfg.MemoryLimit)
	content = iniSet(content, "post_max_size", cfg.PostMaxSize)
	content = iniSet(content, "upload_max_filesize", cfg.UploadMaxFilesize)
	content = iniSet(content, "max_execution_time", cfg.MaxExecutionTime)
	content = iniSet(content, "display_errors", displayErrors)

	return os.WriteFile(dst, []byte(content), 0644)
}

type PHPExtension struct {
	Name    string `json:"name"`
	Enabled bool   `json:"enabled"`
}

func ensureExtensionDir(basePath, version string) {
	dst := iniPath(basePath, version)
	data, err := os.ReadFile(dst)
	if err != nil {
		return
	}
	extDir := filepath.ToSlash(filepath.Join(basePath, config.PHPFolder, version, "ext"))
	content := iniSet(string(data), "extension_dir", `"`+extDir+`"`)
	os.WriteFile(dst, []byte(content), 0644)
}

func GetExtensions(version string) []PHPExtension {
	basePath := system.GetBasePath()
	extDir := filepath.Join(basePath, config.PHPFolder, version, "ext")

	entries, err := os.ReadDir(extDir)
	if err != nil {
		return []PHPExtension{}
	}

	// Collect available extensions from .dll files
	available := []string{}
	for _, e := range entries {
		name := e.Name()
		if strings.HasPrefix(name, "php_") && strings.HasSuffix(name, ".dll") {
			extName := strings.TrimSuffix(strings.TrimPrefix(name, "php_"), ".dll")
			available = append(available, extName)
		}
	}
	sort.Strings(available)

	// Check which are enabled in php.ini
	enabled := map[string]bool{}
	data, err := os.ReadFile(resolveIni(basePath, version))
	if err == nil {
		for _, line := range strings.Split(string(data), "\n") {
			trimmed := strings.TrimSpace(line)
			if strings.HasPrefix(trimmed, ";") {
				continue
			}
			if strings.HasPrefix(trimmed, "extension=") {
				name := strings.TrimPrefix(trimmed, "extension=")
				name = strings.TrimSuffix(name, ".dll")
				name = strings.TrimPrefix(name, "php_")
				name = strings.TrimSpace(name)
				enabled[name] = true
			}
		}
	}

	result := make([]PHPExtension, len(available))
	for i, name := range available {
		result[i] = PHPExtension{Name: name, Enabled: enabled[name]}
	}
	return result
}

func SaveExtensions(version string, enabledNames []string) error {
	basePath := system.GetBasePath()
	dst := iniPath(basePath, version)

	// Copy php.ini-production → php.ini on first save
	if _, err := os.Stat(dst); os.IsNotExist(err) {
		src := filepath.Join(basePath, config.PHPFolder, version, "php.ini-production")
		data, err := os.ReadFile(src)
		if err != nil {
			data = []byte("")
		}
		os.WriteFile(dst, data, 0644)
	}
	ensureExtensionDir(basePath, version)

	data, err := os.ReadFile(dst)
	if err != nil {
		return err
	}

	enabledSet := map[string]bool{}
	for _, n := range enabledNames {
		enabledSet[n] = true
	}

	lines := strings.Split(string(data), "\n")

	// Track which extensions we've already handled to avoid duplicates
	handled := map[string]bool{}

	for i, line := range lines {
		trimmed := strings.TrimSpace(line)
		isCommented := strings.HasPrefix(trimmed, ";")
		raw := strings.TrimSpace(strings.TrimLeft(trimmed, ";"))

		if !strings.HasPrefix(raw, "extension=") {
			continue
		}

		name := strings.TrimPrefix(raw, "extension=")
		name = strings.TrimSuffix(name, ".dll")
		name = strings.TrimPrefix(name, "php_")
		name = strings.TrimSpace(name)

		if handled[name] {
			// Remove duplicate extension lines
			lines[i] = ""
			continue
		}
		handled[name] = true

		if enabledSet[name] {
			lines[i] = "extension=php_" + name + ".dll"
		} else {
			if !isCommented {
				lines[i] = ";" + line
			}
		}
	}

	// Append any enabled extensions not already present
	for _, name := range enabledNames {
		if !handled[name] {
			lines = append(lines, "extension=php_"+name+".dll")
		}
	}

	return os.WriteFile(dst, []byte(strings.Join(lines, "\n")), 0644)
}

func GetIniPath(version string) string {
	return resolveIni(system.GetBasePath(), version)
}

func GetIni(version string) string {
	basePath := system.GetBasePath()
	data, err := os.ReadFile(resolveIni(basePath, version))
	if err != nil {
		return ""
	}
	return string(data)
}

func SaveIni(version string, content string) error {
	basePath := system.GetBasePath()
	dst := iniPath(basePath, version)
	return os.WriteFile(dst, []byte(content), 0644)
}

func iniGet(line, key string) (string, bool) {
	for _, sep := range []string{key + " =", key + "="} {
		if strings.HasPrefix(line, sep) {
			return strings.TrimSpace(strings.TrimPrefix(line, sep)), true
		}
	}
	return "", false
}

func iniSet(content, key, value string) string {
	lines := strings.Split(content, "\n")
	for i, line := range lines {
		trimmed := strings.TrimSpace(line)
		if strings.HasPrefix(trimmed, ";") {
			continue
		}
		if _, ok := iniGet(trimmed, key); ok {
			lines[i] = key + " = " + value
			return strings.Join(lines, "\n")
		}
	}
	// Try to uncomment a commented line
	for i, line := range lines {
		trimmed := strings.TrimSpace(strings.TrimLeft(strings.TrimSpace(line), ";"))
		if _, ok := iniGet(trimmed, key); ok {
			lines[i] = key + " = " + value
			return strings.Join(lines, "\n")
		}
	}
	// Append at end
	return strings.TrimRight(content, "\r\n") + "\n" + key + " = " + value + "\n"
}

func Stop(version string) error {
	port := VersionToPort(version)

	out, err := winexec.Command("netstat", "-ano").Output()
	if err != nil {
		return nil
	}

	lines := strings.Split(string(out), "\n")
	for _, line := range lines {
		if strings.Contains(line, fmt.Sprintf(":%d ", port)) {
			fields := strings.Fields(strings.TrimSpace(line))
			if len(fields) >= 5 {
				pid := strings.TrimSpace(fields[4])
				winexec.Command("taskkill", "/F", "/PID", pid).Run()
			}
		}
	}
	return nil
}
