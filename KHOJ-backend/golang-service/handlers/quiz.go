package handlers

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang-service/config"
	"golang-service/models"
)

// TriggerQuizReminder is called by n8n/webhook when scheduled time arrives
func TriggerQuizReminder(c *gin.Context) {
	var body struct {
		ScheduleID int `json:"schedule_id" binding:"required"`
	}

	if err := c.BindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// Get schedule details
	var schedule models.Schedule
	err := config.DB.Get(&schedule, "SELECT * FROM schedules WHERE id=$1 AND active=true", body.ScheduleID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Schedule not found"})
		return
	}

	// Send reminder message to chat
	reminderMsg := fmt.Sprintf("📅 Time for your quiz! Take quiz on '%s' for today. Would you like to:\n1. Take quiz here (type 'quiz here')\n2. Go to dashboard (type 'dashboard')", schedule.Topic)
	
	botMsgID := uuid.New().String()
	_, err = config.DB.Exec(`
		INSERT INTO messages (id, chat_id, role, content, created_at)
		VALUES ($1, $2, 'bot', $3, $4)
	`, botMsgID, schedule.ChatID, reminderMsg, time.Now())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send reminder: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Quiz reminder sent successfully",
		"chat_id": schedule.ChatID,
		"topic":   schedule.Topic,
	})
}

// StartQuiz begins a quiz in the chat
func StartQuiz(c *gin.Context) {
	var body struct {
		UserID    int    `json:"user_id" binding:"required"`
		ChatID    string `json:"chat_id" binding:"required"`
		Topic     string `json:"topic" binding:"required"`
	}

	if err := c.BindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// Verify chat exists and belongs to user
	var chat models.Chat
	err := config.DB.Get(&chat, "SELECT * FROM chats WHERE id=$1 AND user_id=$2", body.ChatID, body.UserID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Chat not found"})
		return
	}

	// Check if quiz already exists for this chat (not completed)
	var existingQuiz models.Quiz
	err = config.DB.Get(&existingQuiz, `
		SELECT * FROM quizzes 
		WHERE chat_id=$1 AND status != 'completed' 
		ORDER BY created_at DESC LIMIT 1
	`, body.ChatID)
	if err == nil {
		c.JSON(http.StatusConflict, gin.H{
			"error": "Quiz already in progress",
			"quiz_id": existingQuiz.ID,
		})
		return
	}

	// Generate 3 simple questions (can be enhanced with Gemini later)
	questions := generateSimpleQuestions(body.Topic)
	
	// Create quiz
	var quizID int
	err = config.DB.QueryRow(`
		INSERT INTO quizzes (user_id, chat_id, topic, status, total_questions, created_at)
		VALUES ($1, $2, $3, 'in_progress', $4, $5)
		RETURNING id
	`, body.UserID, body.ChatID, body.Topic, len(questions), time.Now()).Scan(&quizID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create quiz: " + err.Error()})
		return
	}

	// Insert questions
	for i, q := range questions {
		_, err = config.DB.Exec(`
			INSERT INTO quiz_questions (quiz_id, question, answer, order_num)
			VALUES ($1, $2, $3, $4)
		`, quizID, q.Question, q.Answer, i+1)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create questions: " + err.Error()})
			return
		}
	}

	// Send first question to chat
	firstQ := questions[0]
	questionMsg := fmt.Sprintf("📝 Quiz started! Question 1/%d:\n%s", len(questions), firstQ.Question)
	
	botMsgID := uuid.New().String()
	_, err = config.DB.Exec(`
		INSERT INTO messages (id, chat_id, role, content, created_at)
		VALUES ($1, $2, 'bot', $3, $4)
	`, botMsgID, body.ChatID, questionMsg, time.Now())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send question: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":     "Quiz started",
		"quiz_id":     quizID,
		"question":    firstQ.Question,
		"question_num": 1,
		"total":       len(questions),
	})
}

// SubmitQuizAnswer handles user's answer to current question
func SubmitQuizAnswer(c *gin.Context) {
	var body struct {
		UserID  int    `json:"user_id" binding:"required"`
		ChatID  string `json:"chat_id" binding:"required"`
		Answer  string `json:"answer" binding:"required"`
	}

	if err := c.BindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// Get active quiz
	var quiz models.Quiz
	err := config.DB.Get(&quiz, `
		SELECT * FROM quizzes 
		WHERE chat_id=$1 AND user_id=$2 AND status='in_progress' 
		ORDER BY created_at DESC LIMIT 1
	`, body.ChatID, body.UserID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "No active quiz found"})
		return
	}

	// Find current unanswered question
	var currentQ models.QuizQuestion
	err = config.DB.Get(&currentQ, `
		SELECT * FROM quiz_questions 
		WHERE quiz_id=$1 AND user_answer IS NULL 
		ORDER BY order_num ASC LIMIT 1
	`, quiz.ID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "All questions answered"})
		return
	}

	// Check answer (simple string match, can enhance later)
	isCorrect := strings.Contains(strings.ToLower(currentQ.Answer), strings.ToLower(body.Answer)) ||
		strings.Contains(strings.ToLower(body.Answer), strings.ToLower(currentQ.Answer))

	// Update question
	_, err = config.DB.Exec(`
		UPDATE quiz_questions 
		SET user_answer=$1, is_correct=$2 
		WHERE id=$3
	`, body.Answer, isCorrect, currentQ.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Update quiz score
	if isCorrect {
		quiz.Score++
		config.DB.Exec("UPDATE quizzes SET score=$1 WHERE id=$2", quiz.Score, quiz.ID)
	}

	// Save user's answer message
	userMsgID := uuid.New().String()
	config.DB.Exec(`
		INSERT INTO messages (id, chat_id, role, content, created_at)
		VALUES ($1, $2, 'user', $3, $4)
	`, userMsgID, body.ChatID, body.Answer, time.Now())

	responseText := ""
	if isCorrect {
		responseText = "✅ Correct! "
	} else {
		responseText = fmt.Sprintf("❌ Not quite. The answer is: %s. ", currentQ.Answer)
	}

	// Get next question
	var nextQ models.QuizQuestion
	nextErr := config.DB.Get(&nextQ, `
		SELECT * FROM quiz_questions 
		WHERE quiz_id=$1 AND user_answer IS NULL 
		ORDER BY order_num ASC LIMIT 1
	`, quiz.ID)

	if nextErr != nil { // No more questions - quiz complete
		now := time.Now()
		finalScore := quiz.Score
		config.DB.Exec(`
			UPDATE quizzes 
			SET status='completed', completed_at=$1, score=$2
			WHERE id=$3
		`, now, finalScore, quiz.ID)
		
		responseText += fmt.Sprintf("\n🎉 Quiz completed! Your score: %d/%d", finalScore, quiz.TotalQues)
	} else {
		// Next question
		responseText += fmt.Sprintf("\n📝 Question %d/%d:\n%s", nextQ.OrderNum, quiz.TotalQues, nextQ.Question)
	}

	// Send bot response
	botMsgID := uuid.New().String()
	config.DB.Exec(`
		INSERT INTO messages (id, chat_id, role, content, created_at)
		VALUES ($1, $2, 'bot', $3, $4)
	`, botMsgID, body.ChatID, responseText, time.Now())

	c.JSON(http.StatusOK, gin.H{
		"correct":   isCorrect,
		"score":     quiz.Score,
		"response":  responseText,
		"completed": nextErr != nil,
	})
}

// generateSimpleQuestions creates basic questions based on topic (can use Gemini later)
func generateSimpleQuestions(topic string) []struct {
	Question string
	Answer   string
} {
	topic = strings.ToLower(topic)
	
	questions := map[string][]struct {
		Question string
		Answer   string
	}{
		"algebra": {
			{"What is 2x + 5 = 11? Find x.", "3"},
			{"What is the formula for a quadratic equation?", "ax² + bx + c = 0"},
			{"What is (a + b)²?", "a² + 2ab + b²"},
		},
		"math": {
			{"What is 15 + 27?", "42"},
			{"What is the square root of 144?", "12"},
			{"What is 8 × 7?", "56"},
		},
	}

	if qs, ok := questions[topic]; ok {
		return qs
	}
	
	// Default questions
	return []struct {
		Question string
		Answer   string
	}{
		{"What is the main topic we discussed?", topic},
		{"Can you explain this topic briefly?", topic + " is the subject"},
		{"What did you learn about " + topic + "?", "Various concepts"},
	}
}

