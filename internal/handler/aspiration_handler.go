package handler

import (
	"net/http"
	"strconv"

	"github.com/Firdaus371/student-voice-api/internal/model"
	"github.com/Firdaus371/student-voice-api/internal/service"
	"github.com/gin-gonic/gin"
)

type AspirationHandler struct {
	service service.AspirationService
}

func NewAspirationHandler(service service.AspirationService) *AspirationHandler {
	return &AspirationHandler{service: service}
}

// 1. CREATE ASPIRATION (YANG TADI ERROR)
func (h *AspirationHandler) Create(c *gin.Context) {
	var asp model.Aspiration
	if err := c.ShouldBindJSON(&asp); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// --- PERBAIKAN DI SINI ---
	// Gunakan c.GetInt() agar aman. Tidak perlu casting manual yang bikin panic.
	userID := c.GetInt("user_id")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	asp.UserID = userID
	// -------------------------

	if err := h.service.Create(&asp); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Aspirasi berhasil dikirim", "data": asp})
}

// 2. GET ALL
func (h *AspirationHandler) GetAll(c *gin.Context) {
	aspirations, err := h.service.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": aspirations})
}

// 3. GET BY ID
func (h *AspirationHandler) GetByID(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	asp, err := h.service.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Aspirasi tidak ditemukan"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": asp})
}

// 4. UPDATE STATUS (ADMIN)
func (h *AspirationHandler) UpdateStatus(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var input struct {
		Status string `json:"status"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.UpdateStatus(id, input.Status); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Status berhasil diperbarui"})
}

// 5. REPLY (ADMIN)
func (h *AspirationHandler) Reply(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var input struct {
		Message string `json:"message"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	adminID := c.GetInt("user_id") // Ambil ID Admin yang login
	if err := h.service.Reply(id, input.Message, adminID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Balasan terkirim"})
}

// 6. DELETE (ADMIN)
func (h *AspirationHandler) Delete(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if err := h.service.Delete(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Aspirasi dihapus"})
}

// 7. GET STATS (DASHBOARD)
func (h *AspirationHandler) GetStats(c *gin.Context) {
	stats, err := h.service.GetStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memuat statistik"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": stats})
}

// 8. ADD COMMENT
func (h *AspirationHandler) AddComment(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	userID := c.GetInt("user_id")
	
	var input struct {
		Content string `json:"content"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.AddComment(id, userID, input.Content); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengirim komentar"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "Komentar terkirim"})
}

// 9. GET COMMENTS
func (h *AspirationHandler) GetComments(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	comments, err := h.service.GetComments(id)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"data": []interface{}{}}) // Return kosong jika error/tidak ada
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": comments})
}