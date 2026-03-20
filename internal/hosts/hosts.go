package hosts

import (
	"os"
	"strings"
)

// HostEntry represents a single line in the hosts file.
type HostEntry struct {
	IP      string `json:"ip"`
	Host    string `json:"host"`
	Enabled bool   `json:"enabled"`
	System  bool   `json:"system"`
}

// systemHosts are protected entries that cannot be toggled or deleted.
var systemHosts = map[string]bool{
	"localhost":         true,
	"local":             true,
	"broadcasthost":     true,
	"ip6-localhost":     true,
	"ip6-loopback":      true,
	"ip6-localnet":      true,
	"ip6-mcastprefix":   true,
	"ip6-allnodes":      true,
	"ip6-allrouters":    true,
	"ip6-allhosts":      true,
}

func GetHostsPath() string {
	systemRoot := os.Getenv("SystemRoot")
	if systemRoot == "" {
		systemRoot = `C:\Windows`
	}
	return systemRoot + `\System32\drivers\etc\hosts`
}

func readLines() ([]string, error) {
	data, err := os.ReadFile(GetHostsPath())
	if err != nil {
		return nil, err
	}
	content := strings.ReplaceAll(string(data), "\r\n", "\n")
	return strings.Split(content, "\n"), nil
}

func writeLines(lines []string) error {
	content := strings.Join(lines, "\r\n")
	return os.WriteFile(GetHostsPath(), []byte(content), 0644)
}

// GetEntries parses the hosts file and returns all IP-host entries.
func GetEntries() []HostEntry {
	lines, err := readLines()
	if err != nil {
		return []HostEntry{}
	}

	entries := []HostEntry{}
	for _, line := range lines {
		trimmed := strings.TrimSpace(line)

		enabled := true
		if strings.HasPrefix(trimmed, "#") {
			// Could be a disabled entry: # 127.0.0.1 domain
			trimmed = strings.TrimSpace(trimmed[1:])
			enabled = false
		}

		fields := strings.Fields(trimmed)
		if len(fields) < 2 {
			continue
		}

		ip := fields[0]
		host := fields[1]

		// Skip pure comment lines that don't look like host entries
		if !isValidIP(ip) {
			continue
		}

		entries = append(entries, HostEntry{
			IP:      ip,
			Host:    host,
			Enabled: enabled,
			System:  systemHosts[strings.ToLower(host)],
		})
	}
	return entries
}

// AddEntry appends a new entry to the hosts file.
func AddEntry(ip, host string) error {
	lines, err := readLines()
	if err != nil {
		return err
	}
	lines = append(lines, ip+" "+host)
	return writeLines(lines)
}

// ToggleEntry comments or uncomments an entry by host name.
func ToggleEntry(host string) error {
	lines, err := readLines()
	if err != nil {
		return err
	}

	for i, line := range lines {
		trimmed := strings.TrimSpace(line)
		isDisabled := strings.HasPrefix(trimmed, "#")
		check := trimmed
		if isDisabled {
			check = strings.TrimSpace(trimmed[1:])
		}
		fields := strings.Fields(check)
		if len(fields) >= 2 && strings.EqualFold(fields[1], host) {
			if isDisabled {
				lines[i] = check
			} else {
				lines[i] = "# " + line
			}
			break
		}
	}

	return writeLines(lines)
}

// DeleteEntry removes an entry by host name.
func DeleteEntry(host string) error {
	lines, err := readLines()
	if err != nil {
		return err
	}

	filtered := lines[:0]
	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		check := trimmed
		if strings.HasPrefix(trimmed, "#") {
			check = strings.TrimSpace(trimmed[1:])
		}
		fields := strings.Fields(check)
		if len(fields) >= 2 && strings.EqualFold(fields[1], host) {
			continue
		}
		filtered = append(filtered, line)
	}

	return writeLines(filtered)
}

// DeleteEntries removes multiple entries by host name in a single file write.
func DeleteEntries(hostnames []string) error {
	toDelete := map[string]bool{}
	for _, h := range hostnames {
		toDelete[strings.ToLower(h)] = true
	}

	lines, err := readLines()
	if err != nil {
		return err
	}

	filtered := lines[:0]
	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		check := trimmed
		if strings.HasPrefix(trimmed, "#") {
			check = strings.TrimSpace(trimmed[1:])
		}
		fields := strings.Fields(check)
		if len(fields) >= 2 && toDelete[strings.ToLower(fields[1])] {
			continue
		}
		filtered = append(filtered, line)
	}

	return writeLines(filtered)
}

func isValidIP(s string) bool {
	// Minimal check: contains dots (IPv4) or colons (IPv6)
	return strings.Contains(s, ".") || strings.Contains(s, ":")
}
