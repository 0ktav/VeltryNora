package mysql

import (
	"bytes"
	"fmt"
	"nginxpanel/internal/winexec"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// systemDatabases lists built-in MySQL databases that must not be dropped.
var systemDatabases = map[string]bool{
	"information_schema": true,
	"mysql":              true,
	"performance_schema": true,
	"sys":                true,
}

func IsSystemDatabase(name string) bool {
	return systemDatabases[strings.ToLower(name)]
}

// binDir returns the bin/ directory for the active MySQL version, checking one level deep if needed.
func binDir() string {
	dir := versionDir(GetActiveVersion())
	if _, err := os.Stat(filepath.Join(dir, "bin", "mysql.exe")); err == nil {
		return filepath.Join(dir, "bin")
	}
	// Fallback: strip prefix sub-directory
	entries, _ := os.ReadDir(dir)
	for _, e := range entries {
		if e.IsDir() {
			candidate := filepath.Join(dir, e.Name(), "bin")
			if _, err := os.Stat(filepath.Join(candidate, "mysql.exe")); err == nil {
				return candidate
			}
		}
	}
	return filepath.Join(dir, "bin")
}

func mysqlCLI(args ...string) (string, error) {
	exe := filepath.Join(binDir(), "mysql.exe")
	base := []string{"-u", "root", "--protocol=TCP", "--batch", "--skip-column-names"}
	if pass := GetRootPassword(); pass != "" {
		base = append(base, "-p"+pass)
	}

	const maxAttempts = 6
	const retryDelay = 800 * time.Millisecond

	var (
		out    []byte
		stderr bytes.Buffer
		err    error
	)
	for i := range maxAttempts {
		stderr.Reset()
		cmd := winexec.Command(exe, append(base, args...)...)
		cmd.Stderr = &stderr
		out, err = cmd.Output()
		if err == nil {
			break
		}
		if i < maxAttempts-1 {
			time.Sleep(retryDelay)
		}
	}
	if err != nil {
		// Return the actual MySQL error message from stderr if available.
		if msg := extractMySQLError(stderr.String()); msg != "" {
			return strings.TrimSpace(string(out)), fmt.Errorf("%s", msg)
		}
	}
	return strings.TrimSpace(string(out)), err
}

// extractMySQLError returns the first ERROR line from MySQL CLI stderr output.
func extractMySQLError(s string) string {
	for _, line := range strings.Split(s, "\n") {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, "ERROR") {
			return line
		}
	}
	return strings.TrimSpace(s)
}

// DatabaseInfo holds the name, charset and collation of a MySQL database.
type DatabaseInfo struct {
	Name      string `json:"name"`
	Charset   string `json:"charset"`
	Collation string `json:"collation"`
}

func GetDatabases() ([]string, error) {
	infos, err := GetDatabasesInfo()
	if err != nil {
		return nil, err
	}
	names := make([]string, len(infos))
	for i, d := range infos {
		names[i] = d.Name
	}
	return names, nil
}

func GetDatabasesInfo() ([]DatabaseInfo, error) {
	out, err := mysqlCLI("-e", "SELECT schema_name, default_character_set_name, default_collation_name FROM information_schema.schemata ORDER BY schema_name;")
	if err != nil {
		return nil, fmt.Errorf("SHOW DATABASES failed: %w", err)
	}
	dbs := []DatabaseInfo{}
	for _, line := range strings.Split(out, "\n") {
		line = strings.TrimRight(line, "\r")
		parts := strings.SplitN(line, "\t", 3)
		if len(parts) < 3 {
			continue
		}
		name := strings.TrimSpace(parts[0])
		if name == "" {
			continue
		}
		dbs = append(dbs, DatabaseInfo{
			Name:      name,
			Charset:   strings.TrimSpace(parts[1]),
			Collation: strings.TrimSpace(parts[2]),
		})
	}
	return dbs, nil
}

func CreateDatabase(name string) error {
	_, err := mysqlCLI("-e", fmt.Sprintf("CREATE DATABASE `%s`;", name))
	if err != nil {
		return fmt.Errorf("CREATE DATABASE failed: %w", err)
	}
	return nil
}

func DropDatabase(name string) error {
	if IsSystemDatabase(name) {
		return fmt.Errorf("cannot drop system database: %s", name)
	}
	_, err := mysqlCLI("-e", fmt.Sprintf("DROP DATABASE `%s`;", name))
	if err != nil {
		return fmt.Errorf("DROP DATABASE failed: %w", err)
	}
	return nil
}
