package main

import (
	"syscall"
	"unsafe"
)

var (
	kernel32       = syscall.NewLazyDLL("kernel32.dll")
	user32         = syscall.NewLazyDLL("user32.dll")
	createMutexW   = kernel32.NewProc("CreateMutexW")
	findWindowW    = user32.NewProc("FindWindowW")
	showWindow     = user32.NewProc("ShowWindow")
	setForeground  = user32.NewProc("SetForegroundWindow")
	isIconic       = user32.NewProc("IsIconic")
)

const (
	errorAlreadyExists = 183
	swRestore          = 9
	swShow             = 5
)

// acquireSingleInstanceMutex tries to create a named mutex.
// Returns (handle, true) if this is the first instance.
// Returns (0, false) if another instance is already running — and brings it to foreground.
func acquireSingleInstanceMutex() (syscall.Handle, bool) {
	name, _ := syscall.UTF16PtrFromString("VeltryNora_SingleInstance")
	handle, _, err := createMutexW.Call(0, 1, uintptr(unsafe.Pointer(name)))
	if err == syscall.Errno(errorAlreadyExists) {
		bringExistingWindowToFront()
		return 0, false
	}
	return syscall.Handle(handle), true
}

// bringExistingWindowToFront finds the running instance window and focuses it.
// Handles minimized, hidden (tray), and normal states.
func bringExistingWindowToFront() {
	title, _ := syscall.UTF16PtrFromString("VeltryNora")
	hwnd, _, _ := findWindowW.Call(0, uintptr(unsafe.Pointer(title)))
	if hwnd == 0 {
		return
	}
	minimized, _, _ := isIconic.Call(hwnd)
	if minimized != 0 {
		showWindow.Call(hwnd, swRestore)
	} else {
		// Also handles hidden windows (minimized to tray)
		showWindow.Call(hwnd, swShow)
	}
	setForeground.Call(hwnd)
}
