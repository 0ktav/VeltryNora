package main

import "sync"

// DashboardVersions holds the latest version info for all services shown on the dashboard.
type DashboardVersions struct {
	Nginx VersionResult `json:"nginx"`
	PHP   VersionResult `json:"php"`
	Redis VersionResult `json:"redis"`
}

// GetDashboardVersions fetches the latest version for Nginx, PHP, and Redis in parallel.
func (a *App) GetDashboardVersions() DashboardVersions {
	var (
		wg     sync.WaitGroup
		result DashboardVersions
		mu     sync.Mutex
	)
	type job struct {
		run func() VersionResult
		set func(VersionResult)
	}
	jobs := []job{
		{a.CheckNginxVersion, func(r VersionResult) { result.Nginx = r }},
		{a.CheckPHPVersion, func(r VersionResult) { result.PHP = r }},
		{a.CheckRedisVersion, func(r VersionResult) { result.Redis = r }},
	}
	wg.Add(len(jobs))
	for _, j := range jobs {
		j := j
		go func() {
			defer wg.Done()
			r := j.run()
			mu.Lock()
			j.set(r)
			mu.Unlock()
		}()
	}
	wg.Wait()
	return result
}