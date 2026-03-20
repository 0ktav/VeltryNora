package system

import (
	"nginxpanel/internal/config"
	"nginxpanel/internal/winexec"
	"os/exec"
	"strings"

	"golang.org/x/sys/windows/registry"
)

type Browser struct {
	Name string `json:"name"`
	Path string `json:"path"`
}

var excludedBrowsers = []string{
	"internet explorer",
	"iexplore",
}

// GetInstalledBrowsers scans the Windows registry for registered browsers,
// checking both HKLM and HKCU to cover all installations.
func GetInstalledBrowsers() []Browser {
	const regKey = `SOFTWARE\Clients\StartMenuInternet`
	seen := map[string]bool{}
	browsers := []Browser{}

	for _, root := range []registry.Key{registry.LOCAL_MACHINE, registry.CURRENT_USER} {
		k, err := registry.OpenKey(root, regKey, registry.READ)
		if err != nil {
			continue
		}

		names, err := k.ReadSubKeyNames(-1)
		if err != nil {
			k.Close()
			continue
		}

		for _, name := range names {
			sub, err := registry.OpenKey(k, name+`\shell\open\command`, registry.READ)
			if err != nil {
				continue
			}
			val, _, err := sub.GetStringValue("")
			sub.Close()
			if err != nil {
				continue
			}

			// Registry value may be quoted ("path.exe" args) or unquoted (path.exe)
			var path string
			if parts := strings.SplitN(val, "\"", 3); len(parts) >= 3 {
				path = parts[1]
			} else if fields := strings.Fields(val); len(fields) > 0 {
				path = fields[0]
			}
			if path == "" {
				continue
			}

			// Resolve friendly name from registry
			label := name
			nameKey, err := registry.OpenKey(k, name, registry.READ)
			if err == nil {
				if v, _, e := nameKey.GetStringValue(""); e == nil && v != "" {
					label = v
				}
				nameKey.Close()
			}

			// Skip Internet Explorer
			lower := strings.ToLower(label + name)
			excluded := false
			for _, ex := range excludedBrowsers {
				if strings.Contains(lower, ex) {
					excluded = true
					break
				}
			}
			if excluded {
				continue
			}

			// Deduplicate by exe path
			if seen[path] {
				continue
			}
			seen[path] = true

			browsers = append(browsers, Browser{Name: label, Path: path})
		}

		k.Close()
	}

	return browsers
}

// OpenInBrowser opens the given URL in the preferred browser from settings,
// or in the system default browser if no preference is set.
func OpenInBrowser(url string) {
	s := config.LoadSettings()
	if s.PreferredBrowser != "" {
		exec.Command(s.PreferredBrowser, url).Start()
		return
	}
	winexec.Command("cmd", "/c", "start", "", url).Start()
}
