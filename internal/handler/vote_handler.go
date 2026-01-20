package handler

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/Firdaus371/student-voice-api/internal/service"
	"github.com/gin-gonic/gin"
)

type VoteHandler struct {
	service service.VoteService
}

func NewVoteHandler(service service.VoteService) *VoteHandler {
	return &VoteHandler{service: service}
}

// CreateVote: Menambah Vote
func (h *VoteHandler) CreateVote(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID aspirasi tidak valid"})
		return
	}

	userID := c.GetInt("user_id")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Silakan login ulang"})
		return
	}

	fmt.Printf("🔵 User %d mencoba vote Aspirasi %d\n", userID, id)

	err = h.service.CreateVote(userID, id)
	if err != nil {
		// Error biasanya karena constraint db (sudah vote)
		fmt.Println("❌ Gagal Vote:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Gagal vote atau sudah memberikan suara"})
		return
	}

	fmt.Println("✅ Vote Berhasil Disimpan")
	c.JSON(http.StatusOK, gin.H{"message": "Vote berhasil disimpan"})
}

// RemoveVote: Menghapus Vote
func (h *VoteHandler) RemoveVote(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID aspirasi tidak valid"})
		return
	}

	userID := c.GetInt("user_id")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Silakan login ulang"})
		return
	}

	fmt.Printf("🔴 User %d mencoba UNVOTE Aspirasi %d\n", userID, id)

	err = h.service.RemoveVote(id, userID)
	if err != nil {
		fmt.Println("❌ Gagal Unvote:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membatalkan vote"})
		return
	}

	fmt.Println("✅ Vote Berhasil Dihapus")
	c.JSON(http.StatusOK, gin.H{"message": "Vote berhasil dibatalkan"})
}