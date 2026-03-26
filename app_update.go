package main

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"syscall"
	"unsafe"

	"nginxpanel/internal/utils"
	"github.com/wailsapp/wails/v2/pkg/runtime"
	"golang.org/x/sys/windows/registry"
)

var (
	shell32         = syscall.NewLazyDLL("shell32.dll")
	shellExecuteExW = shell32.NewProc("ShellExecuteExW")
)

// shellExecuteInfo mirrors the Windows SHELLEXECUTEINFOW struct.
type shellExecuteInfo struct {
	cbSize         uint32
	fMask          uint32
	hwnd           uintptr
	lpVerb         *uint16
	lpFile         *uint16
	lpParameters   *uint16
	lpDirectory    *uint16
	nShow          int32
	hInstApp       uintptr
	lpIDList       uintptr
	lpClass        *uint16
	hkeyClass      uintptr
	dwHotKey       uint32
	hIconOrMonitor uintptr
	hProcess       uintptr
}

func updateInstallerPath() string {
	return filepath.Join(os.TempDir(), "VeltryNora-Setup.exe")
}

// installedLocation reads the InstallLocation from the registry uninstall entry.
// Returns empty string if not found.
func installedLocation() string {
	const uninstallBase = `Software\Microsoft\Windows\CurrentVersion\Uninstall`
	k, err := registry.OpenKey(registry.LOCAL_MACHINE, uninstallBase, registry.ENUMERATE_SUB_KEYS)
	if err != nil {
		return ""
	}
	defer k.Close()

	names, err := k.ReadSubKeyNames(-1)
	if err != nil {
		return ""
	}

	for _, name := range names {
		sub, err := registry.OpenKey(registry.LOCAL_MACHINE, uninstallBase+`\`+name, registry.QUERY_VALUE)
		if err != nil {
			continue
		}
		displayName, _, _ := sub.GetStringValue("DisplayName")
		if strings.EqualFold(displayName, "VeltryNora") {
			location, _, _ := sub.GetStringValue("InstallLocation")
			sub.Close()
			return strings.TrimRight(location, `\/`)
		}
		sub.Close()
	}
	return ""
}

// DownloadUpdate downloads the installer to the temp directory.
// Returns "" on success, error message on failure.
func (a *App) DownloadUpdate(url string) string {
	dest := updateInstallerPath()
	// Remove any leftover installer from a previous attempt before downloading.
	os.Remove(dest)
	err := utils.Download(url, dest, 0, func(percent int, totalMB float64) {
		runtime.EventsEmit(a.ctx, "update:download-progress", map[string]interface{}{
			"percent": percent,
			"totalMB": totalMB,
		})
	})
	if err != nil {
		return err.Error()
	}
	return ""
}

// GetInstallLocation returns the confirmed install location from the registry, or empty string if unknown.
func (a *App) GetInstallLocation() string {
	return installedLocation()
}

// shellExecute runs a program via ShellExecuteExW so that UAC elevation
// preserves the command-line arguments passed in params.
func shellExecute(file, params string) error {
	verb, _ := syscall.UTF16PtrFromString("runas")
	filep, _ := syscall.UTF16PtrFromString(file)
	paramsp, _ := syscall.UTF16PtrFromString(params)

	info := shellExecuteInfo{
		fMask:        0x00000040, // SEE_MASK_NOCLOSEPROCESS
		lpVerb:       verb,
		lpFile:       filep,
		lpParameters: paramsp,
		nShow:        1, // SW_SHOWNORMAL
	}
	info.cbSize = uint32(unsafe.Sizeof(info))

	ret, _, err := shellExecuteExW.Call(uintptr(unsafe.Pointer(&info)))
	if ret == 0 {
		return err
	}
	return nil
}

// InstallUpdate launches the downloaded installer targeting the current executable's
// directory via ShellExecuteExW (preserves arguments through UAC), then quits the app.
// Returns an error message on failure.
func (a *App) InstallUpdate() string {
	installer := updateInstallerPath()
	if _, err := os.Stat(installer); os.IsNotExist(err) {
		return fmt.Sprintf("installer not found: %s", installer)
	}
	// /DIR= pre-fills the install directory in the Inno Setup wizard.
	// Only pass it when we have a confirmed previous install location from the registry.
	params := ""
	if installDir := installedLocation(); installDir != "" {
		params = `/DIR="` + installDir + `"`
	}
	if err := shellExecute(installer, params); err != nil {
		return err.Error()
	}
	a.forceQuit = true
	runtime.Quit(a.ctx)
	return ""
}
