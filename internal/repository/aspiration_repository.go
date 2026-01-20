package repository

import (
	"database/sql"
	"errors"
	"fmt"
	"github.com/Firdaus371/student-voice-api/internal/model"
)

type AspirationRepository struct {
	DB *sql.DB
}

func NewAspirationRepository(db *sql.DB) *AspirationRepository {
	return &AspirationRepository{DB: db}
}

func (r *AspirationRepository) Create(asp *model.Aspiration) error {
	query := `INSERT INTO aspirations (title, content, category, is_anonymous, status, user_id) VALUES ($1, $2, $3, $4, $5, $6)`
	_, err := r.DB.Exec(query, asp.Title, asp.Content, asp.Category, asp.IsAnonymous, "Menunggu Tinjauan", asp.UserID)
	return err
}

func (r *AspirationRepository) GetAll() ([]model.Aspiration, error) {
	// Query dengan casting ::int agar aman dibaca Go
	query := `
		SELECT 
			a.id, a.title, a.content, a.category, a.is_anonymous, a.status, a.created_at, 
			(SELECT COUNT(*) FROM votes v WHERE v.aspiration_id = a.id)::int as vote_count,
			COALESCE((SELECT message FROM aspiration_responses ar WHERE ar.aspiration_id = a.id LIMIT 1), '') as response
		FROM aspirations a
		ORDER BY vote_count DESC, a.created_at DESC
	`

	rows, err := r.DB.Query(query)
	if err != nil { return nil, err }
	defer rows.Close()

	// Inisialisasi slice kosong agar return [] bukan null saat data kosong
	aspirations := []model.Aspiration{}
	
	for rows.Next() {
		var asp model.Aspiration
		err := rows.Scan(
			&asp.ID, &asp.Title, &asp.Content, &asp.Category, &asp.IsAnonymous, &asp.Status, &asp.CreatedAt, 
			&asp.VoteCount, &asp.Response,
		)
		if err != nil {
			fmt.Println("❌ Error Scan Row:", err)
			return nil, err
		}
		aspirations = append(aspirations, asp)
	}
	return aspirations, nil
}

func (r *AspirationRepository) GetByID(id int) (*model.Aspiration, error) {
	query := `
		SELECT 
			a.id, a.title, a.content, a.category, a.is_anonymous, a.status, a.created_at, 
			(SELECT COUNT(*) FROM votes v WHERE v.aspiration_id = a.id)::int as vote_count,
			COALESCE((SELECT message FROM aspiration_responses ar WHERE ar.aspiration_id = a.id LIMIT 1), '') as response
		FROM aspirations a
		WHERE a.id = $1
	`
	var asp model.Aspiration
	err := r.DB.QueryRow(query, id).Scan(
		&asp.ID, &asp.Title, &asp.Content, &asp.Category, &asp.IsAnonymous, &asp.Status, &asp.CreatedAt, 
		&asp.VoteCount, &asp.Response,
	)
	if err != nil {
		if err == sql.ErrNoRows { return nil, errors.New("aspirasi tidak ditemukan") }
		return nil, err
	}
	return &asp, nil
}

func (r *AspirationRepository) UpdateStatus(id int, newStatus string) error {
	_, err := r.DB.Exec("UPDATE aspirations SET status = $1 WHERE id = $2", newStatus, id)
	return err
}

func (r *AspirationRepository) Reply(aspirationID int, message string, adminID int) error {
	_, err := r.DB.Exec("INSERT INTO aspiration_responses (aspiration_id, admin_id, message) VALUES ($1, $2, $3)", aspirationID, adminID, message)
	if err != nil { return err }
	_, err = r.DB.Exec("UPDATE aspirations SET status = 'Sedang Ditindaklanjuti' WHERE id = $1", aspirationID)
	return err
}

func (r *AspirationRepository) Delete(id int) error {
	_, err := r.DB.Exec("DELETE FROM aspirations WHERE id = $1", id)
	return err
}

// === BAGIAN INI SANGAT PENTING ===
// Pastikan ada `json:"..."` di SEMUA field agar Frontend bisa membacanya
type DashboardStats struct {
	TotalAspirations int    `json:"total_aspirations"` // <--- Wajib ada tag json
	TotalCompleted   int    `json:"total_completed"`
	TotalPending     int    `json:"total_pending"`
	TopCategory      string `json:"top_category"`
	MostVotedTitle   string `json:"most_voted_title"`
	MostVotedTotal   int    `json:"most_voted_total"`
}

func (r *AspirationRepository) GetStats() (*DashboardStats, error) {
	var stats DashboardStats

	// Hitung Statistik
	r.DB.QueryRow("SELECT COUNT(*) FROM aspirations").Scan(&stats.TotalAspirations)
	r.DB.QueryRow("SELECT COUNT(*) FROM aspirations WHERE status = 'Selesai'").Scan(&stats.TotalCompleted)
	r.DB.QueryRow("SELECT COUNT(*) FROM aspirations WHERE status = 'Menunggu Tinjauan'").Scan(&stats.TotalPending)
	
	// Cari Kategori Terbanyak
	err := r.DB.QueryRow("SELECT category FROM aspirations GROUP BY category ORDER BY COUNT(*) DESC LIMIT 1").Scan(&stats.TopCategory)
	if err != nil { stats.TopCategory = "-" }

	// Cari Juara Vote
	queryTopVote := `
		SELECT a.title, COUNT(v.id) as total_vote
		FROM aspirations a
		LEFT JOIN votes v ON a.id = v.aspiration_id
		GROUP BY a.id, a.title
		ORDER BY total_vote DESC
		LIMIT 1
	`
	err = r.DB.QueryRow(queryTopVote).Scan(&stats.MostVotedTitle, &stats.MostVotedTotal)
	if err != nil {
		stats.MostVotedTitle = "Belum ada vote"
		stats.MostVotedTotal = 0
	}

	return &stats, nil
}

type CommentData struct {
	ID        int    `json:"id"`
	UserName  string `json:"user_name"`
	Content   string `json:"content"`
	CreatedAt string `json:"created_at"`
}

func (r *AspirationRepository) AddComment(aspirationID int, userID int, content string) error {
	_, err := r.DB.Exec("INSERT INTO comments (aspiration_id, user_id, content) VALUES ($1, $2, $3)", aspirationID, userID, content)
	return err
}

func (r *AspirationRepository) GetComments(aspirationID int) ([]CommentData, error) {
	rows, err := r.DB.Query(`SELECT c.id, u.name, c.content, TO_CHAR(c.created_at, 'DD Mon HH24:MI') FROM comments c JOIN users u ON c.user_id = u.id WHERE c.aspiration_id = $1 ORDER BY c.created_at ASC`, aspirationID)
	if err != nil { return nil, err }
	defer rows.Close()
	var comments []CommentData
	for rows.Next() {
		var c CommentData
		rows.Scan(&c.ID, &c.UserName, &c.Content, &c.CreatedAt)
		comments = append(comments, c)
	}
	return comments, nil
}