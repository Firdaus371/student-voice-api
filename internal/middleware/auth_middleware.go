package middleware

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/Firdaus371/student-voice-api/pkg/utils" // Pastikan path ini benar sesuai modul Mas
	"github.com/gin-gonic/gin"
)

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 1. Ambil Header Authorization
		authHeader := c.GetHeader("Authorization")
		fmt.Println("\n🕵️ [MIDDLEWARE CHECK] Header:", authHeader) // LOG 1

		if authHeader == "" {
			fmt.Println("❌ Error: Header Authorization Kosong")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header is required"})
			c.Abort()
			return
		}

		// 2. Pisahkan "Bearer" dan "Token"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			fmt.Println("❌ Error: Format Header Salah (Harus 'Bearer <token>')")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization format must be Bearer {token}"})
			c.Abort()
			return
		}

		tokenString := parts[1]
		fmt.Println("🔑 [MIDDLEWARE] Token String:", tokenString) // LOG 2

		// 3. Validasi Token
		claims, err := utils.ValidateToken(tokenString)
		if err != nil {
			fmt.Println("❌ Error Validasi Token:", err) // LOG 3 (PENTING!)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			c.Abort()
			return
		}

		fmt.Println("✅ [MIDDLEWARE] Sukses! User ID:", claims.UserID)
		
		// 4. Simpan User ID ke Context
		c.Set("user_id", claims.UserID)
		c.Set("role", claims.Role)
		c.Next()
	}
}

// Middleware Admin (Opsional, biarkan saja kalau sudah ada)
func AdminOnly() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("role")
		if !exists || role != "admin" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
			c.Abort()
			return
		}
		c.Next()
	}
}