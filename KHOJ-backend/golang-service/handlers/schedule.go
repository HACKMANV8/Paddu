package handlers

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"golang-service/config"
	"golang-service/models"
)

// CreateSchedule creates a quiz reminder schedule from the current chat
func CreateSchedule(c *gin.Context) {
	var body struct {
		UserID        int    `json:"user_id" binding:"required"`
		ChatID        string `json:"chat_id" binding:"required"`
		ScheduledTime string `json:"scheduled_time" binding:"required"` // ISO 8601 format: "2025-10-31T14:30:00Z"
	}

	if err := c.BindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	// Verify chat exists and belongs to user, get topic
	var chat models.Chat
	err := config.DB.Get(&chat, "SELECT * FROM chats WHERE id=$1 AND user_id=$2", body.ChatID, body.UserID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Chat not found or unauthorized"})
		return
	}

	// Parse scheduled time
	scheduledTime, err := time.Parse(time.RFC3339, body.ScheduledTime)
	if err != nil {
		// Try simpler format
		scheduledTime, err = time.Parse("2006-01-02T15:04:05", body.ScheduledTime)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid time format. Use ISO 8601 (e.g., 2025-10-31T14:30:00Z)"})
			return
		}
	}

	// Check if time is in the future
	if scheduledTime.Before(time.Now()) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Scheduled time must be in the future"})
		return
	}

	// Insert schedule
	var scheduleID int
	err = config.DB.QueryRow(`
		INSERT INTO schedules (user_id, chat_id, topic, scheduled_time, active, created_at)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id
	`, body.UserID, body.ChatID, chat.Topic, scheduledTime, true, time.Now()).Scan(&scheduleID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create schedule: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":     "Schedule created successfully",
		"schedule_id": scheduleID,
		"topic":       chat.Topic,
		"scheduled_time": scheduledTime.Format(time.RFC3339),
	})
}

// GetUserSchedules returns all active schedules for a user
func GetUserSchedules(c *gin.Context) {
	userID := c.Param("user_id")
	var schedules []models.Schedule

	err := config.DB.Select(&schedules, `
		SELECT * FROM schedules 
		WHERE user_id=$1 AND active=true 
		ORDER BY scheduled_time ASC
	`, userID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, schedules)
}

// CancelSchedule deactivates a schedule
func CancelSchedule(c *gin.Context) {
	scheduleID := c.Param("id")
	userID := c.Query("user_id") // Optional: verify ownership

	var schedule models.Schedule
	err := config.DB.Get(&schedule, "SELECT * FROM schedules WHERE id=$1", scheduleID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Schedule not found"})
		return
	}

	// Optional: verify user owns this schedule
	if userID != "" {
		if schedule.UserID != parseInt(userID) {
			c.JSON(http.StatusForbidden, gin.H{"error": "Unauthorized"})
			return
		}
	}

	// Deactivate schedule
	_, err = config.DB.Exec("UPDATE schedules SET active=false WHERE id=$1", scheduleID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Schedule cancelled successfully"})
}

// GetDueSchedules returns schedules that are due (scheduled_time <= now, active, not sent)
// Useful for n8n/cron jobs to check what needs reminders
func GetDueSchedules(c *gin.Context) {
	var schedules []models.Schedule

	err := config.DB.Select(&schedules, `
		SELECT * FROM schedules 
		WHERE active=true 
		AND scheduled_time <= NOW()
		AND scheduled_time >= NOW() - INTERVAL '1 hour'
		ORDER BY scheduled_time ASC
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, schedules)
}

func parseInt(s string) int {
	var n int
	fmt.Sscanf(s, "%d", &n)
	return n
}

