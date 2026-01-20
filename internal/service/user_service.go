package service

import (
	"errors"
	"github.com/Firdaus371/student-voice-api/internal/model"
	"github.com/Firdaus371/student-voice-api/internal/repository"
	"github.com/Firdaus371/student-voice-api/pkg/utils"
	"golang.org/x/crypto/bcrypt"
)

type UserService interface {
	Register(user *model.User) error
	Login(email, password string) (string, error)
	GetUserDetails(email string) (*model.User, error)
	UpdateAvatar(userID int, avatarURL string) error
	
	// --- TAMBAHAN BARU ---
	GetAllUsers() ([]model.User, error)
	DeleteUser(id int) error
}

type userService struct {
	repo *repository.UserRepository
}

func NewUserService(repo *repository.UserRepository) UserService {
	return &userService{repo: repo}
}

func (s *userService) Register(user *model.User) error {
	// Hash password sebelum disimpan
	hashedPwd, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil { return err }
	
	user.Password = string(hashedPwd)
	return s.repo.Create(user)
}

func (s *userService) Login(email, password string) (string, error) {
	// 1. Cari user berdasarkan email
	user, err := s.repo.FindByEmail(email)
	if err != nil { return "", errors.New("email atau password salah") }

	// 2. Cek password
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return "", errors.New("email atau password salah")
	}

	// 3. Generate Token JWT
	return utils.GenerateToken(user.ID, user.Role)
}

func (s *userService) GetUserDetails(email string) (*model.User, error) {
	return s.repo.FindByEmail(email)
}

func (s *userService) UpdateAvatar(userID int, avatarURL string) error {
	return s.repo.UpdateAvatar(userID, avatarURL)
}

// --- IMPLEMENTASI BARU ---

func (s *userService) GetAllUsers() ([]model.User, error) {
	return s.repo.GetAll()
}

func (s *userService) DeleteUser(id int) error {
	return s.repo.Delete(id)
}