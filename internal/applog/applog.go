package applog

import (
	"fmt"
	"nginxpanel/internal/config"
	"nginxpanel/internal/system"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

const (
	maxSize = 2 * 1024 * 1024 // 2MB before rotation
	logFile = "app.log"
)

var mu sync.Mutex

func logPath() string {
	return filepath.Join(system.GetBasePath(), config.LogsFolder, logFile)
}

func write(level, msg string) {
	mu.Lock()
	defer mu.Unlock()

	path := logPath()
	if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
		return
	}

	// Rotate if too large
	if fi, err := os.Stat(path); err == nil && fi.Size() > maxSize {
		os.Rename(path, path+".1")
	}

	f, err := os.OpenFile(path, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return
	}
	defer f.Close()

	line := fmt.Sprintf("[%s] %s: %s\n", time.Now().Format("2006-01-02 15:04:05"), level, msg)
	f.WriteString(line)
}

func Info(msg string)  { write("INFO", msg) }
func Warn(msg string)  { write("WARN", msg) }
func Error(msg string) { write("ERROR", msg) }

func Infof(format string, args ...interface{})  { Info(fmt.Sprintf(format, args...)) }
func Warnf(format string, args ...interface{})  { Warn(fmt.Sprintf(format, args...)) }
func Errorf(format string, args ...interface{}) { Error(fmt.Sprintf(format, args...)) }

// GetLines returns the last n lines from app.log.
func GetLines(n int) []string {
	data, err := os.ReadFile(logPath())
	if err != nil {
		return []string{}
	}
	lines := strings.Split(strings.TrimRight(string(data), "\n"), "\n")
	if len(lines) > n {
		lines = lines[len(lines)-n:]
	}
	return lines
}

// Clear removes the log file.
func Clear() error {
	return os.Remove(logPath())
}
