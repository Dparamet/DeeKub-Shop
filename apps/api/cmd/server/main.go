package main

import (
	"log"
	"os"

	"deekub-api/internal/httpapi"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	if err := httpapi.NewRouter().Run(":" + port); err != nil {
		log.Fatal(err)
	}
}
