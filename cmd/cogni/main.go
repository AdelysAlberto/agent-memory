package main

import (
	"os"

	"github.com/AdelysAlberto/cogni/internal/cli"
)

func main() {
	exitCode := cli.Execute(os.Args[1:])
	os.Exit(exitCode)
}
