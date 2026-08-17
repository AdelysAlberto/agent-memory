package server

import (
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"os/exec"
	"runtime"
	"strconv"
	"strings"
	"time"

	"github.com/AdelysAlberto/cogni/internal/core"
	"github.com/AdelysAlberto/cogni/internal/storage"
	"github.com/AdelysAlberto/cogni/web"
)

type Server struct {
	storage *storage.Storage
	host    string
	port    int
	srv     *http.Server
}

func New(s *storage.Storage, host string, port int) *Server {
	if host == "" {
		host = "127.0.0.1"
	}
	if port <= 0 {
		port = 3000
	}
	return &Server{
		storage: s,
		host:    host,
		port:    port,
	}
}

// Start launches the HTTP server with automatic port recovery if target port is in use
func (s *Server) Start(openBrowser bool) (string, error) {
	mux := http.NewServeMux()

	// 1. Register API Handlers
	mux.HandleFunc("/api/stats", s.handleStats)
	mux.HandleFunc("/api/projects", s.handleProjects)
	mux.HandleFunc("/api/memories", s.handleMemories)
	mux.HandleFunc("/api/memories/", s.handleMemoryByID)

	// 2. Register Embedded Static Web Files
	fs, err := web.GetFileSystem()
	if err != nil {
		return "", fmt.Errorf("failed to load embedded UI filesystem: %w", err)
	}
	fileServer := http.FileServer(fs)

	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// Avoid directory listing, fallback to index
		if r.URL.Path == "/" || !strings.Contains(r.URL.Path, ".") {
			r.URL.Path = "/"
		}
		fileServer.ServeHTTP(w, r)
	})

	// Wrap with security middleware
	handler := s.securityMiddleware(mux)

	// Dynamic Port Finding to prevent EADDRINUSE
	listener, finalPort, err := findAvailableListener(s.host, s.port)
	if err != nil {
		return "", fmt.Errorf("could not find available port: %w", err)
	}
	s.port = finalPort

	s.srv = &http.Server{
		Handler:      handler,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
	}

	url := fmt.Sprintf("http://%s:%d", s.host, s.port)
	fmt.Printf("\n🧠 [Cogni] Dashboard iniciado con éxito en: %s\n", url)
	fmt.Printf("📂 Base de datos activa: %s\n", s.storage.DBPath())
	fmt.Println("Presiona Ctrl+C para detener el servidor.")
	fmt.Println()

	if openBrowser {
		go openBrowserURL(url)
	}

	return url, s.srv.Serve(listener)
}

// findAvailableListener scans starting from desiredPort to find an open TCP port
func findAvailableListener(host string, startPort int) (net.Listener, int, error) {
	for p := startPort; p < startPort+50; p++ {
		addr := fmt.Sprintf("%s:%d", host, p)
		l, err := net.Listen("tcp", addr)
		if err == nil {
			return l, p, nil
		}
	}
	// Fallback to random dynamic port
	l, err := net.Listen("tcp", fmt.Sprintf("%s:0", host))
	if err != nil {
		return nil, 0, err
	}
	addr := l.Addr().(*net.TCPAddr)
	return l, addr.Port, nil
}

func openBrowserURL(url string) {
	time.Sleep(200 * time.Millisecond)
	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "darwin":
		cmd = exec.Command("open", url)
	case "windows":
		cmd = exec.Command("rundll32", "url.dll,FileProtocolHandler", url)
	default:
		cmd = exec.Command("xdg-open", url)
	}
	_ = cmd.Start()
}

func (s *Server) securityMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		hostHeader := r.Host
		if strings.Contains(hostHeader, ":") {
			hostHeader = strings.Split(hostHeader, ":")[0]
		}

		// Prevent DNS Rebinding & Host header attacks
		if s.host == "127.0.0.1" && hostHeader != "localhost" && hostHeader != "127.0.0.1" && hostHeader != "" {
			http.Error(w, "Acceso denegado: Host no autorizado.", http.StatusForbidden)
			return
		}

		// CORS validation
		origin := r.Header.Get("Origin")
		if origin != "" {
			if strings.HasPrefix(origin, "http://localhost") || strings.HasPrefix(origin, "http://127.0.0.1") {
				w.Header().Set("Access-Control-Allow-Origin", origin)
				w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
				w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
			} else {
				http.Error(w, `{"error":"CORS no autorizado"}`, http.StatusForbidden)
				return
			}
		}

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func (s *Server) handleStats(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	stats, err := s.storage.GetStats()
	if err != nil {
		sendJSON(w, map[string]string{"error": err.Error()}, http.StatusInternalServerError)
		return
	}
	sendJSON(w, stats, http.StatusOK)
}

func (s *Server) handleProjects(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	projects, err := s.storage.GetProjects()
	if err != nil {
		sendJSON(w, map[string]string{"error": err.Error()}, http.StatusInternalServerError)
		return
	}
	sendJSON(w, projects, http.StatusOK)
}

func (s *Server) handleMemories(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		query := r.URL.Query().Get("query")
		project := r.URL.Query().Get("project")
		category := r.URL.Query().Get("category")
		limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
		if limit <= 0 {
			limit = 50
		}

		var memories []core.Memory
		var err error
		if query != "" {
			memories, err = s.storage.SearchMemories(project, query, category, limit)
		} else {
			memories, err = s.storage.ListMemories(project, category, limit, 0)
		}

		if err != nil {
			sendJSON(w, map[string]string{"error": err.Error()}, http.StatusInternalServerError)
			return
		}
		if memories == nil {
			memories = []core.Memory{}
		}
		sendJSON(w, memories, http.StatusOK)

	case http.MethodPost:
		var m core.Memory
		if err := json.NewDecoder(r.Body).Decode(&m); err != nil {
			sendJSON(w, map[string]string{"error": "Payload JSON inválido"}, http.StatusBadRequest)
			return
		}

		if strings.TrimSpace(m.Title) == "" || strings.TrimSpace(m.SummarySignature) == "" {
			sendJSON(w, map[string]string{"error": "Campos 'title' y 'summary_signature' son obligatorios"}, http.StatusBadRequest)
			return
		}

		if m.ProjectName == "" {
			m.ProjectName = "general"
		}
		if m.Category == "" {
			m.Category = "general"
		}
		m.Tags = core.FormatTags(m.Tags, m.ProjectName)

		saved, err := s.storage.SaveMemory(&m)
		if err != nil {
			sendJSON(w, map[string]string{"error": err.Error()}, http.StatusInternalServerError)
			return
		}
		sendJSON(w, saved, http.StatusCreated)

	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func (s *Server) handleMemoryByID(w http.ResponseWriter, r *http.Request) {
	idStr := strings.TrimPrefix(r.URL.Path, "/api/memories/")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil || id <= 0 {
		sendJSON(w, map[string]string{"error": "ID de memoria inválido"}, http.StatusBadRequest)
		return
	}

	switch r.Method {
	case http.MethodGet:
		mem, err := s.storage.GetMemoryByID(id)
		if err != nil {
			sendJSON(w, map[string]string{"error": err.Error()}, http.StatusInternalServerError)
			return
		}
		if mem == nil {
			sendJSON(w, map[string]string{"error": "Memoria no encontrada"}, http.StatusNotFound)
			return
		}
		sendJSON(w, mem, http.StatusOK)

	case http.MethodPut:
		var body struct {
			Title            string `json:"title"`
			SummarySignature string `json:"summary_signature"`
			Category         string `json:"category"`
			Tags             string `json:"tags"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			sendJSON(w, map[string]string{"error": "Payload JSON inválido"}, http.StatusBadRequest)
			return
		}

		updated, err := s.storage.UpdateMemory(id, body.Title, body.SummarySignature, body.Category, body.Tags)
		if err != nil {
			sendJSON(w, map[string]string{"error": err.Error()}, http.StatusInternalServerError)
			return
		}
		sendJSON(w, updated, http.StatusOK)

	case http.MethodDelete:
		deleted, err := s.storage.DeleteMemory(id)
		if err != nil {
			sendJSON(w, map[string]string{"error": err.Error()}, http.StatusInternalServerError)
			return
		}
		sendJSON(w, map[string]bool{"deleted": deleted}, http.StatusOK)

	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func sendJSON(w http.ResponseWriter, data any, statusCode int) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(data)
}
