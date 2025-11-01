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
	// Recurring reminder fields
	RecurrenceType string `db:"recurrence_type" json:"recurrence_type"` // "daily", "weekly", "once"
	ReminderTime   string `db:"reminder_time" json:"reminder_time"`     // Time of day "HH:MM"
	ReminderTimeEnd string `db:"reminder_time_end" json:"reminder_time_end,omitempty"` // Optional end time for ranges
	DaysOfWeek     string `db:"days_of_week" json:"days_of_week,omitempty"` // Comma-separated: "1,3,5" for Mon,Wed,Fri (0=Sun, 1=Mon, etc.)
}


