package models

import "time"

type Schedule struct {
	ID            int       `db:"id" json:"id"`
	UserID        int       `db:"user_id" json:"user_id"`
	ChatID        string    `db:"chat_id" json:"chat_id"`
	Topic         string    `db:"topic" json:"topic"`
	ScheduledTime time.Time `db:"scheduled_time" json:"scheduled_time"`
	Active        bool      `db:"active" json:"active"`
	CreatedAt     time.Time `db:"created_at" json:"created_at"`
}


