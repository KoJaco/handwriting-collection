package main

import (
	"log"
	"net/http"
	"os"
	"sigma-collection/src/handlers"
)

func main() {
	fs := http.FileServer(http.Dir("./src/static"))
	http.Handle("/static/", http.StripPrefix("/static/", fs))

	http.HandleFunc("/", handlers.RenderTemplate)
	http.HandleFunc("/api/save", handlers.SaveData)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	err := http.ListenAndServe(":"+port, nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}
