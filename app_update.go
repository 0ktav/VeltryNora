package main

import (
	"fmt"
	"os"
	"path/filepath"
	"syscall"
	"unsafe"

	"nginxpanel/internal/utils"
	"github.com/wailsapp/wails/v2/pkg/runtime"
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
		nShow:        0, // SW_HIDE — suppressed anyway by /S
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
	exePath, err := os.Executable()
	if err != nil {
		return err.Error()
	}
	installDir := filepath.Dir(exePath)
	// /S = silent; /D= must be last and unquoted (NSIS requirement)
	params := `/S /D=` + installDir
	if err := shellExecute(installer, params); err != nil {
		return err.Error()
	}
	runtime.Quit(a.ctx)
	return ""
}
