package models
import "time"
type User struct{
  ID         int `db:"id" json:"id"`
  Username   string `db:"username" json:"username" binding:"required"`
  Email      string `db:"email"  json:"email" binding:"required"`
 Password     string `db:"password"  json:"password" binding:"required"`
 RefreshToken   string `db:"refresh_token"  json:"refresh_token"`
 CreatedAt time.Time `json:"created_at,omitempty" db:"created_at"`
    UpdatedAt time.Time `json:"updated_at,omitempty" db:"updated_at"`
  }

  type UserAnswer struct {
    QuestionNumber int`db:"question_number" json:"question_number"`
    Question        string `db:"question" json:"question"`
	Answer          string `db:"answer" json:"answer"`
  }


type AnswerPayload struct {
	ID  int          `db:"user_id" json:"id"`
	Answers []UserAnswer `db:"answers" json:"answers"`
}