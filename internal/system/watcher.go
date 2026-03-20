package system

import (
	"context"
	"nginxpanel/internal/config"
	"nginxpanel/internal/notify"
	"time"
)

// StartServiceWatcher polls services every 15 seconds and fires a toast
// notification when a service transitions from running to stopped,
// unless the stop was suppressed via notify.SuppressNext.
func StartServiceWatcher(ctx context.Context) {
	prev := map[string]bool{}
	initialized := false

	check := func() {
		s := config.LoadSettings()
		if !s.NotifyServiceCrash {
			prev = map[string]bool{}
			initialized = false
			return
		}

		for _, svc := range GetServicesStatus() {
			key := svc.Name + "_" + svc.Version
			wasRunning := prev[key]
			if initialized && wasRunning && !svc.Running {
				if !notify.ConsumeSuppressed(key) {
					name := svc.Name
					if svc.Version != "" {
						name += " " + svc.Version
					}
					notify.Show("VeltryNora", name+" stopped unexpectedly")
				}
			}
			prev[key] = svc.Running
		}
		initialized = true
	}

	ticker := time.NewTicker(15 * time.Second)
	defer ticker.Stop()

	check() // capture initial state without firing notifications
	for {
		select {
		case <-ticker.C:
			check()
		case <-ctx.Done():
			return
		}
	}
}
