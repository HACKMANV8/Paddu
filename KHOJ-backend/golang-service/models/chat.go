package models

import "time"

type Message struct {
	ID        string    `db:"id" json:"id"`
	ChatID    string    `db:"chat_id" json:"chat_id"`
	Role      string    `db:"role" json:"role"`
	Content   string    `db:"content" json:"content"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
}

type Chat struct {
	ID        string    `db:"id" json:"id"`
	UserID    int       `db:"user_id" json:"user_id"`
	Topic     string    `db:"topic" json:"topic"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
	UpdatedAt time.Time `db:"updated_at" json:"updated_at"`
}
