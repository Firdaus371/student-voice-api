package handler

import (
	"net/http"
	"path/filepath"
	"strconv"

	"github.com/Firdaus371/student-voice-api/internal/model"
	"github.com/Firdaus371/student-voice-api/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type AuthHandler struct {
	service service.UserService
}

func NewAuthHandler(service service.UserService) *AuthHandler {
	return &AuthHandler{service: service}
}

// REGISTER
func (h *AuthHandler) Register(c *gin.Context) {
	var user model.User
	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.service.Register(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Gagal registrasi (Email/NIM mungkin sudah ada)"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "Registrasi berhasil"})
}

// LOGIN
func (h *AuthHandler) Login(c *gin.Context) {
	var input struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	token, err := h.service.Login(input.Email, input.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}
	
	// Kembalikan data user agar Frontend bisa menyimpan info (nama, role, avatar)
	user, _ := h.service.GetUserDetails(input.Email)
	
	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user":  user,
	})
}

// UPLOAD AVATAR
func (h *AuthHandler) UploadAvatar(c *gin.Context) {
	file, err := c.FormFile("avatar")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File tidak ditemukan"})
		return
	}

	userID := c.GetInt("user_id")
	// Buat nama file unik: ID_UUID.ext
	filename := strconv.Itoa(userID) + "_" + uuid.New().String() + filepath.Ext(file.Filename)
	path := "uploads/" + filename

	if err := c.SaveUploadedFile(file, path); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan file"})
		return
	}

	avatarURL := "/uploads/" + filename
	h.service.UpdateAvatar(userID, avatarURL)

	c.JSON(http.StatusOK, gin.H{"avatar_url": avatarURL})
}

// --- FITUR BARU: KELOLA PENGGUNA (ADMIN) ---

// GetAllUsers: Mengambil daftar semua mahasiswa
func (h *AuthHandler) GetAllUsers(c *gin.Context) {
	users, err := h.service.GetAllUsers()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data user"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": users})
}

// DeleteUser: Menghapus mahasiswa
func (h *AuthHandler) DeleteUser(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID tidak valid"})
		return
	}
	
	if err := h.service.DeleteUser(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus user"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "User berhasil dihapus"})
}