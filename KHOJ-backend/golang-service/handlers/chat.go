package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang-service/config"
	"golang-service/models"
)

// 🧩 Start a new chat
func StartChat(c *gin.Context) {
	var body struct {
		UserID int    `json:"user_id"`
		Topic  string `json:"topic"`
	}

	if err := c.BindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// Check if user already has chat on this topic
	var exists bool
	err := config.DB.Get(&exists,
		"SELECT EXISTS (SELECT 1 FROM chats WHERE user_id=$1 AND topic=$2)",
		body.UserID, body.Topic)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if exists {
		c.JSON(http.StatusConflict, gin.H{"error": "Chat for this topic already exists"})
		return
	}

	chatID := uuid.New().String()
	now := time.Now()

	_, err = config.DB.Exec(`
		INSERT INTO chats (id, user_id, topic, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5)
	`, chatID, body.UserID, body.Topic, now, now)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"chat_id": chatID})
}

// 🧩 Send a message and get a bot reply
func SendMessage(c *gin.Context) {
	var body struct {
		UserID  int    `json:"user_id"`
		ChatID  string `json:"chat_id"`
		Message string `json:"message"`
	}

	if err := c.BindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// Verify chat exists and belongs to user
	var chat models.Chat
	err := config.DB.Get(&chat, "SELECT * FROM chats WHERE id=$1 AND user_id=$2", body.ChatID, body.UserID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Chat not found or unauthorized"})
		return
	}

	// Save user message
	userMsgID := uuid.New().String()
	_, err = config.DB.Exec(`
		INSERT INTO messages (id, chat_id, role, content, created_at)
		VALUES ($1, $2, 'user', $3, $4)
	`, userMsgID, body.ChatID, body.Message, time.Now())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Generate bot reply (for now static)
	botReply := generateBotReply(body.Message)

	botMsgID := uuid.New().String()
	_, err = config.DB.Exec(`
		INSERT INTO messages (id, chat_id, role, content, created_at)
		VALUES ($1, $2, 'bot', $3, $4)
	`, botMsgID, body.ChatID, botReply, time.Now())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"reply": botReply,
	})
}

// 🧩 Get full chat history
func GetChatHistory(c *gin.Context) {
	chatID := c.Param("id")
	var messages []models.Message

	err := config.DB.Select(&messages, "SELECT * FROM messages WHERE chat_id=$1 ORDER BY created_at ASC", chatID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, messages)
}

// 🧠 Dummy AI response
func generateBotReply(input string) string {
	return "Bot reply to: " + input
}
