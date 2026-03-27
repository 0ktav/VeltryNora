package cache

import (
	"encoding/json"
	"nginxpanel/internal/config"
	"os"
	"time"
)

type VersionCache struct {
	Nginx          string    `json:"nginx"`
	PHP            string    `json:"php"`
	Redis          string    `json:"redis"`
	MySQL          string    `json:"mysql"`
	NginxUpdatedAt time.Time `json:"nginx_updated_at,omitempty"`
	PHPUpdatedAt   time.Time `json:"php_updated_at,omitempty"`
	RedisUpdatedAt time.Time `json:"redis_updated_at,omitempty"`
	MySQLUpdatedAt time.Time `json:"mysql_updated_at,omitempty"`
	UpdatedAt      time.Time `json:"updated_at"` // legacy global timestamp, kept for backwards compat
}

func getCachePath() string {
	appData := os.Getenv("APPDATA")
	return appData + "\\" + config.AppDataFolder + "\\" + config.CacheFile
}

func Load() (VersionCache, error) {
	var cache VersionCache
	data, err := os.ReadFile(getCachePath())
	if err != nil {
		return cache, err
	}
	err = json.Unmarshal(data, &cache)
	return cache, err
}

func Save(cache VersionCache) error {
	path := getCachePath()
	dir := path[:len(path)-len("\\"+config.CacheFile)]
	err := os.MkdirAll(dir, 0755)
	if err != nil {
		return err
	}

	cache.UpdatedAt = time.Now()
	data, err := json.MarshalIndent(cache, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, data, 0644)
}

func IsExpired(cache VersionCache) bool {
	return time.Since(cache.UpdatedAt) > time.Duration(config.CacheExpireHours)*time.Hour
}

// IsServiceExpired checks expiry for a single service using its own timestamp.
// Zero value means never cached → treat as expired.
func IsServiceExpired(updatedAt time.Time) bool {
	return updatedAt.IsZero() || time.Since(updatedAt) > time.Duration(config.CacheExpireHours)*time.Hour
}
