package handlers

import (
    "context"
    "database/sql"
    "fmt"
    "net/http"
    "strings"
    "time"

    "github.com/gin-gonic/gin"
    "github.com/google/uuid"
    "golang-service/config"
    "golang-service/models"
    "golang-service/services"
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
	var existingChat models.Chat
	err := config.DB.Get(&existingChat,
		"SELECT * FROM chats WHERE user_id=$1 AND topic=$2",
		body.UserID, body.Topic)
	
	// If chat exists, return the existing chat_id instead of error
	if err == nil {
		// Update the updated_at timestamp
		_, updateErr := config.DB.Exec(
			"UPDATE chats SET updated_at=$1 WHERE id=$2",
			time.Now(), existingChat.ID)
		if updateErr != nil {
			// Log but don't fail - we still return the chat
			fmt.Printf("Warning: failed to update chat timestamp: %v\n", updateErr)
		}
		c.JSON(http.StatusOK, gin.H{"chat_id": existingChat.ID, "existing": true})
		return
	}
	
	// If error is not "no rows", it's a real database error
	if err != nil && err != sql.ErrNoRows {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Create new chat
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

	c.JSON(http.StatusOK, gin.H{"chat_id": chatID, "existing": false})
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

    // Enforce topic consistency: if message is off-topic, do NOT create a bot reply
    if !isMessageOnTopic(body.Message, chat.Topic) {
        c.JSON(http.StatusConflict, gin.H{
            "error": fmt.Sprintf("Message is off-topic. This chat is for '%s'. Start a new chat for a different topic.", chat.Topic),
            "required_topic": chat.Topic,
        })
        return
    }

	// Resolve API key: request headers override env
    apiKey := services.ResolveGeminiAPIKeyFromRequest(c)
	if apiKey == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "GEMINI_API_KEY not set"})
		return
	}

    // Allow caller to specify a model; else service will fall back
    preferredModel := strings.TrimSpace(c.GetHeader("X-Gemini-Model"))

    // Generate bot reply from Gemini
    botReply, err := services.GenerateGeminiReply(context.Background(), apiKey, preferredModel, chat.Topic, body.Message)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

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

// 🧩 Get all chats for a user
func GetUserChats(c *gin.Context) {
	userIDStr := c.Param("user_id")
	var userID int
	
	// Convert user_id param to int
	_, err := fmt.Sscanf(userIDStr, "%d", &userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user_id"})
		return
	}
	
	var chats []models.Chat
	err = config.DB.Select(&chats, "SELECT * FROM chats WHERE user_id=$1 ORDER BY updated_at DESC", userID)
	if err != nil {
		fmt.Printf("Error fetching chats for user %d: %v\n", userID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Log for debugging
	fmt.Printf("Found %d chats for user %d\n", len(chats), userID)
	
	c.JSON(http.StatusOK, chats)
}

// 🧩 Delete a chat
func DeleteChat(c *gin.Context) {
	chatID := c.Param("id")
	var body struct {
		UserID int `json:"user_id"`
	}

	fmt.Printf("DeleteChat: Received request for chat_id=%s\n", chatID)

	if err := c.BindJSON(&body); err != nil {
		fmt.Printf("DeleteChat: Failed to parse body: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	fmt.Printf("DeleteChat: Parsed user_id=%d, chat_id=%s\n", body.UserID, chatID)

	// Verify chat exists and belongs to user
	var chat models.Chat
	err := config.DB.Get(&chat, "SELECT * FROM chats WHERE id=$1 AND user_id=$2", chatID, body.UserID)
	if err != nil {
		if err == sql.ErrNoRows {
			fmt.Printf("DeleteChat: Chat not found - chat_id=%s, user_id=%d\n", chatID, body.UserID)
			c.JSON(http.StatusNotFound, gin.H{"error": "Chat not found or unauthorized"})
		} else {
			fmt.Printf("DeleteChat: Database error: %v\n", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	fmt.Printf("DeleteChat: Chat found, proceeding with deletion - chat_id=%s, user_id=%d\n", chatID, body.UserID)

	// Delete chat (messages will be deleted via CASCADE)
	_, err = config.DB.Exec("DELETE FROM chats WHERE id=$1 AND user_id=$2", chatID, body.UserID)
	if err != nil {
		fmt.Printf("Error deleting chat %s: %v\n", chatID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	fmt.Printf("Deleted chat %s for user %d\n", chatID, body.UserID)
	c.JSON(http.StatusOK, gin.H{"message": "Chat deleted successfully"})
}

// Gemini integration moved to services/gemini.go

// isMessageOnTopic performs a simple check to see if the message mentions the chat topic.
func isMessageOnTopic(message string, topic string) bool {
    m := strings.ToLower(message)
    t := strings.ToLower(strings.TrimSpace(topic))
    if t == "" {
        return true
    }

    // Direct mention of the topic passes
    if strings.Contains(m, t) {
        return true
    }

    // Topic hierarchy and synonyms (minimal, can be expanded or moved to DB later)
    subtopicToCategory := map[string]string{
        "algebra":      "math",
        "geometry":     "math",
        "trigonometry": "math",
        "calculus":     "math",
        "integration":  "math",
        "differentiation": "math",
        "probability":  "math",
        "statistics":   "math",
    }

    categoryKeywords := map[string][]string{
        "math": {
            "math", "mathematics", "algebra", "geometry", "trigonometry",
            "calculus", "integration", "integral", "derivative", "differentiation",
            "probability", "statistics", "equation", "function",
        },
    }

    // Resolve allowed keywords: include the topic itself and, if it belongs to a category, include category terms
    allowed := []string{t}
    if cat, ok := subtopicToCategory[t]; ok {
        allowed = append(allowed, categoryKeywords[cat]...)
    }

    for _, kw := range allowed {
        if kw != "" && strings.Contains(m, kw) {
            return true
        }
    }

    return false
}
