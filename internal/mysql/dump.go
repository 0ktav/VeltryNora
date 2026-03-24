package mysql

import (
	"bytes"
	"fmt"
	"nginxpanel/internal/winexec"
	"os"
	"path/filepath"
)

// ExportDatabase exports a database as a SQL dump to destPath using mysqldump.
func ExportDatabase(database, destPath string) error {
	exe := filepath.Join(binDir(), "mysqldump.exe")
	args := []string{"-u", "root", "--protocol=TCP"}
	if pass := GetRootPassword(); pass != "" {
		args = append(args, "-p"+pass)
	}
	args = append(args, database)

	f, err := os.Create(destPath)
	if err != nil {
		return fmt.Errorf("cannot create file: %w", err)
	}

	var stderr bytes.Buffer
	cmd := winexec.Command(exe, args...)
	cmd.Stdout = f
	cmd.Stderr = &stderr
	runErr := cmd.Run()
	f.Close()

	if runErr != nil {
		os.Remove(destPath)
		if msg := extractMySQLError(stderr.String()); msg != "" {
			return fmt.Errorf("%s", msg)
		}
		return fmt.Errorf("mysqldump failed: %w", runErr)
	}
	return nil
}

// ImportDatabase imports a SQL dump file into the given database.
func ImportDatabase(database, srcPath string) error {
	exe := filepath.Join(binDir(), "mysql.exe")
	args := []string{"-u", "root", "--protocol=TCP"}
	if pass := GetRootPassword(); pass != "" {
		args = append(args, "-p"+pass)
	}
	args = append(args, database)

	f, err := os.Open(srcPath)
	if err != nil {
		return fmt.Errorf("cannot open file: %w", err)
	}
	defer f.Close()

	var stderr bytes.Buffer
	cmd := winexec.Command(exe, args...)
	cmd.Stdin = f
	cmd.Stderr = &stderr
	if err := cmd.Run(); err != nil {
		if msg := extractMySQLError(stderr.String()); msg != "" {
			return fmt.Errorf("%s", msg)
		}
		return fmt.Errorf("import failed: %w", err)
	}
	return nil
}
