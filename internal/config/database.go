package config

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/lib/pq"
)

func InitDB() *sql.DB {
	// Ambil dari ENV (recommended)
	host := getEnv("DB_HOST", "localhost")
	port := getEnv("DB_PORT", "5432")
	user := getEnv("DB_USER", "postgres")
	password := getEnv("DB_PASS", "daus12345")
	dbname := getEnv("DB_NAME", "student_voice")

	psqlInfo := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		host, port, user, password, dbname,
	)

	db, err := sql.Open("postgres", psqlInfo)
	if err != nil {
		log.Fatal("❌ Gagal membuka koneksi DB:", err)
	}

	if err := db.Ping(); err != nil {
		log.Fatal("❌ Database tidak bisa diakses:", err)
	}

	fmt.Println("✅ Database connected")
	return db
}

// helper ambil ENV atau default
func getEnv(key, defaultValue string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return defaultValue
}
