package storage

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/AdelysAlberto/cogni/internal/core"
)

func TestStorageCRUD(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "cogni-test-*")
	if err != nil {
		t.Fatalf("Failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tmpDir)

	dbPath := filepath.Join(tmpDir, "test_memory.db")
	s, err := New(dbPath)
	if err != nil {
		t.Fatalf("Failed to initialize storage: %v", err)
	}
	defer s.Close()

	// 1. Save
	mem := &core.Memory{
		ProjectName:      "test-app",
		Category:         "testing",
		Title:            "Unit Testing Core",
		SummarySignature: "Test signature for sqlite CRUD functionality.",
		Tags:             "test-app,unit-test,sqlite",
	}

	saved, err := s.SaveMemory(mem)
	if err != nil {
		t.Fatalf("Failed to save memory: %v", err)
	}
	if saved.ID <= 0 {
		t.Errorf("Expected positive ID, got %d", saved.ID)
	}

	// 2. Search
	results, err := s.SearchMemories("test-app", "CRUD", "", 10)
	if err != nil {
		t.Fatalf("Search failed: %v", err)
	}
	if len(results) == 0 {
		t.Errorf("Expected at least 1 search result, got 0")
	}

	// 3. Update
	updated, err := s.UpdateMemory(saved.ID, "Unit Testing Core V2", "Updated signature", "testing", "test-app,sqlite")
	if err != nil {
		t.Fatalf("Update failed: %v", err)
	}
	if updated.Title != "Unit Testing Core V2" {
		t.Errorf("Expected updated title, got %s", updated.Title)
	}

	// 4. Stats
	stats, err := s.GetStats()
	if err != nil {
		t.Fatalf("Stats failed: %v", err)
	}
	if stats.TotalMemories != 1 {
		t.Errorf("Expected 1 memory in stats, got %d", stats.TotalMemories)
	}

	// 5. Delete
	deleted, err := s.DeleteMemory(saved.ID)
	if err != nil || !deleted {
		t.Fatalf("Delete failed: %v", err)
	}

	// 6. Verify Deleted
	afterDel, err := s.GetMemoryByID(saved.ID)
	if err != nil {
		t.Fatalf("Get after delete failed: %v", err)
	}
	if afterDel != nil {
		t.Errorf("Expected nil memory after deletion, got %+v", afterDel)
	}
}
