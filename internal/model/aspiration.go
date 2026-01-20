package model

import "time"

type Aspiration struct {
	ID          int       `json:"id"`
	UserID      int       `json:"user_id"`
	Title       string    `json:"title"`
	Content     string    `json:"content"`
	Category    string    `json:"category"`
	IsAnonymous bool      `json:"is_anonymous"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"created_at"`
	
	// WAJIB JSON INI:
	VoteCount   int       `json:"vote_count"` 
	Response    string    `json:"response"`
}