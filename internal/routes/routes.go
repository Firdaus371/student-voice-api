package routes

import (
	"github.com/Firdaus371/student-voice-api/internal/handler"
	"github.com/Firdaus371/student-voice-api/internal/middleware"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func RegisterRoutes(
	r *gin.Engine,
	aspHandler *handler.AspirationHandler,
	voteHandler *handler.VoteHandler,
	authHandler *handler.AuthHandler,
) {
	// ==========================================
	// 1. SETTING CORS (WAJIB)
	// ==========================================
	config := cors.DefaultConfig()
	config.AllowAllOrigins = true
	config.AllowHeaders = []string{"Origin", "Content-Length", "Content-Type", "Authorization"}
	config.AllowMethods = []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"}
	r.Use(cors.New(config))

	// ==========================================
	// 2. STATIC FILES (UPLOAD FOTO)
	// ==========================================
	r.Static("/uploads", "./uploads")

	// ==========================================
	// 3. AUTH ROUTES (Group: /auth)
	// ==========================================
	auth := r.Group("/auth")
	{
		// Public
		auth.POST("/register", authHandler.Register)
		auth.POST("/login", authHandler.Login)

		// Protected (User Biasa)
		auth.POST("/upload-avatar", middleware.AuthMiddleware(), authHandler.UploadAvatar)

		// --- BAGIAN ADMIN: KELOLA PENGGUNA ---
		// PENTING: Posisinya harus di sini supaya alamatnya jadi /auth/users
		// Kita kunci dengan Middleware AdminOnly
		auth.GET("/users", middleware.AuthMiddleware(), middleware.AdminOnly(), authHandler.GetAllUsers)
		auth.DELETE("/users/:id", middleware.AuthMiddleware(), middleware.AdminOnly(), authHandler.DeleteUser)
	}

	// ==========================================
	// 4. ASPIRATION ROUTES (Group: /aspirations)
	// ==========================================
	asp := r.Group("/aspirations")
	{
		// Public Routes (Bisa dilihat siapa saja)
		asp.GET("", aspHandler.GetAll)
		asp.GET("/:id", aspHandler.GetByID)
		asp.GET("/:id/comments", aspHandler.GetComments)
		
		// Public Stats (Untuk Dashboard)
		asp.GET("/stats", aspHandler.GetStats)

		// Protected Routes (Harus Login)
		protected := asp.Group("")
		protected.Use(middleware.AuthMiddleware())
		{
			protected.POST("", aspHandler.Create)
			
			// Vote & Unvote
			protected.POST("/:id/vote", voteHandler.CreateVote)
			protected.DELETE("/:id/vote", voteHandler.RemoveVote)
			
			// Komentar
			protected.POST("/:id/comments", aspHandler.AddComment)

			// Admin Actions (Khusus Aspirasi)
			admin := protected.Group("")
			admin.Use(middleware.AdminOnly())
			{
				admin.PATCH("/:id/status", aspHandler.UpdateStatus)
				admin.POST("/:id/reply", aspHandler.Reply)
				admin.DELETE("/:id", aspHandler.Delete)
			}
		}
	}
}