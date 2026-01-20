package service

import (
	"github.com/Firdaus371/student-voice-api/internal/model"
	"github.com/Firdaus371/student-voice-api/internal/repository"
)

type AspirationService interface {
	Create(asp *model.Aspiration) error
	GetAll() ([]model.Aspiration, error)
	GetByID(id int) (*model.Aspiration, error)
	UpdateStatus(id int, status string) error
	Reply(aspirationID int, message string, adminID int) error
	Delete(id int) error
	GetStats() (*repository.DashboardStats, error)

	// --- TAMBAHAN BARU (KOMENTAR) ---
	AddComment(aspirationID int, userID int, content string) error
	GetComments(aspirationID int) ([]repository.CommentData, error)
}

type aspirationService struct {
	repo *repository.AspirationRepository
}

func NewAspirationService(repo *repository.AspirationRepository) AspirationService {
	return &aspirationService{repo: repo}
}

func (s *aspirationService) Create(asp *model.Aspiration) error {
	return s.repo.Create(asp)
}

func (s *aspirationService) GetAll() ([]model.Aspiration, error) {
	return s.repo.GetAll()
}

func (s *aspirationService) GetByID(id int) (*model.Aspiration, error) {
	return s.repo.GetByID(id)
}

func (s *aspirationService) UpdateStatus(id int, status string) error {
	return s.repo.UpdateStatus(id, status)
}

func (s *aspirationService) Reply(aspirationID int, message string, adminID int) error {
	return s.repo.Reply(aspirationID, message, adminID)
}

func (s *aspirationService) Delete(id int) error {
	return s.repo.Delete(id)
}

func (s *aspirationService) GetStats() (*repository.DashboardStats, error) {
	return s.repo.GetStats()
}

// --- IMPLEMENTASI KOMENTAR ---

func (s *aspirationService) AddComment(aspirationID int, userID int, content string) error {
	return s.repo.AddComment(aspirationID, userID, content)
}

func (s *aspirationService) GetComments(aspirationID int) ([]repository.CommentData, error) {
	return s.repo.GetComments(aspirationID)
}