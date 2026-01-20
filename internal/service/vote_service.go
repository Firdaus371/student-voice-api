package service

import "github.com/Firdaus371/student-voice-api/internal/repository"

// Interface (Kontrak Kerja)
type VoteService interface {
	CreateVote(userID, aspirationID int) error
	RemoveVote(aspirationID, userID int) error
}

// Struct (Implementasi)
type voteService struct {
	// PERBAIKAN: Tidak pakai tanda bintang (*) karena ini Interface
	repo repository.VoteRepository
}

// Constructor
func NewVoteService(repo repository.VoteRepository) *voteService {
	return &voteService{repo: repo}
}

// Method CreateVote
func (s *voteService) CreateVote(userID, aspirationID int) error {
	// Kita bisa tambahkan logika bisnis di sini (misal: validasi)
	// Tapi untuk sekarang langsung panggil repo saja
	return s.repo.Create(userID, aspirationID)
}

// Method RemoveVote
func (s *voteService) RemoveVote(aspirationID int, userID int) error {
	return s.repo.RemoveVote(aspirationID, userID)
}