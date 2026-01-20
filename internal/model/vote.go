package model

import "time"

type Vote struct {
	ID           int       `json:"id"`
	UserID       int       `json:"user_id"`
	AspirationID int       `json:"aspiration_id"`
	CreatedAt    time.Time `json:"created_at"`
}
