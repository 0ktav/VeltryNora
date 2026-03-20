package system

import (
	"fmt"
	"nginxpanel/internal/winexec"
	"strconv"
	"strings"
)

// PortConflict describes a port occupied by a foreign process.
type PortConflict struct {
	Port        int    `json:"port"`
	Service     string `json:"service"`
	PID         int    `json:"pid"`
	ProcessName string `json:"process_name"`
}

// CheckPortConflicts checks all ports used by app services and returns those
// occupied by processes that are not part of the app.
func CheckPortConflicts(ports map[int]string) []PortConflict {
	netstatOut, err := winexec.Command("netstat", "-ano").Output()
	if err != nil {
		return nil
	}

	// Build map: port → PID from netstat output
	portToPID := map[int]int{}
	for _, line := range strings.Split(string(netstatOut), "\n") {
		fields := strings.Fields(line)
		// netstat line: Proto  LocalAddr  ForeignAddr  State  PID
		if len(fields) < 5 {
			continue
		}
		proto := strings.ToUpper(fields[0])
		if proto != "TCP" && proto != "UDP" {
			continue
		}
		// Only LISTENING for TCP
		if proto == "TCP" && fields[3] != "LISTENING" {
			continue
		}

		addr := fields[1]
		pidStr := fields[len(fields)-1]

		// Extract port from address (e.g. "0.0.0.0:80" or "[::]:80")
		idx := strings.LastIndex(addr, ":")
		if idx < 0 {
			continue
		}
		port, err := strconv.Atoi(addr[idx+1:])
		if err != nil {
			continue
		}
		pid, err := strconv.Atoi(strings.TrimSpace(pidStr))
		if err != nil {
			continue
		}
		if _, exists := portToPID[port]; !exists {
			portToPID[port] = pid
		}
	}

	// Build PID → process name map for all PIDs we care about
	pidsNeeded := map[int]bool{}
	for port := range ports {
		if pid, ok := portToPID[port]; ok {
			pidsNeeded[pid] = true
		}
	}
	pidToName := resolvePIDNames(pidsNeeded)

	// App-managed process names to ignore (not conflicts)
	appProcesses := map[string]bool{
		"nginx.exe":        true,
		"redis-server.exe": true,
		"mysqld.exe":       true,
		"php-cgi.exe":      true,
	}

	conflicts := []PortConflict{}
	for port, service := range ports {
		pid, ok := portToPID[port]
		if !ok {
			continue
		}
		name := pidToName[pid]
		if appProcesses[strings.ToLower(name)] {
			continue
		}
		conflicts = append(conflicts, PortConflict{
			Port:        port,
			Service:     service,
			PID:         pid,
			ProcessName: name,
		})
	}
	return conflicts
}

// KillProcess forcefully terminates a process by PID.
func KillProcess(pid int) bool {
	err := winexec.Command("taskkill", "/PID", fmt.Sprintf("%d", pid), "/F").Run()
	return err == nil
}

func resolvePIDNames(pids map[int]bool) map[int]string {
	result := map[int]string{}
	if len(pids) == 0 {
		return result
	}

	out, err := winexec.Command("tasklist", "/NH", "/FO", "CSV").Output()
	if err != nil {
		return result
	}

	for _, line := range strings.Split(string(out), "\n") {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		// CSV format: "name.exe","PID","session","num","mem"
		parts := strings.Split(line, ",")
		if len(parts) < 2 {
			continue
		}
		name := strings.Trim(parts[0], "\"")
		pid, err := strconv.Atoi(strings.Trim(parts[1], "\""))
		if err != nil {
			continue
		}
		if pids[pid] {
			result[pid] = name
		}
	}
	return result
}
