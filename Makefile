.PHONY: build install test run clean

BINARY_NAME=cogni
INSTALL_DIR=$(HOME)/.local/bin

build:
	@mkdir -p bin
	go build -ldflags="-s -w" -o bin/$(BINARY_NAME) ./cmd/cogni
	@echo "✅ Binario compilado en bin/$(BINARY_NAME)"

install: build
	@mkdir -p $(INSTALL_DIR)
	cp bin/$(BINARY_NAME) $(INSTALL_DIR)/$(BINARY_NAME)
	chmod +x $(INSTALL_DIR)/$(BINARY_NAME)
	@echo "✅ Instalado globalmente en $(INSTALL_DIR)/$(BINARY_NAME)"

test:
	go test -v ./...

run:
	go run ./cmd/cogni ui

clean:
	rm -rf bin/
