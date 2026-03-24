package mysql

import (
	"archive/zip"
	"fmt"
	"nginxpanel/internal/config"
	"nginxpanel/internal/system"
	"nginxpanel/internal/utils"
	"nginxpanel/internal/winexec"
	"os"
	"path/filepath"
	"strings"
)

// SupportedVersions is the hardcoded list of available MySQL versions.
var SupportedVersions = []string{"9.2.0", "8.4.4", "8.0.40"}

func GetAvailableVersions() []string {
	return SupportedVersions
}

func GetInstalledVersions() []string {
	basePath := system.GetBasePath()
	mysqlPath := filepath.Join(basePath, config.MySQLFolder)

	entries, err := os.ReadDir(mysqlPath)
	if err != nil {
		return []string{}
	}

	versions := []string{}
	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}
		// Accept version if mysqld.exe exists directly or one level deep (strip prefix variance)
		if findMysqld(filepath.Join(mysqlPath, entry.Name())) {
			versions = append(versions, entry.Name())
		}
	}
	return versions
}

func GetActiveVersion() string {
	basePath := system.GetBasePath()
	activePath := filepath.Join(basePath, config.MySQLFolder, "active.txt")
	data, err := os.ReadFile(activePath)
	if err != nil {
		return ""
	}
	return strings.TrimSpace(string(data))
}

func SetActiveVersion(version string) error {
	basePath := system.GetBasePath()
	activePath := filepath.Join(basePath, config.MySQLFolder, "active.txt")
	return os.WriteFile(activePath, []byte(version), 0644)
}

func IsRunning() bool {
	return system.IsProcessRunning("mysqld.exe")
}

// findMysqld returns true if mysqld.exe exists directly under dir/bin/ or one level deeper.
func findMysqld(dir string) bool {
	if _, err := os.Stat(filepath.Join(dir, "bin", "mysqld.exe")); err == nil {
		return true
	}
	// Fallback: one level deeper (e.g. dir/mysql-x.y.z-winx64/bin/mysqld.exe)
	entries, err := os.ReadDir(dir)
	if err != nil {
		return false
	}
	for _, e := range entries {
		if e.IsDir() {
			if _, err := os.Stat(filepath.Join(dir, e.Name(), "bin", "mysqld.exe")); err == nil {
				return true
			}
		}
	}
	return false
}

// majorMinor extracts "X.Y" from "X.Y.Z".
func majorMinor(version string) string {
	parts := strings.SplitN(version, ".", 3)
	if len(parts) >= 2 {
		return parts[0] + "." + parts[1]
	}
	return version
}

func downloadURL(version string) string {
	mm := majorMinor(version)
	// MySQL 8.x is only available via the archives download server
	if strings.HasPrefix(mm, "8.") {
		return fmt.Sprintf("%s/mysql-%s-winx64.zip", config.MySQLArchiveDownloadBaseURL, version)
	}
	return fmt.Sprintf("%s/MySQL-%s/mysql-%s-winx64.zip", config.MySQLDownloadBaseURL, mm, version)
}

func versionDir(version string) string {
	return filepath.Join(system.GetBasePath(), config.MySQLFolder, version)
}

func iniPath(version string) string {
	return filepath.Join(versionDir(version), "my.ini")
}

// zipTopDir returns the single top-level directory name inside a zip file.
// MySQL zips always contain one root folder (e.g. "mysql-9.2.0-winx64").
func zipTopDir(zipPath string) string {
	r, err := zip.OpenReader(zipPath)
	if err != nil {
		return ""
	}
	defer r.Close()
	for _, f := range r.File {
		parts := strings.SplitN(f.Name, "/", 2)
		if len(parts) >= 1 && parts[0] != "" {
			return parts[0]
		}
	}
	return ""
}

// Install downloads, extracts and initializes MySQL for the given version.
// onProgress is called with 0–100 during the full process.
func Install(version string, onProgress func(percent int, totalMB float64)) error {
	basePath := system.GetBasePath()
	zipPath := filepath.Join(basePath, config.DownloadsFolder, "mysql-"+version+".zip")
	destDir := versionDir(version)

	os.MkdirAll(filepath.Join(basePath, config.MySQLFolder), 0755)

	// Download (0–80%)
	err := utils.Download(downloadURL(version), zipPath, 0, func(p int, mb float64) {
		onProgress(p*80/100, mb)
	})
	if err != nil {
		return fmt.Errorf("download failed: %w", err)
	}
	onProgress(80, 0)

	// Auto-detect top-level directory name in zip and strip it
	stripPrefix := zipTopDir(zipPath)
	if err := utils.Unzip(zipPath, destDir, stripPrefix); err != nil {
		return fmt.Errorf("extract failed: %w", err)
	}
	onProgress(85, 0)

	// Create my.ini using forward slashes (required by MySQL on Windows)
	dataDir := filepath.Join(destDir, "data")
	logFile := filepath.ToSlash(filepath.Join(dataDir, "mysqld.log"))
	ini := "[mysqld]\n" +
		"basedir=" + filepath.ToSlash(destDir) + "\n" +
		"datadir=" + filepath.ToSlash(dataDir) + "\n" +
		"port=" + fmt.Sprintf("%d", config.MySQLPort) + "\n" +
		"log-error=" + logFile + "\n"
	if err := os.WriteFile(iniPath(version), []byte(ini), 0644); err != nil {
		return fmt.Errorf("my.ini write failed: %w", err)
	}
	onProgress(88, 0)

	// Initialize data directory — use forward slashes for --defaults-file on Windows
	mysqld := filepath.Join(destDir, "bin", "mysqld.exe")
	iniSlash := filepath.ToSlash(iniPath(version))
	cmd := winexec.Command(mysqld, "--defaults-file="+iniSlash, "--initialize-insecure")
	cmd.Dir = destDir
	if err := cmd.Run(); err != nil {
		os.RemoveAll(destDir) // clean up on init failure
		return fmt.Errorf("mysqld --initialize-insecure failed: %w", err)
	}
	onProgress(100, 0)

	return nil
}

func Start(version string) error {
	dir := versionDir(version)
	mysqld := filepath.Join(dir, "bin", "mysqld.exe")
	iniSlash := filepath.ToSlash(iniPath(version))
	cmd := winexec.Command(mysqld, "--defaults-file="+iniSlash)
	cmd.Dir = dir
	return cmd.Start()
}

func Stop(version string) error {
	dir := versionDir(version)
	admin := filepath.Join(dir, "bin", "mysqladmin.exe")
	err := winexec.Command(admin, "-u", "root", "--protocol=TCP", "shutdown").Run()
	if err != nil {
		// Fallback: force kill
		winexec.Command("taskkill", "/F", "/IM", "mysqld.exe").Run()
	}
	return nil
}

func Restart(version string) error {
	Stop(version)
	return Start(version)
}

func DeleteVersion(version string) error {
	if err := os.RemoveAll(versionDir(version)); err != nil {
		return err
	}
	// Clear active.txt if it points to the deleted version
	if GetActiveVersion() == version {
		basePath := system.GetBasePath()
		os.Remove(filepath.Join(basePath, config.MySQLFolder, "active.txt"))
	}
	return nil
}

// LogPath returns the path to the MySQL error log for the given version.
func LogPath(version string) string {
	return filepath.Join(versionDir(version), "data", "mysqld.log")
}
