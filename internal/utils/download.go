package utils

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
)

// Download fetches url to destPath, calling onProgress(percent, totalMB) as data arrives.
// sizeHint provides the total file size when the server omits Content-Length (pass 0 if unknown).
// Cancelling ctx aborts the transfer and returns ctx.Err().
func Download(ctx context.Context, url string, destPath string, sizeHint int64, onProgress func(percent int, totalMB float64)) error {
	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return err
	}
	// Disable automatic gzip — Go sets ContentLength=-1 when it decompresses transparently
	req.Header.Set("Accept-Encoding", "identity")
	resp, err := http.DefaultClient.Do(req)
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
	if totalSize <= 0 && sizeHint > 0 {
		totalSize = sizeHint
	}
	totalMB := float64(totalSize) / 1024 / 1024
	if totalSize <= 0 {
		totalMB = 0
	}
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
				onProgress(percent, totalMB)
			} else {
				downloadedMB := float64(downloaded) / 1024 / 1024
				onProgress(-1, downloadedMB)
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
