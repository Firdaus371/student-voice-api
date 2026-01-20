package main

import (
	"bufio"
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/Firdaus371/student-voice-api/internal/config"
	_ "github.com/lib/pq"
)

func main() {
	// 1. Konek Database
	db := config.InitDB()
	defer db.Close()

	// 2. Minta Input Email
	reader := bufio.NewReader(os.Stdin)
	fmt.Println("==========================================")
	fmt.Println("👑  SCRIPT PENGANGKATAN ADMIN KAMPUS  👑")
	fmt.Println("==========================================")
	fmt.Print("Masukkan Email Mahasiswa yang mau jadi Admin: ")
	
	email, _ := reader.ReadString('\n')
	email = strings.TrimSpace(email) // Hapus spasi/enter

	// 3. Cek apakah user ada?
	var currentRole string
	err := db.QueryRow("SELECT role FROM users WHERE email = $1", email).Scan(&currentRole)
	if err != nil {
		log.Println("\n❌ GAGAL: Email tidak ditemukan di database.")
		return
	}

	if currentRole == "admin" {
		log.Println("\n⚠️  User ini SUDAH menjadi Admin.")
		return
	}

	// 4. Update Role jadi 'admin'
	_, err = db.Exec("UPDATE users SET role = 'admin' WHERE email = $1", email)
	if err != nil {
		log.Fatal("Gagal update:", err)
	}

	fmt.Printf("\n✅ BERHASIL! User '%s' sekarang sudah jadi ADMIN.\n", email)
	fmt.Println("Silakan Logout dan Login ulang untuk melihat Dashboard.")
}