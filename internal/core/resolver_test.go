package core

import (
	"strings"
	"testing"
)

func TestFormatTags(t *testing.T) {
	tags := FormatTags("auth, jwt, SECURITY, auth", "my-project")
	if !strings.Contains(tags, "my-project") {
		t.Errorf("Expected project tag to be included, got %s", tags)
	}
	if !strings.Contains(tags, "auth") {
		t.Errorf("Expected 'auth' tag, got %s", tags)
	}
	if !strings.Contains(tags, "security") {
		t.Errorf("Expected 'security' tag, got %s", tags)
	}
}

func TestEstimateTokens(t *testing.T) {
	tokens := EstimateTokens("12345678")
	if tokens != 2 {
		t.Errorf("Expected 2 tokens for 8 chars, got %d", tokens)
	}
}
