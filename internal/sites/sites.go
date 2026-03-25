package sites

import (
	"bytes"
	_ "embed"
	"fmt"
	"nginxpanel/internal/config"
	"nginxpanel/internal/system"
	"nginxpanel/internal/winexec"
	"os"
	"path/filepath"
	"strings"
	"text/template"
)

//go:embed templates/site.conf.tmpl
var siteConfTmpl string

//go:embed templates/index.html.tmpl
var indexHTMLTmpl string

//go:embed templates/index.php.tmpl
var indexPHPTmpl string

type Site struct {
	Name          string `json:"name"`
	Domain        string `json:"domain"`
	Root          string `json:"root"`
	PHP           string `json:"php"`
	Active        bool   `json:"active"`
	LaravelVersion string `json:"laravel_version"`
}

func GetSites() []Site {
	basePath := system.GetBasePath()
	sitesPath := filepath.Join(basePath, config.ConfigFolder, config.SitesFolder)

	entries, err := os.ReadDir(sitesPath)
	if err != nil {
		return []Site{}
	}

	sites := []Site{}
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}

		name := entry.Name()
		if strings.HasPrefix(name, "_") {
			continue
		}
		active := false
		siteName := ""

		if strings.HasSuffix(name, ".conf") {
			siteName = strings.TrimSuffix(name, ".conf")
			active = true
		} else if strings.HasSuffix(name, ".disabled") {
			siteName = strings.TrimSuffix(name, ".disabled")
			active = false
		} else {
			continue
		}

		site, err := parseConfig(filepath.Join(sitesPath, name), siteName, active)
		if err == nil {
			site.LaravelVersion = GetLaravelInfo(site.Root).Version
			sites = append(sites, site)
		}
	}
	return sites
}

func parseConfig(path string, name string, active bool) (Site, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return Site{}, err
	}

	content := string(data)
	site := Site{Name: name, Active: active}

	for _, line := range strings.Split(content, "\n") {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, "server_name ") {
			site.Domain = strings.TrimSuffix(strings.TrimPrefix(line, "server_name "), ";")
		}
		if strings.HasPrefix(line, "root ") {
			site.Root = strings.TrimSuffix(strings.TrimPrefix(line, "root "), ";")
		}
		if strings.Contains(line, "fastcgi_pass 127.0.0.1:") {
			parts := strings.Split(line, ":")
			if len(parts) >= 2 {
				port := strings.TrimSuffix(strings.TrimSpace(parts[len(parts)-1]), ";")
				site.PHP = portToVersion(port)
			}
		}
	}
	return site, nil
}

func portToVersion(port string) string {
	if port == "0" || port == "" {
		return ""
	}
	if len(port) == 4 && strings.HasPrefix(port, "90") {
		major := string(port[2])
		minor := string(port[3])
		return major + "." + minor
	}
	return port
}

func isValidDomain(domain string) bool {
	if domain == "" {
		return false
	}
	for _, c := range domain {
		if !((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') || c == '.' || c == '-') {
			return false
		}
	}
	return true
}

func CreateSite(domain string, root string, phpVersion string, addToHostsFile bool) error {
	if !isValidDomain(domain) {
		return fmt.Errorf("invalid domain name: %s", domain)
	}
	basePath := system.GetBasePath()

	if root == "" {
		root = filepath.Join(basePath, config.WWWFolder, domain, "public")
		os.MkdirAll(root, 0755)
	}

	sitesPath := filepath.Join(basePath, config.ConfigFolder, config.SitesFolder)
	os.MkdirAll(sitesPath, 0755)

	phpPort := 0
	if phpVersion != "" {
		phpPort = versionToPort(phpVersion)
	}
	name := strings.ReplaceAll(domain, ".", "_")
	configPath := filepath.Join(sitesPath, name+".conf")

	cfg := generateConfig(domain, root, phpPort, basePath)
	err := os.WriteFile(configPath, []byte(cfg), 0644)
	if err != nil {
		return err
	}

	if !addToHostsFile {
		return nil
	}

	err = addToHosts(domain)
	winexec.Command("ipconfig", "/flushdns").Run()
	return err
}

// SiteRoot returns the resolved root path for a domain — same logic as CreateSite.
func SiteRoot(domain string, customRoot string) string {
	if customRoot != "" {
		return customRoot
	}
	return filepath.Join(system.GetBasePath(), config.WWWFolder, domain, "public")
}

func generateConfig(domain string, root string, phpPort int, basePath string) string {
	return generateConfigWithRewrites(domain, root, phpPort, basePath, "")
}

func generateConfigWithRewrites(domain string, root string, phpPort int, basePath string, rewrites string) string {
	phpPortStr := ""
	if phpPort > 0 {
		phpPortStr = fmt.Sprintf("%d", phpPort)
	}

	name := strings.ReplaceAll(domain, ".", "_")
	logsDir := filepath.Join(basePath, config.LogsFolder, config.SiteLogsFolder)
	os.MkdirAll(logsDir, 0755)

	tmpl, _ := template.New("site").Parse(siteConfTmpl)
	var buf bytes.Buffer
	tmpl.Execute(&buf, map[string]interface{}{
		"Domain":        domain,
		"Root":          filepath.ToSlash(root),
		"PHPPort":       phpPortStr,
		"FastCGIParams": filepath.ToSlash(filepath.Join(basePath, config.ConfigFolder, "fastcgi_params")),
		"Rewrites":      indentRewrites(rewrites),
		"AccessLog":     filepath.ToSlash(filepath.Join(logsDir, name+"-access.log")),
		"ErrorLog":      filepath.ToSlash(filepath.Join(logsDir, name+"-error.log")),
	})
	return buf.String()
}

func indentRewrites(rules string) string {
	if strings.TrimSpace(rules) == "" {
		return ""
	}
	lines := strings.Split(strings.TrimSpace(rules), "\n")
	for i, l := range lines {
		if strings.TrimSpace(l) != "" {
			lines[i] = "    " + strings.TrimSpace(l)
		}
	}
	return strings.Join(lines, "\n")
}

func GetSiteRewrites(name string) string {
	basePath := system.GetBasePath()
	sitesPath := filepath.Join(basePath, config.ConfigFolder, config.SitesFolder)

	path := filepath.Join(sitesPath, name+".conf")
	if _, err := os.Stat(path); err != nil {
		path = filepath.Join(sitesPath, name+".disabled")
	}

	data, err := os.ReadFile(path)
	if err != nil {
		return ""
	}

	content := string(data)
	start := strings.Index(content, "# BEGIN REWRITES")
	end := strings.Index(content, "# END REWRITES")
	if start == -1 || end == -1 || end <= start {
		return ""
	}

	inner := content[start+len("# BEGIN REWRITES") : end]
	return strings.TrimSpace(inner)
}

func SaveSiteRewrites(name string, rules string) error {
	basePath := system.GetBasePath()
	sitesPath := filepath.Join(basePath, config.ConfigFolder, config.SitesFolder)

	path := filepath.Join(sitesPath, name+".conf")
	if _, err := os.Stat(path); err != nil {
		path = filepath.Join(sitesPath, name+".disabled")
	}

	data, err := os.ReadFile(path)
	if err != nil {
		return err
	}

	content := string(data)
	rulesBlock := "\n" + indentRewrites(rules) + "\n    "
	if strings.TrimSpace(rules) == "" {
		rulesBlock = "\n    "
	}

	start := strings.Index(content, "# BEGIN REWRITES")
	end := strings.Index(content, "# END REWRITES")

	var newContent string
	if start != -1 && end != -1 {
		newContent = content[:start] + "# BEGIN REWRITES" + rulesBlock + content[end:]
	} else {
		// Legacy site without markers — inject before location /
		locIdx := strings.Index(content, "location /")
		if locIdx == -1 {
			return fmt.Errorf("could not find location block")
		}
		insert := "# BEGIN REWRITES" + rulesBlock + "# END REWRITES\n\n    "
		newContent = content[:locIdx] + insert + content[locIdx:]
	}

	return os.WriteFile(path, []byte(newContent), 0644)
}

func versionToPort(version string) int {
	parts := strings.Split(version, ".")
	if len(parts) >= 2 {
		major := 0
		minor := 0
		fmt.Sscanf(parts[0], "%d", &major)
		fmt.Sscanf(parts[1], "%d", &minor)
		return 9000 + major*10 + minor
	}
	return 9000
}

func addToHosts(domain string) error {
	hostsPath := getHostsPath()
	data, err := os.ReadFile(hostsPath)
	if err != nil {
		return err
	}

	if strings.Contains(string(data), domain) {
		return nil
	}

	entry := fmt.Sprintf("\r\n127.0.0.1 %s", domain)
	return os.WriteFile(hostsPath, append(data, []byte(entry)...), 0644)
}

func ToggleSite(name string) error {
	basePath := system.GetBasePath()
	sitesPath := filepath.Join(basePath, config.ConfigFolder, config.SitesFolder)

	activePath := filepath.Join(sitesPath, name+".conf")
	disabledPath := filepath.Join(sitesPath, name+".disabled")

	if _, err := os.Stat(activePath); err == nil {
		return os.Rename(activePath, disabledPath)
	}
	return os.Rename(disabledPath, activePath)
}

func DeleteSite(name string, deleteFolder bool) error {
	basePath := system.GetBasePath()
	sitesPath := filepath.Join(basePath, config.ConfigFolder, config.SitesFolder)

	if deleteFolder {
		site, err := GetSiteByName(name)
		if err == nil && site.Root != "" {
			target := filepath.Clean(filepath.FromSlash(site.Root))
			defaultParent := filepath.Clean(filepath.Join(basePath, config.WWWFolder, site.Domain))
			// If the root is anywhere inside the default site directory, delete the whole site directory.
			rel, relErr := filepath.Rel(defaultParent, target)
			if relErr == nil && !strings.HasPrefix(rel, "..") {
				target = defaultParent
			}
			if isSafeToDelete(target, basePath) {
				os.RemoveAll(target)
			}
		}
	}

	os.Remove(filepath.Join(sitesPath, name+".conf"))
	os.Remove(filepath.Join(sitesPath, name+".disabled"))
	return nil
}

func isSafeToDelete(target string, appBasePath string) bool {
	target = filepath.Clean(target)

	// Must be an absolute path
	if !filepath.IsAbs(target) {
		return false
	}

	// Must have at least 3 path components (e.g. C:\Users\something) — no roots or single-level paths
	parts := strings.Split(strings.Trim(target, `\/`), string(filepath.Separator))
	if len(parts) < 3 {
		return false
	}

	// Must not be a drive root (C:\, D:\, etc.)
	vol := filepath.VolumeName(target)
	if filepath.Clean(target) == filepath.Clean(vol+`\`) || filepath.Clean(target) == filepath.Clean(vol+`/`) {
		return false
	}

	// Protected Windows system folders
	systemRoot := os.Getenv("SystemRoot")
	if systemRoot == "" {
		systemRoot = `C:\Windows`
	}
	programFiles := os.Getenv("ProgramFiles")
	programFilesX86 := os.Getenv("ProgramFiles(x86)")
	programData := os.Getenv("ProgramData")
	userProfile := os.Getenv("USERPROFILE")
	systemDrive := os.Getenv("SystemDrive")
	if systemDrive == "" {
		systemDrive = "C:"
	}

	protected := []string{
		systemRoot,
		programFiles,
		programFilesX86,
		programData,
		userProfile,
		systemDrive + `\Users`,
		systemDrive + `\Windows`,
		systemDrive + `\Program Files`,
		systemDrive + `\Program Files (x86)`,
		systemDrive + `\System32`,
		appBasePath,
	}

	for _, p := range protected {
		if p == "" {
			continue
		}
		p = filepath.Clean(p)
		// Must not be the protected folder itself, nor a parent of it
		if target == p || strings.HasPrefix(p+string(filepath.Separator), target+string(filepath.Separator)) {
			return false
		}
	}

	return true
}

func ChangeSiteRoot(name string, newRoot string) error {
	basePath := system.GetBasePath()
	sitesPath := filepath.Join(basePath, config.ConfigFolder, config.SitesFolder)

	path := filepath.Join(sitesPath, name+".conf")
	active := true
	if _, err := os.Stat(path); err != nil {
		path = filepath.Join(sitesPath, name+".disabled")
		active = false
	}

	site, err := parseConfig(path, name, active)
	if err != nil {
		return fmt.Errorf("site not found")
	}

	rewrites := GetSiteRewrites(name)

	phpPort := 0
	if site.PHP != "" {
		phpPort = versionToPort(site.PHP)
	}

	cfg := generateConfigWithRewrites(site.Domain, newRoot, phpPort, basePath, rewrites)
	return os.WriteFile(path, []byte(cfg), 0644)
}

func ChangeSitePHP(name string, phpVersion string) error {
	basePath := system.GetBasePath()
	sitesPath := filepath.Join(basePath, config.ConfigFolder, config.SitesFolder)

	path := filepath.Join(sitesPath, name+".conf")
	active := true
	if _, err := os.Stat(path); err != nil {
		path = filepath.Join(sitesPath, name+".disabled")
		active = false
	}

	site, err := parseConfig(path, name, active)
	if err != nil {
		return fmt.Errorf("site not found")
	}

	rewrites := GetSiteRewrites(name)

	phpPort := 0
	if phpVersion != "" {
		phpPort = versionToPort(phpVersion)
	}

	cfg := generateConfigWithRewrites(site.Domain, site.Root, phpPort, basePath, rewrites)
	return os.WriteFile(path, []byte(cfg), 0644)
}

func GetSiteByName(name string) (Site, error) {
	basePath := system.GetBasePath()
	sitesPath := filepath.Join(basePath, config.ConfigFolder, config.SitesFolder)

	for _, ext := range []string{".conf", ".disabled"} {
		p := filepath.Join(sitesPath, name+ext)
		site, err := parseConfig(p, name, ext == ".conf")
		if err == nil {
			return site, nil
		}
	}
	return Site{}, fmt.Errorf("site not found")
}

func CreateIndexFiles(domain string, customRoot string, createHTML bool, createPHP bool) bool {
	root := SiteRoot(domain, customRoot)
	if err := os.MkdirAll(root, 0755); err != nil {
		return false
	}

	if createHTML {
		var buf bytes.Buffer
		tmpl, _ := template.New("index.html").Parse(indexHTMLTmpl)
		tmpl.Execute(&buf, map[string]string{"Domain": domain})
		os.WriteFile(filepath.Join(root, "index.html"), buf.Bytes(), 0644)
	}

	if createPHP {
		os.WriteFile(filepath.Join(root, "index.php"), []byte(indexPHPTmpl), 0644)
	}

	return true
}

func getHostsPath() string {
	systemRoot := os.Getenv("SystemRoot")
	if systemRoot == "" {
		systemRoot = `C:\Windows`
	}
	return systemRoot + config.HostsFile
}
