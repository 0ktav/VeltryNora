package system

import (
	"fmt"
	"math"
	"net/http"
	"nginxpanel/internal/config"
	"nginxpanel/internal/winexec"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/disk"
	"github.com/shirou/gopsutil/v3/host"
	"github.com/shirou/gopsutil/v3/mem"
)

func exeDir() string {
	exe, _ := os.Executable()
	return filepath.Dir(exe)
}

type SystemStats struct {
	CPU         float64 `json:"cpu"`
	RAMUsed     float64 `json:"ram_used"`
	RAMTotal    float64 `json:"ram_total"`
	RAMPercent  float64 `json:"ram_percent"`
	DiskUsed    float64 `json:"disk_used"`
	DiskTotal   float64 `json:"disk_total"`
	DiskPercent float64 `json:"disk_percent"`
	DiskDrive   string  `json:"disk_drive"`
	Uptime      string  `json:"uptime"`
}

type ServiceStatus struct {
	Name    string `json:"name"`
	Version string `json:"version"`
	Running bool   `json:"running"`
	Port    int    `json:"port"`
	Type    string `json:"type"`
}

type phpVersion struct {
	Version string
	Port    int
}

func GetStats() (SystemStats, error) {
	stats := SystemStats{}

	// CPU
	cpuPercent, err := cpu.Percent(time.Second, false)
	if err == nil && len(cpuPercent) > 0 {
		stats.CPU = math.Round(cpuPercent[0]*10) / 10
	}

	// RAM
	memInfo, err := mem.VirtualMemory()
	if err == nil {
		stats.RAMUsed = math.Round(float64(memInfo.Used)/1024/1024/1024*10) / 10
		stats.RAMTotal = math.Round(float64(memInfo.Total)/1024/1024/1024*10) / 10
		stats.RAMPercent = math.Round(memInfo.UsedPercent*10) / 10
	}

	// Disk — use the drive where the app is installed
	appDrive := filepath.VolumeName(GetBasePath()) + "\\"
	diskInfo, err := disk.Usage(appDrive)
	if err == nil {
		stats.DiskUsed = math.Round(float64(diskInfo.Used)/1024/1024/1024*10) / 10
		stats.DiskTotal = math.Round(float64(diskInfo.Total)/1024/1024/1024*10) / 10
		stats.DiskPercent = math.Round(diskInfo.UsedPercent*10) / 10
		stats.DiskDrive = filepath.VolumeName(GetBasePath())
	}

	// Uptime
	uptime, err := host.Uptime()
	if err == nil {
		stats.Uptime = formatUptime(uptime)
	}

	return stats, nil
}

func formatUptime(seconds uint64) string {
	days := seconds / 86400
	hours := (seconds % 86400) / 3600
	minutes := (seconds % 3600) / 60

	if days > 0 {
		return fmt.Sprintf("%dd %dh %dm", days, hours, minutes)
	}
	return fmt.Sprintf("%dh %dm", hours, minutes)
}

func IsWingetAvailable() bool {
	cmd := winexec.Command("winget", "--version")
	err := cmd.Run()
	return err == nil
}

func GetServicesStatus() []ServiceStatus {
	services := []ServiceStatus{
		{
			Name:    "Nginx",
			Version: "",
			Running: isProcessRunning("nginx.exe"),
			Type:    "single",
		},
		{
			Name:    "Redis",
			Version: "",
			Running: isProcessRunning("redis-server.exe"),
			Type:    "single",
		},
		{
			Name:    "MySQL",
			Version: "",
			Running: IsPortInUse(config.MySQLPort),
			Type:    "single",
		},
	}

	phpVersions := getInstalledPHPVersions()
	for _, v := range phpVersions {
		services = append(services, ServiceStatus{
			Name:    "PHP " + v.Version,
			Version: v.Version,
			Running: IsPortInUse(v.Port),
			Port:    v.Port,
			Type:    "php",
		})
	}

	return services
}

func isProcessRunning(name string) bool {
	cmd := winexec.Command("tasklist", "/FI", "IMAGENAME eq "+name, "/NH")
	out, err := cmd.Output()
	if err != nil {
		return false
	}
	return strings.Contains(string(out), name)
}

func IsOnline() bool {
	client := &http.Client{
		Timeout: 3 * time.Second,
	}
	_, err := client.Get(config.DNSCheckURL)
	return err == nil
}

func getInstalledPHPVersions() []phpVersion {
	basePath := GetBasePath()
	phpPath := filepath.Join(basePath, config.PHPFolder)

	entries, err := os.ReadDir(phpPath)
	if err != nil {
		return []phpVersion{}
	}

	versions := []phpVersion{}
	for _, entry := range entries {
		if entry.IsDir() {
			versions = append(versions, phpVersion{
				Version: entry.Name(),
				Port:    phpVersionToPort(entry.Name()),
			})
		}
	}
	return versions
}

func phpVersionToPort(version string) int {
	parts := strings.Split(version, ".")
	if len(parts) >= 2 {
		major, _ := strconv.Atoi(parts[0])
		minor, _ := strconv.Atoi(parts[1])
		return 9000 + major*10 + minor
	}
	return 9000
}

func GetBasePath() string {
	s := config.LoadSettings()
	if s.BasePath != "" {
		return s.BasePath
	}
	return exeDir()
}

func GetDefaultBasePath() string {
	return exeDir()
}

func IsProcessRunning(name string) bool {
	return isProcessRunning(name)
}

func ReadLastLines(path string, n int) []string {
	data, err := os.ReadFile(path)
	if err != nil {
		return []string{}
	}
	content := strings.TrimRight(string(data), "\r\n")
	if content == "" {
		return []string{}
	}
	lines := strings.Split(content, "\n")
	if len(lines) <= n {
		return lines
	}
	return lines[len(lines)-n:]
}

func IsPortInUse(port int) bool {
	cmd := winexec.Command("netstat", "-ano")
	out, err := cmd.Output()
	if err != nil {
		return false
	}
	target := fmt.Sprintf(":%d ", port)
	for _, line := range strings.Split(string(out), "\n") {
		if strings.Contains(line, target) && strings.Contains(line, "LISTENING") {
			return true
		}
	}
	return false
}
