package main

import (
	"log"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"github.com/Firdaus371/student-voice-api/internal/config"
	"github.com/Firdaus371/student-voice-api/internal/handler"
	"github.com/Firdaus371/student-voice-api/internal/repository"
	"github.com/Firdaus371/student-voice-api/internal/routes"
	"github.com/Firdaus371/student-voice-api/internal/service"
)

func main() {
	log.Println("🚀 Starting Student Voice API...")

	// ======================
	// INIT DATABASE
	// ======================
	db := config.InitDB()
	defer db.Close()

	// ======================
	// REPOSITORY (GUDANG)
	// ======================
	aspRepo := repository.NewAspirationRepository(db)
	voteRepo := repository.NewVoteRepository(db)
	userRepo := repository.NewUserRepository(db) // <-- Baru

	// ======================
	// SERVICE (OTAK)
	// ======================
	aspService := service.NewAspirationService(aspRepo)
	voteService := service.NewVoteService(voteRepo)
	userService := service.NewUserService(userRepo) // <-- Baru

	// ======================
	// HANDLER (PELAYAN)
	// ======================
	aspHandler := handler.NewAspirationHandler(aspService)
	voteHandler := handler.NewVoteHandler(voteService)
	authHandler := handler.NewAuthHandler(userService) // <-- Baru

	// ======================
	// ROUTER (PINTU MASUK)
	// ======================
	r := gin.Default()

	// SETTING CORS (AGAR FRONTEND BISA AKSES)
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// DAFTARKAN SEMUA ROUTE
	routes.RegisterRoutes(r, aspHandler, voteHandler, authHandler)

	log.Println("🔥 Server running at :8080")
	r.Run(":8080")
}