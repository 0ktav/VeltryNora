package main

import (
	"nginxpanel/internal/sites"
	"nginxpanel/internal/winexec"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

func (a *App) GetSites() []sites.Site {
	return sites.GetSites()
}

func (a *App) CreateSite(domain string, root string, phpVersion string, addToHosts bool) string {
	err := sites.CreateSite(domain, root, phpVersion, addToHosts)
	if err != nil {
		if strings.Contains(err.Error(), "hosts") {
			return "hosts_denied"
		}
		return "error"
	}
	return "ok"
}

// CheckIndexFilesExist returns a list of index files that already exist in the site root.
func (a *App) CheckIndexFilesExist(domain string, customRoot string, checkHtml bool, checkPhp bool) []string {
	return sites.CheckIndexFilesExist(domain, customRoot, checkHtml, checkPhp)
}

// CreateIndexFiles creates index.html and/or index.php in the site root directory.
func (a *App) CreateIndexFiles(domain string, customRoot string, createHtml bool, createPhp bool) bool {
	return sites.CreateIndexFiles(domain, customRoot, createHtml, createPhp)
}

func (a *App) ToggleSite(name string) bool {
	err := sites.ToggleSite(name)
	return err == nil
}

func (a *App) DeleteSite(name string, deleteFolder bool) bool {
	err := sites.DeleteSite(name, deleteFolder)
	return err == nil
}

func (a *App) OpenFolder(path string) {
	path = filepath.FromSlash(path)
	exec.Command("explorer", path).Start()
}

func (a *App) BrowseFolder(startPath string) string {
	path, err := runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title:            "Selectează folderul rădăcină",
		DefaultDirectory: startPath,
	})
	if err != nil {
		return ""
	}
	return path
}

func (a *App) BrowseHtaccessFile() string {
	path, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Select .htaccess file",
		Filters: []runtime.FileFilter{
			{DisplayName: ".htaccess files", Pattern: "*.htaccess;.htaccess"},
			{DisplayName: "All files", Pattern: "*"},
		},
	})
	if err != nil || path == "" {
		return ""
	}
	data, err := os.ReadFile(path)
	if err != nil {
		return ""
	}
	return string(data)
}

func (a *App) ConvertHtaccess(content string) string {
	return sites.ConvertHtaccess(content)
}

func (a *App) GetSiteRewrites(name string) string {
	return sites.GetSiteRewrites(name)
}

func (a *App) SaveSiteRewrites(name string, rules string) bool {
	return sites.SaveSiteRewrites(name, rules) == nil
}

func (a *App) ChangeSitePHP(name string, phpVersion string) bool {
	return sites.ChangeSitePHP(name, phpVersion) == nil
}

func (a *App) ChangeSiteRoot(name string, newRoot string) bool {
	return sites.ChangeSiteRoot(name, newRoot) == nil
}

func (a *App) FlushDNS() bool {
	err := winexec.Command("ipconfig", "/flushdns").Run()
	return err == nil
}
