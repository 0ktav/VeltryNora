package main

import (
	"context"
	"nginxpanel/internal/cache"
	"nginxpanel/internal/config"
	"nginxpanel/internal/mysql"
	"nginxpanel/internal/notify"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type MySQLConnectionInfo struct {
	Host        string `json:"host"`
	Port        int    `json:"port"`
	User        string `json:"user"`
	HasPassword bool   `json:"hasPassword"`
	Password    string `json:"password"`
}

type MySQLUserInfo struct {
	User        string `json:"user"`
	Host        string `json:"host"`
	HasPassword bool   `json:"hasPassword"`
}

func (a *App) CheckMySQLVersion() VersionResult {
	return checkLatestVersion(
		func() (string, error) {
			versions := mysql.GetAvailableVersions()
			if len(versions) == 0 {
				return "unknown", nil
			}
			return versions[0], nil
		},
		func(c cache.VersionCache) string { return c.MySQL },
		func(c *cache.VersionCache, v string) { c.MySQL = v },
		func(c cache.VersionCache) time.Time { return c.MySQLUpdatedAt },
		func(c *cache.VersionCache, t time.Time) { c.MySQLUpdatedAt = t },
	)
}

func (a *App) GetMySQLAvailableVersions() []string {
	return mysql.GetAvailableVersions()
}

func (a *App) GetMySQLInstalledVersions() []string {
	return mysql.GetInstalledVersions()
}

func (a *App) GetMySQLActiveVersion() string {
	return mysql.GetActiveVersion()
}

func (a *App) SetMySQLActiveVersion(version string) bool {
	err := mysql.SetActiveVersion(version)
	return err == nil
}

func (a *App) IsMySQLRunning() bool {
	return mysql.IsRunning()
}

func (a *App) InstallMySQL(version string) string {
	key := "mysql:install-progress:" + version
	ctx, cancel := context.WithCancel(a.ctx)
	a.registerDownload(key, cancel)
	defer func() {
		cancel()
		a.unregisterDownload(key)
	}()

	err := mysql.Install(ctx, version, func(percent int, totalMB float64) {
		runtime.EventsEmit(a.ctx, key, map[string]interface{}{"percent": percent, "totalMB": totalMB})
	})
	if err != nil {
		return err.Error()
	}
	return ""
}

func (a *App) StartMySQL() bool {
	active := mysql.GetActiveVersion()
	err := mysql.Start(active)
	return err == nil
}

func (a *App) StopMySQL() bool {
	notify.SuppressNext("MySQL_")
	active := mysql.GetActiveVersion()
	err := mysql.Stop(active)
	return err == nil
}

func (a *App) RestartMySQL() bool {
	notify.SuppressNext("MySQL_")
	active := mysql.GetActiveVersion()
	err := mysql.Restart(active)
	return err == nil
}

func (a *App) DeleteMySQLVersion(version string) bool {
	err := mysql.DeleteVersion(version)
	return err == nil
}

func (a *App) GetMySQLConnectionInfo() MySQLConnectionInfo {
	pass := mysql.GetRootPassword()
	return MySQLConnectionInfo{
		Host:        "127.0.0.1",
		Port:        config.MySQLPort,
		User:        "root",
		HasPassword: pass != "",
		Password:    pass,
	}
}

func (a *App) GetMySQLUsers() ([]MySQLUserInfo, error) {
	users, err := mysql.GetUsers()
	if err != nil {
		return nil, err
	}
	result := make([]MySQLUserInfo, len(users))
	for i, u := range users {
		result[i] = MySQLUserInfo{
			User:        u.User,
			Host:        u.Host,
			HasPassword: u.HasPassword,
		}
	}
	return result, nil
}

func (a *App) CreateMySQLUser(username, host, password string) string {
	if err := mysql.CreateUser(username, host, password); err != nil {
		return err.Error()
	}
	return ""
}

func (a *App) DropMySQLUser(username, host string) string {
	if err := mysql.DropUser(username, host); err != nil {
		return err.Error()
	}
	return ""
}

func (a *App) SetMySQLUserPassword(username, host, password string) string {
	if err := mysql.SetUserPassword(username, host, password); err != nil {
		return err.Error()
	}
	return ""
}

func (a *App) GetMySQLUserGrants(username, host string) ([]string, error) {
	return mysql.GetUserGrants(username, host)
}

func (a *App) GrantMySQLDatabase(username, host, database string) string {
	if err := mysql.GrantDatabase(username, host, database); err != nil {
		return err.Error()
	}
	return ""
}

func (a *App) RevokeMySQLDatabase(username, host, database string) string {
	if err := mysql.RevokeDatabase(username, host, database); err != nil {
		return err.Error()
	}
	return ""
}

func (a *App) GetMySQLDatabases() ([]string, error) {
	return mysql.GetDatabases()
}

type MySQLDatabaseInfo struct {
	Name      string `json:"name"`
	Charset   string `json:"charset"`
	Collation string `json:"collation"`
}

func (a *App) GetMySQLDatabasesInfo() ([]MySQLDatabaseInfo, error) {
	infos, err := mysql.GetDatabasesInfo()
	if err != nil {
		return nil, err
	}
	result := make([]MySQLDatabaseInfo, len(infos))
	for i, d := range infos {
		result[i] = MySQLDatabaseInfo{Name: d.Name, Charset: d.Charset, Collation: d.Collation}
	}
	return result, nil
}

func (a *App) CreateMySQLDatabase(name string) string {
	if err := mysql.CreateDatabase(name); err != nil {
		return err.Error()
	}
	return ""
}

func (a *App) DropMySQLDatabase(name string) string {
	if err := mysql.DropDatabase(name); err != nil {
		return err.Error()
	}
	return ""
}

func (a *App) ExportMySQLDatabase(database string) string {
	path, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		DefaultFilename: database + ".sql",
		Filters: []runtime.FileFilter{
			{DisplayName: "SQL Files (*.sql)", Pattern: "*.sql"},
		},
	})
	if err != nil || path == "" {
		return ""
	}
	if err := mysql.ExportDatabase(database, path); err != nil {
		return err.Error()
	}
	return ""
}

func (a *App) ImportMySQLDatabase(database string) string {
	path, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Filters: []runtime.FileFilter{
			{DisplayName: "SQL Files (*.sql)", Pattern: "*.sql"},
		},
	})
	if err != nil || path == "" {
		return ""
	}
	if err := mysql.ImportDatabase(database, path); err != nil {
		return err.Error()
	}
	return ""
}
