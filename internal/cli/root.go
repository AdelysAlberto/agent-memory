package cli

import (
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/AdelysAlberto/cogni/internal/core"
	"github.com/AdelysAlberto/cogni/internal/server"
	"github.com/AdelysAlberto/cogni/internal/storage"
)

const Version = "2.0.0 (Go Core)"

func Execute(args []string) int {
	if len(args) < 1 {
		printUsage()
		return 0
	}

	cmd := args[0]
	cmdArgs := args[1:]

	switch cmd {
	case "init":
		return handleInit(cmdArgs)
	case "save":
		return handleSave(cmdArgs)
	case "search":
		return handleSearch(cmdArgs)
	case "update":
		return handleUpdate(cmdArgs)
	case "remove", "delete":
		return handleRemove(cmdArgs)
	case "share", "export":
		return handleShare(cmdArgs)
	case "list":
		return handleList(cmdArgs)
	case "stats":
		return handleStats(cmdArgs)
	case "ui":
		return handleUI(cmdArgs)
	case "uninstall":
		return handleUninstall(cmdArgs)
	case "version", "--version", "-v":
		fmt.Printf("🧠 Cogni %s\n", Version)
		return 0
	case "help", "--help", "-h":
		printUsage()
		return 0
	default:
		fmt.Fprintf(os.Stderr, "Comando desconocido: %s\n\n", cmd)
		printUsage()
		return 1
	}
}

func printUsage() {
	usage := `🧠 Cogni — Cognitive Omniscient Grid for Networked Intelligence
Sistema de memoria y firmas semánticas para agentes de Inteligencia Artificial

Uso:
  cogni <comando> [argumentos...]

Comandos Principales:
  init        Inicializa el directorio local .cogni/ en el proyecto actual
  save        Guarda una firma de memoria sintética
  search      Busca firmas de memoria con FTS5
  update      Actualiza una memoria existente por su ID
  remove      Elimina una memoria por su ID
  share       Exporta o comparte firmas de memoria (Markdown / JSON)
  list        Lista las memorias registradas
  stats       Muestra métricas y tokens ahorrados
  ui          Abre el dashboard gráfico interactivo en el navegador
  uninstall   Desinstala Cogni, elimina el binario y limpia las skills
  version     Muestra la versión de Cogni

Flags Globales:
  --global  Fuerza el uso de la base de datos global (~/.cogni/memory.db)
  --db      Ruta personalizada al archivo SQLite
  --json    Imprime la salida en formato JSON puro

Ejemplos:
  cogni init
  cogni save --title "Auth JWT" --summary "Firma sintética..." --category auth --tags "jwt,tokens"
  cogni search --query "jwt"
  cogni update --id 6 --summary "Nueva firma..."
  cogni remove --id 6
  cogni share --format markdown > memories.md
  cogni ui
`
	fmt.Print(usage)
}

func getStorage(customPath string, forceGlobal bool) (*storage.Storage, error) {
	dbPath := core.ResolveDatabasePath(customPath, forceGlobal)
	return storage.New(dbPath)
}

func handleInit(args []string) int {
	fs := flag.NewFlagSet("init", flag.ExitOnError)
	forceGlobal := fs.Bool("global", false, "Inicializa la base de datos global en ~/.cogni")
	_ = fs.Parse(args)

	if *forceGlobal {
		dir := core.GetGlobalCogniDir()
		if err := os.MkdirAll(dir, 0755); err != nil {
			fmt.Fprintf(os.Stderr, "Error creando directorio global: %v\n", err)
			return 1
		}
		dbPath := filepath.Join(dir, "memory.db")
		s, err := storage.New(dbPath)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error inicializando base de datos global: %v\n", err)
			return 1
		}
		s.Close()
		fmt.Printf("✅ Cogni global inicializado en: %s\n", dbPath)
		return 0
	}

	localDir := filepath.Join(".", ".cogni")
	if err := os.MkdirAll(localDir, 0755); err != nil {
		fmt.Fprintf(os.Stderr, "Error creando directorio .cogni: %v\n", err)
		return 1
	}

	dbPath := filepath.Join(localDir, "memory.db")
	s, err := storage.New(dbPath)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error inicializando base de datos local: %v\n", err)
		return 1
	}
	s.Close()

	// Add .cogni/memory.db to .gitignore recommendation
	fmt.Printf("✅ Cogni local inicializado en: %s\n", dbPath)
	fmt.Printf("💡 Proyecto detectado: %s\n", core.DetectProjectName())
	return 0
}

func handleSave(args []string) int {
	fs := flag.NewFlagSet("save", flag.ExitOnError)
	project := fs.String("project", "", "Nombre del proyecto")
	title := fs.String("title", "", "Título o hito de la memoria")
	summary := fs.String("summary", "", "Resumen sintético de la memoria")
	category := fs.String("category", "general", "Categoría")
	tags := fs.String("tags", "", "Tags separados por coma")
	global := fs.Bool("global", false, "Guardar en la base de datos global")
	dbPath := fs.String("db", "", "Ruta personalizada a la base de datos")
	asJSON := fs.Bool("json", false, "Salida en JSON")

	_ = fs.Parse(args)

	if *title == "" || *summary == "" {
		fmt.Fprintln(os.Stderr, "Error: --title y --summary son obligatorios.")
		return 1
	}

	projectName := *project
	if projectName == "" {
		projectName = core.DetectProjectName()
	}

	formattedTags := core.FormatTags(*tags, projectName)

	s, err := getStorage(*dbPath, *global)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error conectando a BD: %v\n", err)
		return 1
	}
	defer s.Close()

	m := &core.Memory{
		ProjectName:      projectName,
		Category:         *category,
		Title:            *title,
		SummarySignature: *summary,
		Tags:             formattedTags,
	}

	saved, err := s.SaveMemory(m)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error guardando memoria: %v\n", err)
		return 1
	}

	if *asJSON {
		_ = json.NewEncoder(os.Stdout).Encode(saved)
	} else {
		fmt.Println("💾 **Memoria Guardada con Éxito**")
		fmt.Printf("ID: #%d\n", saved.ID)
		fmt.Printf("Proyecto: [%s]\n", saved.ProjectName)
		fmt.Printf("Título: %s\n", saved.Title)
		fmt.Printf("Categoría: %s\n", saved.Category)
		fmt.Printf("Tags: %s\n", saved.Tags)
		fmt.Printf("Ubicación BD: %s\n", s.DBPath())
	}

	return 0
}

func handleSearch(args []string) int {
	fs := flag.NewFlagSet("search", flag.ExitOnError)
	query := fs.String("query", "", "Término de búsqueda")
	project := fs.String("project", "", "Filtrar por proyecto")
	category := fs.String("category", "", "Filtrar por categoría")
	limit := fs.Int("limit", 10, "Límite de resultados")
	global := fs.Bool("global", false, "Buscar en la base de datos global")
	dbPath := fs.String("db", "", "Ruta a la base de datos")
	asJSON := fs.Bool("json", false, "Salida en JSON")

	_ = fs.Parse(args)

	// If query was passed positionally without --query
	if *query == "" && len(fs.Args()) > 0 {
		*query = strings.Join(fs.Args(), " ")
	}

	s, err := getStorage(*dbPath, *global)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error conectando a BD: %v\n", err)
		return 1
	}
	defer s.Close()

	projectName := *project
	if projectName == "" && !*global {
		projectName = core.DetectProjectName()
	}

	results, err := s.SearchMemories(projectName, *query, *category, *limit)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error en búsqueda: %v\n", err)
		return 1
	}

	if *asJSON {
		if results == nil {
			results = []core.Memory{}
		}
		_ = json.NewEncoder(os.Stdout).Encode(results)
		return 0
	}

	if len(results) == 0 {
		fmt.Println("🔍 No se encontraron firmas de memoria coincidentes.")
		return 0
	}

	fmt.Printf("🔍 Se encontraron %d memoria(s):\n\n", len(results))
	for _, m := range results {
		fmt.Printf("━━━ [#%d] [%s] %s ━━━\n", m.ID, m.ProjectName, m.Title)
		fmt.Printf("🏷️ Tags: %s | 📂 Categoría: %s\n", m.Tags, m.Category)
		fmt.Printf("📝 %s\n\n", m.SummarySignature)
	}

	return 0
}

func handleUpdate(args []string) int {
	fs := flag.NewFlagSet("update", flag.ExitOnError)
	id := fs.Int64("id", 0, "ID de la memoria a actualizar")
	title := fs.String("title", "", "Nuevo título")
	summary := fs.String("summary", "", "Nuevo resumen")
	category := fs.String("category", "", "Nueva categoría")
	tags := fs.String("tags", "", "Nuevos tags")
	global := fs.Bool("global", false, "Base de datos global")
	dbPath := fs.String("db", "", "Ruta a BD")
	asJSON := fs.Bool("json", false, "Salida en JSON")

	_ = fs.Parse(args)

	if *id <= 0 {
		fmt.Fprintln(os.Stderr, "Error: --id es obligatorio para actualizar.")
		return 1
	}

	s, err := getStorage(*dbPath, *global)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error conectando a BD: %v\n", err)
		return 1
	}
	defer s.Close()

	updated, err := s.UpdateMemory(*id, *title, *summary, *category, *tags)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error actualizando memoria: %v\n", err)
		return 1
	}

	if *asJSON {
		_ = json.NewEncoder(os.Stdout).Encode(updated)
	} else {
		fmt.Printf("✅ Memoria #%d actualizada con éxito.\n", updated.ID)
	}

	return 0
}

func handleRemove(args []string) int {
	fs := flag.NewFlagSet("remove", flag.ExitOnError)
	id := fs.Int64("id", 0, "ID de la memoria a eliminar")
	global := fs.Bool("global", false, "Base de datos global")
	dbPath := fs.String("db", "", "Ruta a BD")

	_ = fs.Parse(args)

	// Fallback to positional argument for ID
	if *id <= 0 && len(fs.Args()) > 0 {
		parsed, _ := strconv.ParseInt(fs.Args()[0], 10, 64)
		*id = parsed
	}

	if *id <= 0 {
		fmt.Fprintln(os.Stderr, "Error: Especifica el ID de la memoria a eliminar (ej. cogni remove --id 6).")
		return 1
	}

	s, err := getStorage(*dbPath, *global)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error conectando a BD: %v\n", err)
		return 1
	}
	defer s.Close()

	deleted, err := s.DeleteMemory(*id)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error eliminando memoria: %v\n", err)
		return 1
	}

	if !deleted {
		fmt.Fprintf(os.Stderr, "Memoria #%d no encontrada.\n", *id)
		return 1
	}

	fmt.Printf("🗑️ Memoria #%d eliminada correctamente.\n", *id)
	return 0
}

func handleShare(args []string) int {
	fs := flag.NewFlagSet("share", flag.ExitOnError)
	project := fs.String("project", "", "Filtrar por proyecto")
	format := fs.String("format", "markdown", "Formato de exportación (markdown, json)")
	global := fs.Bool("global", false, "Base de datos global")
	dbPath := fs.String("db", "", "Ruta a BD")

	_ = fs.Parse(args)

	s, err := getStorage(*dbPath, *global)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error conectando a BD: %v\n", err)
		return 1
	}
	defer s.Close()

	projectName := *project
	if projectName == "" && !*global {
		projectName = core.DetectProjectName()
	}

	memories, err := s.ListMemories(projectName, "", 500, 0)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error listando memorias: %v\n", err)
		return 1
	}

	if *format == "json" {
		if memories == nil {
			memories = []core.Memory{}
		}
		_ = json.NewEncoder(os.Stdout).Encode(memories)
		return 0
	}

	// Markdown Export
	fmt.Printf("# 🧠 Cogni Memory Export — Proyecto: %s\n\n", projectName)
	fmt.Printf("*Total de firmas: %d*\n\n---\n\n", len(memories))

	for _, m := range memories {
		fmt.Printf("### [%s] %s (#%d)\n", m.ProjectName, m.Title, m.ID)
		fmt.Printf("> **Categoría**: `%s` | **Tags**: `%s` | **Fecha**: %s\n\n", m.Category, m.Tags, m.CreatedAt.Format("2006-01-02 15:04"))
		fmt.Printf("%s\n\n---\n\n", m.SummarySignature)
	}

	return 0
}

func handleList(args []string) int {
	fs := flag.NewFlagSet("list", flag.ExitOnError)
	project := fs.String("project", "", "Filtrar por proyecto")
	category := fs.String("category", "", "Filtrar por categoría")
	limit := fs.Int("limit", 50, "Límite")
	global := fs.Bool("global", false, "Base de datos global")
	dbPath := fs.String("db", "", "Ruta a BD")
	asJSON := fs.Bool("json", false, "Salida en JSON")

	_ = fs.Parse(args)

	s, err := getStorage(*dbPath, *global)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error conectando a BD: %v\n", err)
		return 1
	}
	defer s.Close()

	projectName := *project
	if projectName == "" && !*global {
		projectName = core.DetectProjectName()
	}

	memories, err := s.ListMemories(projectName, *category, *limit, 0)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error listando: %v\n", err)
		return 1
	}

	if *asJSON {
		if memories == nil {
			memories = []core.Memory{}
		}
		_ = json.NewEncoder(os.Stdout).Encode(memories)
		return 0
	}

	fmt.Printf("📋 Listado de memorias en [%s] (%d):\n\n", projectName, len(memories))
	for _, m := range memories {
		fmt.Printf("• [#%d] [%s] %s (%s)\n  %s\n\n", m.ID, m.ProjectName, m.Title, m.Category, m.SummarySignature)
	}

	return 0
}

func handleStats(args []string) int {
	fs := flag.NewFlagSet("stats", flag.ExitOnError)
	global := fs.Bool("global", false, "Base de datos global")
	dbPath := fs.String("db", "", "Ruta a BD")
	asJSON := fs.Bool("json", false, "Salida en JSON")

	_ = fs.Parse(args)

	s, err := getStorage(*dbPath, *global)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error conectando a BD: %v\n", err)
		return 1
	}
	defer s.Close()

	stats, err := s.GetStats()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error consultando estadísticas: %v\n", err)
		return 1
	}

	if *asJSON {
		_ = json.NewEncoder(os.Stdout).Encode(stats)
		return 0
	}

	fmt.Println("📊 Estadísticas de Memoria en Cogni:")
	fmt.Printf("• Total de Memorias: %d\n", stats.TotalMemories)
	fmt.Printf("• Total de Proyectos: %d\n", stats.TotalProjects)
	fmt.Printf("• Tokens Ahorrados Estimados: ~%d tokens\n", stats.EstimatedTokensSaved)
	fmt.Printf("• Base de Datos: %s\n", s.DBPath())

	return 0
}

func handleUI(args []string) int {
	fs := flag.NewFlagSet("ui", flag.ExitOnError)
	port := fs.Int("port", 3000, "Puerto inicial para el servidor HTTP")
	host := fs.String("host", "127.0.0.1", "Host para el servidor HTTP")
	noBrowser := fs.Bool("no-browser", false, "No abrir el navegador automáticamente")
	global := fs.Bool("global", false, "Usar base de datos global")
	dbPath := fs.String("db", "", "Ruta a BD")

	_ = fs.Parse(args)

	s, err := getStorage(*dbPath, *global)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error inicializando base de datos: %v\n", err)
		return 1
	}
	defer s.Close()

	srv := server.New(s, *host, *port)
	if _, err := srv.Start(!*noBrowser); err != nil {
		fmt.Fprintf(os.Stderr, "Error iniciando servidor UI: %v\n", err)
		return 1
	}

	return 0
}

func handleUninstall(args []string) int {
	fs := flag.NewFlagSet("uninstall", flag.ExitOnError)
	purgeDB := fs.Bool("purge-db", false, "Eliminar también las bases de datos globales en ~/.cogni")
	force := fs.Bool("yes", false, "Omitir confirmación interactiva")

	_ = fs.Parse(args)

	home, err := os.UserHomeDir()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error obteniendo directorio home: %v\n", err)
		return 1
	}

	fmt.Println("🗑️ Desinstalando Cogni...")

	// 1. Remove binary
	binPath := filepath.Join(home, ".local", "bin", "cogni")
	if _, err := os.Stat(binPath); err == nil {
		_ = os.Remove(binPath)
		fmt.Printf("  -> Binario eliminado: %s\n", binPath)
	}

	// 2. Remove skills from AI harnesses
	skillPaths := []string{
		filepath.Join(home, ".gemini", "config", "skills", "cogni"),
		filepath.Join(home, ".gemini", "config", "skills", "agent-memory"),
		filepath.Join(home, ".cursor", "skills", "cogni"),
		filepath.Join(home, ".cursor", "skills", "agent-memory"),
		filepath.Join(home, ".config", "opencode", "skills", "cogni"),
		filepath.Join(home, ".agents", "skills", "cogni"),
		filepath.Join(home, ".copilot", "skills", "cogni"),
		filepath.Join(home, ".hermes", "skills", "cogni"),
	}

	for _, p := range skillPaths {
		if _, err := os.Stat(p); err == nil {
			_ = os.RemoveAll(p)
			fmt.Printf("  -> Skill eliminada: %s\n", p)
		}
	}

	// 3. Purge DB if requested or confirmed
	if *purgeDB {
		cogniDir := filepath.Join(home, ".cogni")
		_ = os.RemoveAll(cogniDir)
		fmt.Printf("  -> Base de datos global eliminada: %s\n", cogniDir)
	} else if !*force {
		fmt.Println("\n💡 Nota: Las bases de datos en ~/.cogni/ se conservaron.")
		fmt.Println("   Para eliminarlas ejecuta: cogni uninstall --purge-db")
	}

	fmt.Println("✅ Desinstalación de Cogni completada con éxito.")
	return 0
}
