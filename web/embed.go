package web

import (
	"embed"
	"io/fs"
	"net/http"
)

//go:embed public/*
var publicFS embed.FS

// GetFileSystem returns the embedded filesystem rooted at public/
func GetFileSystem() (http.FileSystem, error) {
	sub, err := fs.Sub(publicFS, "public")
	if err != nil {
		return nil, err
	}
	return http.FS(sub), nil
}
