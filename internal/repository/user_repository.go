package repository

import (
	"database/sql"
	"github.com/Firdaus371/student-voice-api/internal/model"
)

type UserRepository struct {
	DB *sql.DB
}

func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{DB: db}
}

// Create User (Register)
func (r *UserRepository) Create(user *model.User) error {
	// Role default selalu 'student'. Admin dibuat manual lewat database.
	query := `INSERT INTO users (name, nim, email, password, role) VALUES ($1, $2, $3, $4, 'student') RETURNING id`
	return r.DB.QueryRow(query, user.Name, user.NIM, user.Email, user.Password).Scan(&user.ID)
}

// Find By Email (Login)
func (r *UserRepository) FindByEmail(email string) (*model.User, error) {
	query := `SELECT id, name, nim, email, password, role, avatar_url FROM users WHERE email = $1`
	var user model.User
	err := r.DB.QueryRow(query, email).Scan(&user.ID, &user.Name, &user.NIM, &user.Email, &user.Password, &user.Role, &user.AvatarURL)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// Update Avatar
func (r *UserRepository) UpdateAvatar(userID int, avatarURL string) error {
	_, err := r.DB.Exec("UPDATE users SET avatar_url = $1 WHERE id = $2", avatarURL, userID)
	return err
}

// --- FITUR BARU: KELOLA PENGGUNA ---

// GetAll mengambil semua user untuk ditampilkan di dashboard admin
func (r *UserRepository) GetAll() ([]model.User, error) {
	// Kita tidak mengambil password demi keamanan
	query := `SELECT id, name, nim, email, role, avatar_url FROM users ORDER BY created_at DESC`
	rows, err := r.DB.Query(query)
	if err != nil { return nil, err }
	defer rows.Close()

	var users []model.User
	for rows.Next() {
		var u model.User
		if err := rows.Scan(&u.ID, &u.Name, &u.NIM, &u.Email, &u.Role, &u.AvatarURL); err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, nil
}

// Delete menghapus user berdasarkan ID (Cascading akan menghapus vote & aspirasi mereka juga)
func (r *UserRepository) Delete(id int) error {
	_, err := r.DB.Exec("DELETE FROM users WHERE id = $1", id)
	return err
}