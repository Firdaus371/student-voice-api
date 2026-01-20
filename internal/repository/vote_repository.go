package repository

import (
	"database/sql"
	"fmt"
)

type VoteRepository interface {
	IsVoted(userID, aspirationID int) (bool, error)
	Create(userID, aspirationID int) error
	RemoveVote(aspirationID, userID int) error
}

type voteRepository struct {
	DB *sql.DB
}

func NewVoteRepository(db *sql.DB) *voteRepository {
	return &voteRepository{DB: db}
}

func (r *voteRepository) IsVoted(userID, aspirationID int) (bool, error) {
	var exists bool
	// PostgreSQL wajib pakai $1, $2 (bukan ?)
	query := `SELECT EXISTS (SELECT 1 FROM votes WHERE user_id = $1 AND aspiration_id = $2)`
	err := r.DB.QueryRow(query, userID, aspirationID).Scan(&exists)
	if err != nil {
		fmt.Println("⚠️ Error IsVoted:", err)
		return false, err
	}
	return exists, nil
}

func (r *voteRepository) Create(userID, aspirationID int) error {
	query := `INSERT INTO votes (user_id, aspiration_id) VALUES ($1, $2)`
	_, err := r.DB.Exec(query, userID, aspirationID)
	if err != nil {
		fmt.Println("❌ Gagal CREATE Vote:", err) 
		return err
	}
	fmt.Println("✅ Sukses Vote!")
	return nil
}

func (r *voteRepository) RemoveVote(aspirationID int, userID int) error {
	// PERBAIKAN FATAL DI SINI:
	// Dulu pakai '?', sekarang GANTI jadi '$1' dan '$2'
	query := "DELETE FROM votes WHERE aspiration_id = $1 AND user_id = $2"
	_, err := r.DB.Exec(query, aspirationID, userID)
	if err != nil {
		fmt.Println("❌ Gagal DELETE Vote:", err)
		return err
	}
	fmt.Println("✅ Sukses Unvote!")
	return nil
}