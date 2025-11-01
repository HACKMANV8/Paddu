package models

import "time"

type Quiz struct {
	ID        int       `db:"id" json:"id"`
	UserID    int       `db:"user_id" json:"user_id"`
	ChatID    string    `db:"chat_id" json:"chat_id"`
	Topic     string    `db:"topic" json:"topic"`
	Status    string    `db:"status" json:"status"` // "pending", "in_progress", "completed"
	Score     int       `db:"score" json:"score"`
	TotalQues int       `db:"total_questions" json:"total_questions"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
	CompletedAt *time.Time `db:"completed_at" json:"completed_at,omitempty"`
}

type QuizQuestion struct {
	ID         int      `db:"id" json:"id"`
	QuizID     int      `db:"quiz_id" json:"quiz_id"`
	Question   string   `db:"question" json:"question"`
	Answer     string   `db:"answer" json:"answer"` // Correct answer option (e.g., "A", "B", "C", "D")
	Options    string   `db:"options" json:"options,omitempty"` // JSON array of options ["option1", "option2", ...]
	UserAnswer string   `db:"user_answer" json:"user_answer,omitempty"`
	IsCorrect  bool     `db:"is_correct" json:"is_correct,omitempty"`
	OrderNum   int      `db:"order_num" json:"order_num"`
}


