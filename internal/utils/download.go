package utils

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
)

func Download(url string, destPath string, onProgress func(int)) error {
	resp, err := http.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("download failed: HTTP %d for %s", resp.StatusCode, url)
	}

	err = os.MkdirAll(filepath.Dir(destPath), 0755)
	if err != nil {
		return err
	}

	file, err := os.Create(destPath)
	if err != nil {
		return err
	}
	defer file.Close()

	totalSize := resp.ContentLength
	var downloaded int64
	buffer := make([]byte, 32*1024)

	for {
		n, err := resp.Body.Read(buffer)
		if n > 0 {
			if _, err := file.Write(buffer[:n]); err != nil {
				return err
			}
			downloaded += int64(n)
			if totalSize > 0 {
				percent := int(downloaded * 100 / totalSize)
				onProgress(percent)
			}
		}
		if err != nil {
			if err == io.EOF {
				break
			}
			return err
		}
	}

	return nil
}
