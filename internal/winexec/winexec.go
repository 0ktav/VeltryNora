package winexec

import (
	"os/exec"
	"syscall"
)

// Command returns an exec.Cmd with a hidden console window on Windows.
// Use this instead of exec.Command for all background processes to avoid
// CMD windows popping up during normal app operation.
func Command(name string, args ...string) *exec.Cmd {
	cmd := exec.Command(name, args...)
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
	return cmd
}
