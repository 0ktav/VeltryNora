package mysql

import (
	"fmt"
	"nginxpanel/internal/system"
	"os"
	"path/filepath"
	"strings"
)

// systemMySQLUsers lists built-in MySQL accounts that are hidden from the UI.
var systemMySQLUsers = map[string]bool{
	"mysql.sys":        true,
	"mysql.infoschema": true,
	"mysql.session":    true,
}

// MySQLUser represents a MySQL user account.
type MySQLUser struct {
	User        string `json:"user"`
	Host        string `json:"host"`
	HasPassword bool   `json:"hasPassword"`
}

// rootPassPath returns the path to the locally stored root password file.
func rootPassPath() string {
	return filepath.Join(system.GetBasePath(), "mysql", "root_pass.txt")
}

// GetRootPassword reads the stored root password. Returns "" if not set.
func GetRootPassword() string {
	data, err := os.ReadFile(rootPassPath())
	if err != nil {
		return ""
	}
	return strings.TrimSpace(string(data))
}

func saveRootPassword(password string) error {
	if password == "" {
		os.Remove(rootPassPath())
		return nil
	}
	return os.WriteFile(rootPassPath(), []byte(password), 0600)
}

// escapeSQL escapes single quotes and backslashes for MySQL string literals.
func escapeSQL(s string) string {
	s = strings.ReplaceAll(s, "\\", "\\\\")
	s = strings.ReplaceAll(s, "'", "\\'")
	return s
}

// GetUsers returns all non-system MySQL user accounts.
func GetUsers() ([]MySQLUser, error) {
	// Use IF() to get a clean 0/1 instead of the raw authentication_string (binary-safe).
	out, err := mysqlCLI("-e", "SELECT user, host, IF(authentication_string='','0','1') FROM mysql.user ORDER BY user, host;")
	if err != nil {
		return nil, fmt.Errorf("SELECT users failed: %w", err)
	}
	users := []MySQLUser{}
	for _, line := range strings.Split(out, "\n") {
		line = strings.TrimRight(line, "\r")
		parts := strings.SplitN(line, "\t", 3)
		if len(parts) < 3 {
			continue
		}
		user := strings.TrimSpace(parts[0])
		host := strings.TrimSpace(parts[1])
		hasPass := strings.TrimSpace(parts[2]) == "1"
		if user == "" || systemMySQLUsers[user] {
			continue
		}
		users = append(users, MySQLUser{
			User:        user,
			Host:        host,
			HasPassword: hasPass,
		})
	}
	return users, nil
}

// CreateUser creates a new MySQL user with the given credentials.
func CreateUser(username, host, password string) error {
	q := fmt.Sprintf("CREATE USER '%s'@'%s' IDENTIFIED BY '%s';",
		escapeSQL(username), escapeSQL(host), escapeSQL(password))
	_, err := mysqlCLI("-e", q)
	if err != nil {
		return fmt.Errorf("CREATE USER failed: %w", err)
	}
	return nil
}

// DropUser removes a MySQL user account.
func DropUser(username, host string) error {
	q := fmt.Sprintf("DROP USER '%s'@'%s';", escapeSQL(username), escapeSQL(host))
	_, err := mysqlCLI("-e", q)
	if err != nil {
		return fmt.Errorf("DROP USER failed: %w", err)
	}
	return nil
}

// SetUserPassword changes the password for a MySQL user.
// For the root user, it also persists the new password locally so future CLI calls authenticate correctly.
func SetUserPassword(username, host, password string) error {
	q := fmt.Sprintf("ALTER USER '%s'@'%s' IDENTIFIED BY '%s'; FLUSH PRIVILEGES;",
		escapeSQL(username), escapeSQL(host), escapeSQL(password))
	_, err := mysqlCLI("-e", q)
	if err != nil {
		return fmt.Errorf("ALTER USER failed: %w", err)
	}
	if username == "root" {
		return saveRootPassword(password)
	}
	return nil
}

// GetUserGrants returns the list of databases the user has explicit grants on.
func GetUserGrants(username, host string) ([]string, error) {
	out, err := mysqlCLI("-e", fmt.Sprintf("SHOW GRANTS FOR '%s'@'%s';",
		escapeSQL(username), escapeSQL(host)))
	if err != nil {
		return nil, fmt.Errorf("SHOW GRANTS failed: %w", err)
	}
	dbs := []string{}
	for _, line := range strings.Split(out, "\n") {
		line = strings.TrimRight(line, "\r")
		line = strings.TrimSpace(line)
		upper := strings.ToUpper(line)
		if !strings.Contains(upper, " ON ") {
			continue
		}
		// Find the object after ON
		onIdx := strings.Index(upper, " ON ")
		afterOn := strings.TrimSpace(line[onIdx+4:])
		// Skip global grants (*.*)
		if strings.HasPrefix(afterOn, "*") {
			continue
		}
		// Extract db name: `dbname`.* TO ...
		dotIdx := strings.Index(afterOn, ".")
		if dotIdx < 0 {
			continue
		}
		dbName := strings.Trim(afterOn[:dotIdx], "`")
		if dbName != "" && dbName != "*" {
			dbs = append(dbs, dbName)
		}
	}
	return dbs, nil
}

// GrantDatabase grants all privileges on a database to a user.
func GrantDatabase(username, host, database string) error {
	q := fmt.Sprintf("GRANT ALL PRIVILEGES ON `%s`.* TO '%s'@'%s'; FLUSH PRIVILEGES;",
		escapeSQL(database), escapeSQL(username), escapeSQL(host))
	_, err := mysqlCLI("-e", q)
	if err != nil {
		return fmt.Errorf("GRANT failed: %w", err)
	}
	return nil
}

// RevokeDatabase revokes all privileges on a database from a user.
func RevokeDatabase(username, host, database string) error {
	q := fmt.Sprintf("REVOKE ALL PRIVILEGES ON `%s`.* FROM '%s'@'%s'; FLUSH PRIVILEGES;",
		escapeSQL(database), escapeSQL(username), escapeSQL(host))
	_, err := mysqlCLI("-e", q)
	if err != nil {
		return fmt.Errorf("REVOKE failed: %w", err)
	}
	return nil
}
