package model

import "time"

type User struct {
	ID        int       `json:"id"`          // <--- PENTING: json:"id"
	Name      string    `json:"name"`        // <--- PENTING: json:"name" (Huruf Kecil)
	NIM       string    `json:"nim"`
	Email     string    `json:"email"`
	Password  string    `json:"-"`           // Password jangan dikirim ke frontend (-)
	Role      string    `json:"role"`
	AvatarURL string    `json:"avatar_url"`  // <--- Perhatikan underscore ini
	CreatedAt time.Time `json:"created_at"`
}