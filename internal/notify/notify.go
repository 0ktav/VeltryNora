package notify

import (
	"fmt"
	"nginxpanel/internal/winexec"
	"strings"
	"sync"
)

var mu sync.Mutex
var suppressed = map[string]bool{}

// SuppressNext marks the next running→stopped transition for key as intentional
// so the watcher will not fire a notification for it.
func SuppressNext(key string) {
	mu.Lock()
	suppressed[key] = true
	mu.Unlock()
}

// ConsumeSuppressed returns true and clears the flag if it was set for key.
func ConsumeSuppressed(key string) bool {
	mu.Lock()
	defer mu.Unlock()
	if suppressed[key] {
		delete(suppressed, key)
		return true
	}
	return false
}

// Show displays a Windows toast notification asynchronously.
func Show(title, message string) {
	title = strings.ReplaceAll(title, "'", "''")
	message = strings.ReplaceAll(message, "'", "''")
	script := fmt.Sprintf(`[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
$template = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02)
$template.SelectSingleNode('//text[@id="1"]').InnerText = '%s'
$template.SelectSingleNode('//text[@id="2"]').InnerText = '%s'
$app = '{1AC14E77-02E7-4E5D-B744-2EB1AE5198B7}\WindowsPowerShell\v1.0\powershell.exe'
[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier($app).Show([Windows.UI.Notifications.ToastNotification]::new($template))`,
		title, message)
	winexec.Command("powershell", "-WindowStyle", "Hidden", "-NonInteractive", "-Command", script).Start()
}
