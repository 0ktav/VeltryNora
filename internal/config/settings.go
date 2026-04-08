package config

import (
	"encoding/json"
	"os"
	"path/filepath"
)

type AppSettings struct {
	BasePath         string `json:"base_path"`
	AutoStop         bool   `json:"auto_stop"`
	AutoStart        bool   `json:"auto_start"`
	StartOnBoot      bool   `json:"start_on_boot"`
	Theme            string `json:"theme"`            // "dark" | "light"
	Language         string `json:"language"`
	NginxWorkers                   int    `json:"nginx_workers"`                     // 0 = auto
	NginxKeepalive                 int    `json:"nginx_keepalive"`                   // seconds
	NginxClientHeaderBufferSize    string `json:"nginx_client_header_buffer_size"`   // e.g. "4k"
	NginxLargeClientHeaderBuffers  string `json:"nginx_large_client_header_buffers"` // e.g. "4 8k"
	MinimizeToTray   bool   `json:"minimize_to_tray"`
	ShowAppLog       bool   `json:"show_app_log"`
	PreferredBrowser    string `json:"preferred_browser"`    // exe path, empty = system default
	NotifyServiceCrash  bool   `json:"notify_service_crash"`
	NotifyOperationFail bool   `json:"notify_operation_fail"`
	TabsLayout          bool   `json:"tabs_layout"`
}

func settingsPath() string {
	appData := os.Getenv("APPDATA")
	return filepath.Join(appData, AppDataFolder, "settings.json")
}

func LoadSettings() AppSettings {
	defaults := AppSettings{
		BasePath:                      "",
		AutoStop:                      false,
		AutoStart:                     false,
		StartOnBoot:                   false,
		Theme:                         "dark",
		Language:                      "en",
		NginxWorkers:                  1,
		NginxKeepalive:                65,
		NginxClientHeaderBufferSize:   "4k",
		NginxLargeClientHeaderBuffers: "4 8k",
	}

	data, err := os.ReadFile(settingsPath())
	if err != nil {
		return defaults
	}

	var s AppSettings
	if err := json.Unmarshal(data, &s); err != nil {
		return defaults
	}

	if s.Theme == "" {
		s.Theme = "dark"
	}
	if s.Language == "" {
		s.Language = "en"
	}
	if s.NginxKeepalive == 0 {
		s.NginxKeepalive = 65
	}
	if s.NginxClientHeaderBufferSize == "" {
		s.NginxClientHeaderBufferSize = "4k"
	}
	if s.NginxLargeClientHeaderBuffers == "" {
		s.NginxLargeClientHeaderBuffers = "4 8k"
	}

	return s
}

func SaveSettings(s AppSettings) error {
	path := settingsPath()
	if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
		return err
	}

	data, err := json.MarshalIndent(s, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(path, data, 0644)
}
