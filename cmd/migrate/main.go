package main

import (
	"io/ioutil"
	"log"

	"github.com/Firdaus371/student-voice-api/internal/config"
	_ "github.com/lib/pq"
)

func main() {
	log.Println("🚀 Memulai Migrasi Database...")

	// 1. Buka Koneksi ke Database
	db := config.InitDB()
	defer db.Close()

	// 2. Baca Isi File SQL
	// Pastikan file db.sql ada di folder migrations
	content, err := ioutil.ReadFile("migrations/db.sql")
	if err != nil {
		log.Fatal("❌ Gagal membaca file migrations/db.sql. Cek apakah filenya ada?", err)
	}

	// 3. Jalankan Query SQL
	log.Println("⏳ Sedang mereset tabel dan memasukkan data baru...")
	_, err = db.Exec(string(content))
	if err != nil {
		log.Fatal("❌ Gagal mengeksekusi SQL:", err)
	}

	log.Println("✅ SUKSES! Database berhasil di-update.")
	log.Println("   - Tabel Users (NIM) sudah siap.")
	log.Println("   - Akun Admin & Mahasiswa sudah di-reset.")
}