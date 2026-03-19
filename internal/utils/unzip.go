package utils

import (
	"archive/zip"
	"io"
	"os"
	"path/filepath"
	"strings"
)

func Unzip(zipPath string, destDir string, stripPrefix string) error {
	r, err := zip.OpenReader(zipPath)
	if err != nil {
		return err
	}

	for _, f := range r.File {
		name := f.Name
		if stripPrefix != "" {
			name = strings.TrimPrefix(name, stripPrefix+"/")
		}
		if name == "" {
			continue
		}

		destPath := filepath.Join(destDir, name)

		if f.FileInfo().IsDir() {
			os.MkdirAll(destPath, 0755)
			continue
		}

		os.MkdirAll(filepath.Dir(destPath), 0755)

		outFile, err := os.Create(destPath)
		if err != nil {
			continue
		}

		rc, err := f.Open()
		if err != nil {
			outFile.Close()
			continue
		}

		if _, err := io.Copy(outFile, rc); err != nil {
			outFile.Close()
			rc.Close()
			return err
		}
		outFile.Close()
		rc.Close()
	}

	r.Close()
	os.Remove(zipPath)
	return nil
}
